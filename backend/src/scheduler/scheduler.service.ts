import { Injectable, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { readFileSync, statSync, writeFileSync } from 'fs';
import { ip as getIpv4, ipv6 as getIpv6 } from 'address';
import * as yaml from 'js-yaml';
import * as path from 'path';

import { PrismaService } from 'src/prisma/prisma.service';
import { executeCommand } from 'src/utils/command.util';
import { generateDatabaseConfiguration } from 'src/utils/database.util';
import { cleanupDockerStorage } from 'src/utils/docker.util';
import {
  startTraefikProxy,
  startTraefikTCPProxy,
} from 'src/utils/traefik.util';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private isDev = process.env.NODE_ENV !== 'production';

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Create public github source
    const github = await this.prisma.gitSource.findFirst({
      where: { htmlUrl: 'https://github.com', forPublic: true },
    });
    if (!github) {
      await this.prisma.gitSource.create({
        data: {
          apiUrl: 'https://api.github.com',
          htmlUrl: 'https://github.com',
          forPublic: true,
          name: 'Github Public',
          type: 'github',
        },
      });
    }
    // Create public gitlab source
    const gitlab = await this.prisma.gitSource.findFirst({
      where: { htmlUrl: 'https://gitlab.com', forPublic: true },
    });
    if (!gitlab) {
      await this.prisma.gitSource.create({
        data: {
          apiUrl: 'https://gitlab.com/api/v4',
          htmlUrl: 'https://gitlab.com',
          forPublic: true,
          name: 'Gitlab Public',
          type: 'gitlab',
        },
      });
    }

    await Promise.all([
      this.getTagsTemplates(),
      this.getArch(),
      this.getIPAddress(),
      // this.configureRemoteDockers(),
      this.refreshTemplates(),
      this.refreshTags(),
      // cleanupStuckedContainers()
    ]);
  }

  @Interval(60000 * 15)
  async cleanUpStorage() {
    const destinationDockers = await this.prisma.destination.findMany();
    const enginesDone = new Set();
    for (const destination of destinationDockers) {
      if (
        enginesDone.has(destination.engine)
        // || enginesDone.has(destination.remoteIpAddress)
      )
        return;
      if (destination.engine) {
        enginesDone.add(destination.engine);
      }
      // if (destination.remoteIpAddress) {
      //   if (!destination.remoteVerified) continue;
      //   enginesDone.add(destination.remoteIpAddress);
      // }
      await cleanupDockerStorage();
    }
  }

  @Interval(60000)
  async cleanupStuckedContainers() {
    try {
      const destinationDockers = await this.prisma.destination.findMany();
      const enginesDone = new Set();
      for (const destination of destinationDockers) {
        if (
          enginesDone.has(destination.engine)
          // ||enginesDone.has(destination.remoteIpAddress)
        )
          return;
        if (destination.engine) {
          enginesDone.add(destination.engine);
        }
        // if (destination.remoteIpAddress) {
        //   if (!destination.remoteVerified) continue;
        //   enginesDone.add(destination.remoteIpAddress);
        // }

        const { stdout: containers } = await executeCommand(
          `docker container ps -a --filter "label=coolify.managed=true" --format '{{ .Names}}'`,
        );
        if (containers) {
          const containersArray = containers.trim().split('\n');
          if (containersArray.length > 0) {
            for (const container of containersArray) {
              const containerId = container.split('-')[0];
              // const application = await prisma.application.findFirst({
              //   where: { id: { startsWith: containerId } },
              // });
              // const service = await prisma.service.findFirst({
              //   where: { id: { startsWith: containerId } },
              // });
              const database = await this.prisma.database.findFirst({
                where: { id: { startsWith: containerId } },
              });
              // if (!application && !service && !database) {
              //   await executeCommand({
              //     command: `docker container rm -f ${container}`,
              //   });
              // }
              if (!database) {
                await executeCommand(`docker container rm -f ${container}`);
              }
            }
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  @Interval(60000 * 10)
  async refreshTemplates() {
    try {
      try {
        if (this.isDev) {
          let templates = readFileSync('dev-templates.yml', 'utf8');
          try {
            if (statSync(path.join(process.cwd(), 'testTemplate.yaml'))) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              templates =
                templates +
                readFileSync(
                  path.join(process.cwd(), 'dev-templates.yml'),
                  'utf8',
                );
            }
          } catch (error) {}
          const response = readFileSync(
            path.join(process.cwd(), 'dev-templates.yml'),
            'utf8',
          );

          writeFileSync(
            path.join(process.cwd(), 'templates.json'),
            JSON.stringify(yaml.load(response)),
          );
        } else {
          // const response = this.http
          //   .get('https://get.coollabs.io/coolify/service-templates.yaml')
          //   .subscribe(async (res) => {
          //     return await res.data;
          //   });
          // // .text();
          // writeFileSync(
          //   '/app/templates.json',
          //   JSON.stringify(yaml.load(response)),
          // );
        }
      } catch (error) {
        console.log(error);
      }
      return {};
    } catch ({ status, message }) {
      console.log('status', status);
      console.log('message', message);
    }
  }

  @Interval(60000 * 10)
  async refreshTags() {
    try {
      try {
        if (this.isDev) {
          let tags = readFileSync(
            path.join(process.cwd(), 'dev-tags.json'),
            'utf8',
          );
          try {
            if (statSync(path.join(process.cwd(), 'test-tags.json'))) {
              const testTags = readFileSync(
                path.join(process.cwd(), 'test-tags.json'),
                'utf8',
              );
              if (testTags.length > 0) {
                tags = JSON.parse(tags).concat(JSON.parse(testTags));
              }
            }
          } catch (error) {}

          writeFileSync(path.join(process.cwd(), 'tags.json'), tags);
        } else {
          // const tags = await got
          //   .get('https://get.coollabs.io/coolify/service-tags.json')
          //   .text();
          // await fs.writeFile('/app/tags.json', tags);
        }
      } catch (error) {
        console.log(error);
      }

      return {};
    } catch ({ status, message }) {
      console.log('status', status);
      console.log('message', message);
    }
  }

  @Interval(60000)
  async checkProxies() {
    try {
      const { default: isReachable } = await import('is-port-reachable');
      let portReachable: boolean;

      const { ipv4, ipv6 } = await this.prisma.setting.findUnique({
        where: { id: '0' },
      });

      // Vpaas proxy local
      const engine = '/var/run/docker.sock';
      const localDocker = await this.prisma.destination.findFirst({
        where: { engine, network: 'vpaas', isProxyUsed: true },
      });
      if (localDocker) {
        portReachable = await isReachable(80, { host: ipv4 || ipv6 });
        if (!portReachable) {
          await startTraefikProxy(localDocker);
        }
      }

      // Vpaas Proxy remote
      // const remoteDocker = await this.prisma.destination.findMany({
      //   where: { remoteEngine: true, remoteVerified: true },
      // });
      // if (remoteDocker.length > 0) {
      //   for (const docker of remoteDocker) {
      //     if (docker.isCoolifyProxyUsed) {
      //       portReachable = await isReachable(80, {
      //         host: docker.remoteIpAddress,
      //       });
      //       if (!portReachable) {
      //         await startTraefikProxy(docker.id);
      //       }
      //     }
      //     try {
      //       await createRemoteEngineConfiguration(docker.id);
      //     } catch (error) {}
      //   }
      // }
      // TCP Proxies
      const databasesWithPublicPort = await this.prisma.database.findMany({
        where: { publicPort: { not: null } },
        include: { settings: true, destinationDocker: true },
      });
      for (const database of databasesWithPublicPort) {
        const { destinationDockerId, destinationDocker, publicPort, id } =
          database;
        if (destinationDockerId && destinationDocker.isProxyUsed) {
          const { privatePort } = generateDatabaseConfiguration(database);
          await startTraefikTCPProxy(
            destinationDocker,
            id,
            publicPort,
            privatePort,
          );
        }
      }
      // const wordpressWithFtp = await prisma.wordpress.findMany({
      //   where: { ftpPublicPort: { not: null } },
      //   include: { service: { include: { destinationDocker: true } } },
      // });
      // for (const ftp of wordpressWithFtp) {
      //   const { service, ftpPublicPort } = ftp;
      //   const { destinationDockerId, destinationDocker, id } = service;
      //   if (destinationDockerId && destinationDocker.isCoolifyProxyUsed) {
      //     await startTraefikTCPProxy(
      //       destinationDocker,
      //       id,
      //       ftpPublicPort,
      //       22,
      //       'wordpressftp',
      //     );
      //   }
      // }

      // HTTP Proxies
      // const minioInstances = await prisma.minio.findMany({
      // 	where: { publicPort: { not: null } },
      // 	include: { service: { include: { destinationDocker: true } } }
      // });
      // for (const minio of minioInstances) {
      // 	const { service, publicPort } = minio;
      // 	const { destinationDockerId, destinationDocker, id } = service;
      // 	if (destinationDockerId && destinationDocker.isCoolifyProxyUsed) {
      // 		await startTraefikTCPProxy(destinationDocker, id, publicPort, 9000);
      // 	}
      // }
    } catch (error) {}
  }

  private async getTagsTemplates() {
    try {
      if (this.isDev) {
        // let templates = readFileSync('../../dev-templates.yml', 'utf8');
        let templates = readFileSync(
          path.join(process.cwd(), 'dev-templates.yml'),
          'utf8',
        );
        let tags = readFileSync(
          path.join(process.cwd(), 'dev-tags.json'),
          'utf8',
        );
        try {
          if (statSync(path.join(process.cwd(), 'test-template.yml'))) {
            templates =
              templates +
              readFileSync(
                path.join(process.cwd(), 'test-template.yml'),
                'utf8',
              );
          }
        } catch (error) {}
        try {
          if (statSync(path.join(process.cwd(), 'test-tags.json'))) {
            const testTags = readFileSync(
              path.join(process.cwd(), 'test-tags.json'),
              'utf8',
            );
            if (testTags.length > 0) {
              tags = JSON.stringify(
                JSON.parse(tags).concat(JSON.parse(testTags)),
              );
            }
          }
        } catch (error) {}

        writeFileSync(
          path.join(process.cwd(), 'templates.json'),
          JSON.stringify(yaml.load(templates)),
        );
        writeFileSync(path.join(process.cwd(), 'tags.json'), tags);
        console.log('[004] Tags and templates loaded in dev mode...');
      } else {
        // const tags = await got
        //   .get('https://get.coollabs.io/coolify/service-tags.json')
        //   .text();
        // const response = await got
        //   .get('https://get.coollabs.io/coolify/service-templates.yaml')
        //   .text();
        // await fs.writeFile(
        //   '/app/templates.json',
        //   JSON.stringify(yaml.load(response)),
        // );
        // await fs.writeFile('/app/tags.json', tags);
        // console.log('[004] Tags and templates loaded...');
      }
    } catch (error) {
      console.log("Couldn't get latest templates.");
      console.log(error);
    }
  }

  private async getArch() {
    try {
      const settings = await this.prisma.setting.findFirst({});
      if (settings && !settings.arch) {
        console.log(`Getting architecture...`);
        await this.prisma.setting.update({
          where: { id: settings.id },
          data: { arch: process.arch },
        });
      }
    } catch (error) {}
  }

  private async getIPAddress() {
    try {
      const settings = await this.prisma.setting.findUnique({
        where: { id: '0' },
      });
      if (!settings.ipv4) {
        const ipv4 = getIpv4();
        console.log(`Getting public IPv4 address: ${ipv4}`);
        await this.prisma.setting.update({
          where: { id: settings.id },
          data: { ipv4 },
        });
      }

      if (!settings.ipv6) {
        const ipv6 = getIpv6();
        console.log(`Getting public IPv6 address: ${ipv6}`);
        await this.prisma.setting.update({
          where: { id: settings.id },
          data: { ipv6 },
        });
      }
    } catch (error) {}
  }
}
