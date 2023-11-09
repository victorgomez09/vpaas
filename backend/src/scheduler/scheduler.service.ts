import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { readFileSync, statSync, writeFileSync } from 'fs';
import yaml from 'js-yaml';

import { PrismaService } from 'src/prisma/prisma.service';
import { executeCommand } from 'src/utils/command.util';
import { cleanupDockerStorage } from 'src/utils/docker.util';

@Injectable()
export class SchedulerService {
  isDev = process.env.NODE_ENV !== 'production';

  constructor(
    private prisma: PrismaService,
    private http: HttpService,
  ) {}

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
          let templates = readFileSync('../../dev-templates.yml', 'utf8');
          try {
            if (statSync('./testTemplate.yaml')) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              templates =
                templates + readFileSync('../../dev-templates.yml', 'utf8');
            }
          } catch (error) {}
          const response = readFileSync('../../dev-templates.yml', 'utf8');

          writeFileSync(
            './templates.json',
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
          let tags = readFileSync('.../../devTags.json', 'utf8');
          try {
            if (statSync('../../testTags.json')) {
              const testTags = readFileSync('../../testTags.json', 'utf8');
              if (testTags.length > 0) {
                tags = JSON.parse(tags).concat(JSON.parse(testTags));
              }
            }
          } catch (error) {}

          writeFileSync('../../tags.json', tags);
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
}
