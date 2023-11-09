import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

const isDev = process.env.NODE_ENV !== 'production';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'https://4200-victorgomez09-vpaas-azdjnc9ya1a.ws-eu105.gitpod.io',
    ],
  });

  await Promise.all([
    getTagsTemplates(),
    getArch(),
    getIPAddress(),
    configureRemoteDockers(),
    refreshTemplates(),
    refreshTags(),
    // cleanupStuckedContainers()
  ]);

  await app.listen(3000);
}

async function getIPAddress() {
  const { publicIpv4, publicIpv6 } = await import('public-ip');
  try {
    const settings = await listSettings();
    if (!settings.ipv4) {
      const ipv4 = await publicIpv4({ timeout: 2000 });
      console.log(`Getting public IPv4 address...`);
      await prisma.setting.update({
        where: { id: settings.id },
        data: { ipv4 },
      });
    }

    if (!settings.ipv6) {
      const ipv6 = await publicIpv6({ timeout: 2000 });
      console.log(`Getting public IPv6 address...`);
      await prisma.setting.update({
        where: { id: settings.id },
        data: { ipv6 },
      });
    }
  } catch (error) {}
}
async function getTagsTemplates() {
  const { default: got } = await import('got');
  try {
    if (isDev) {
      let templates = await fs.readFile('./devTemplates.yaml', 'utf8');
      let tags = await fs.readFile('./devTags.json', 'utf8');
      try {
        if (await fs.stat('./testTemplate.yaml')) {
          templates =
            templates + (await fs.readFile('./testTemplate.yaml', 'utf8'));
        }
      } catch (error) {}
      try {
        if (await fs.stat('./testTags.json')) {
          const testTags = await fs.readFile('./testTags.json', 'utf8');
          if (testTags.length > 0) {
            tags = JSON.stringify(
              JSON.parse(tags).concat(JSON.parse(testTags)),
            );
          }
        }
      } catch (error) {}

      await fs.writeFile(
        './templates.json',
        JSON.stringify(yaml.load(templates)),
      );
      await fs.writeFile('./tags.json', tags);
      console.log('[004] Tags and templates loaded in dev mode...');
    } else {
      const tags = await got
        .get('https://get.coollabs.io/coolify/service-tags.json')
        .text();
      const response = await got
        .get('https://get.coollabs.io/coolify/service-templates.yaml')
        .text();
      await fs.writeFile(
        '/app/templates.json',
        JSON.stringify(yaml.load(response)),
      );
      await fs.writeFile('/app/tags.json', tags);
      console.log('[004] Tags and templates loaded...');
    }
  } catch (error) {
    console.log("Couldn't get latest templates.");
    console.log(error);
  }
}
async function initServer() {
  const appId = process.env['COOLIFY_APP_ID'];
  const settings = await prisma.setting.findUnique({ where: { id: '0' } });
  try {
    if (settings.doNotTrack === true) {
      console.log('[000] Telemetry disabled...');
    } else {
      // Initialize Sentry
      // Sentry.init({
      // 	dsn: sentryDSN,
      // 	environment: isDev ? 'development' : 'production',
      // 	release: version
      // });
      // console.log('[000] Sentry initialized...')
    }
  } catch (error) {
    console.error(error);
  }
  try {
    console.log(`[001] Initializing server...`);
    await executeCommand({
      command: `docker network create --attachable coolify`,
    });
  } catch (error) {}
  try {
    console.log(`[002] Cleanup stucked builds...`);
    const isOlder = compareVersions('3.8.1', version);
    if (isOlder === 1) {
      await prisma.build.updateMany({
        where: { status: { in: ['running', 'queued'] } },
        data: { status: 'failed' },
      });
    }
  } catch (error) {}
  try {
    console.log(
      '[003] Cleaning up old build sources under /tmp/build-sources/...',
    );
    if (!isDev)
      await fs.rm('/tmp/build-sources', { recursive: true, force: true });
  } catch (error) {
    console.log(error);
  }
}

async function getArch() {
  try {
    const settings = await prisma.setting.findFirst({});
    if (settings && !settings.arch) {
      console.log(`Getting architecture...`);
      await prisma.setting.update({
        where: { id: settings.id },
        data: { arch: process.arch },
      });
    }
  } catch (error) {}
}

async function configureRemoteDockers() {
  try {
    const remoteDocker = await prisma.destinationDocker.findMany({
      where: { remoteVerified: true, remoteEngine: true },
    });
    if (remoteDocker.length > 0) {
      console.log(`Verifying Remote Docker Engines...`);
      for (const docker of remoteDocker) {
        console.log('Verifying:', docker.remoteIpAddress);
        await verifyRemoteDockerEngineFn(docker.id);
      }
    }
  } catch (error) {
    console.log(error);
  }
}

async function autoUpdater() {
  try {
    const { default: got } = await import('got');
    const currentVersion = version;
    const { coolify } = await got
      .get('https://get.coollabs.io/versions.json', {
        searchParams: {
          appId: process.env['COOLIFY_APP_ID'] || undefined,
          version: currentVersion,
        },
      })
      .json();
    const latestVersion = coolify.main.version;
    const isUpdateAvailable = compareVersions(latestVersion, currentVersion);
    if (isUpdateAvailable === 1) {
      const activeCount = 0;
      if (activeCount === 0) {
        if (!isDev) {
          const { isAutoUpdateEnabled } = await prisma.setting.findFirst();
          if (isAutoUpdateEnabled) {
            let image = `ghcr.io/coollabsio/coolify:${latestVersion}`;
            try {
              await executeCommand({ command: `docker pull ${image}` });
            } catch (error) {
              image = `coollabsio/coolify:${latestVersion}`;
              await executeCommand({ command: `docker pull ${image}` });
            }

            await executeCommand({
              shell: true,
              command: `ls .env || env | grep "^COOLIFY" | sort > .env`,
            });
            await executeCommand({
              command: `sed -i '/COOLIFY_AUTO_UPDATE=/cCOOLIFY_AUTO_UPDATE=${isAutoUpdateEnabled}' .env`,
            });
            await executeCommand({
              shell: true,
              command: `docker run --rm -tid --env-file .env -v /var/run/docker.sock:/var/run/docker.sock -v coolify-db ${image} /bin/sh -c "env | grep "^COOLIFY" | sort > .env && echo 'TAG=${latestVersion}' >> .env && docker stop -t 0 coolify coolify-fluentbit && docker rm coolify coolify-fluentbit && docker compose pull && docker compose up -d --force-recreate"`,
            });
          }
        } else {
          console.log('Updating (not really in dev mode).');
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}

async function checkFluentBit() {
  try {
    if (!isDev) {
      const engine = '/var/run/docker.sock';
      const { id } = await prisma.destinationDocker.findFirst({
        where: { engine, network: 'coolify' },
      });
      const { found } = await checkContainer({
        dockerId: id,
        container: 'coolify-fluentbit',
        remove: true,
      });
      if (!found) {
        await executeCommand({
          shell: true,
          command: `env | grep '^COOLIFY' > .env`,
        });
        await executeCommand({ command: `docker compose up -d fluent-bit` });
      }
    }
  } catch (error) {
    console.log(error);
  }
}
async function checkProxies() {
  try {
    const { default: isReachable } = await import('is-port-reachable');
    let portReachable;

    const { arch, ipv4, ipv6 } = await listSettings();

    // Coolify Proxy local
    const engine = '/var/run/docker.sock';
    const localDocker = await prisma.destinationDocker.findFirst({
      where: { engine, network: 'coolify', isCoolifyProxyUsed: true },
    });
    if (localDocker) {
      portReachable = await isReachable(80, { host: ipv4 || ipv6 });
      if (!portReachable) {
        await startTraefikProxy(localDocker.id);
      }
    }
    // Coolify Proxy remote
    const remoteDocker = await prisma.destinationDocker.findMany({
      where: { remoteEngine: true, remoteVerified: true },
    });
    if (remoteDocker.length > 0) {
      for (const docker of remoteDocker) {
        if (docker.isCoolifyProxyUsed) {
          portReachable = await isReachable(80, {
            host: docker.remoteIpAddress,
          });
          if (!portReachable) {
            await startTraefikProxy(docker.id);
          }
        }
        try {
          await createRemoteEngineConfiguration(docker.id);
        } catch (error) {}
      }
    }
    // TCP Proxies
    const databasesWithPublicPort = await prisma.database.findMany({
      where: { publicPort: { not: null } },
      include: { settings: true, destinationDocker: true },
    });
    for (const database of databasesWithPublicPort) {
      const { destinationDockerId, destinationDocker, publicPort, id } =
        database;
      if (destinationDockerId && destinationDocker.isCoolifyProxyUsed) {
        const { privatePort } = generateDatabaseConfiguration(database, arch);
        await startTraefikTCPProxy(
          destinationDocker,
          id,
          publicPort,
          privatePort,
        );
      }
    }
    const wordpressWithFtp = await prisma.wordpress.findMany({
      where: { ftpPublicPort: { not: null } },
      include: { service: { include: { destinationDocker: true } } },
    });
    for (const ftp of wordpressWithFtp) {
      const { service, ftpPublicPort } = ftp;
      const { destinationDockerId, destinationDocker, id } = service;
      if (destinationDockerId && destinationDocker.isCoolifyProxyUsed) {
        await startTraefikTCPProxy(
          destinationDocker,
          id,
          ftpPublicPort,
          22,
          'wordpressftp',
        );
      }
    }

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

async function copyRemoteCertificates(
  id: string,
  dockerId: string,
  remoteIpAddress: string,
) {
  try {
    await executeCommand({
      command: `scp /tmp/${id}-cert.pem /tmp/${id}-key.pem ${remoteIpAddress}:/tmp/`,
    });
    await executeCommand({
      sshCommand: true,
      shell: true,
      dockerId,
      command: `docker exec coolify-proxy sh -c 'test -d /etc/traefik/acme/custom/ || mkdir -p /etc/traefik/acme/custom/'`,
    });
    await executeCommand({
      sshCommand: true,
      dockerId,
      command: `docker cp /tmp/${id}-key.pem coolify-proxy:/etc/traefik/acme/custom/`,
    });
    await executeCommand({
      sshCommand: true,
      dockerId,
      command: `docker cp /tmp/${id}-cert.pem coolify-proxy:/etc/traefik/acme/custom/`,
    });
  } catch (error) {
    console.log({ error });
  }
}
async function copyLocalCertificates(id: string) {
  try {
    await executeCommand({
      command: `docker exec coolify-proxy sh -c 'test -d /etc/traefik/acme/custom/ || mkdir -p /etc/traefik/acme/custom/'`,
      shell: true,
    });
    await executeCommand({
      command: `docker cp /tmp/${id}-key.pem coolify-proxy:/etc/traefik/acme/custom/`,
    });
    await executeCommand({
      command: `docker cp /tmp/${id}-cert.pem coolify-proxy:/etc/traefik/acme/custom/`,
    });
  } catch (error) {
    console.log({ error });
  }
}

bootstrap();
