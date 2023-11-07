import { Injectable } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { Database, DatabaseSecret } from '@prisma/client';
import { writeFileSync } from 'fs';
import { dump } from 'js-yaml';

import { PrismaService } from 'src/prisma/prisma.service';
import { executeCommand } from 'src/utils/command.util';
import {
  AvailableDatabase,
  availableDatabasesAndVersions,
  generateDatabaseConfiguration,
  getDatabaseImage,
  stopDatabaseContainer,
} from 'src/utils/database.util';
import {
  ComposeFile,
  defaultComposeConfiguration,
  makeStandaloneLabel,
} from 'src/utils/docker.util';
import { createDirectories } from 'src/utils/file.util';
import {
  ansiRegex,
  decrypt,
  encrypt,
  generateName,
  generatePassword,
} from 'src/utils/string.util';
import { startTraefikTCPProxy, stopTcpHttpProxy } from 'src/utils/traefik.util';

@Injectable()
export class DatabaseService {
  constructor(private prisma: PrismaService) {}

  async getAllDatabases(): Promise<Database[]> {
    return await this.prisma.database.findMany();
  }

  async getDatabaseById(id: string): Promise<Database> {
    const database = await this.prisma.database.findFirst({
      where: {
        id,
      },
    });

    return database;
  }

  async getDatabaseSecretsById(id: string): Promise<DatabaseSecret[]> {
    let secrets = await this.prisma.databaseSecret.findMany({
      where: {
        databaseId: id,
      },
      orderBy: { createdAt: 'desc' },
    });

    secrets = secrets.map((secret) => {
      secret.value = decrypt(secret.value);
      return secret;
    });

    return secrets;
  }

  async getAvailableDatabases(): Promise<AvailableDatabase[]> {
    return availableDatabasesAndVersions;
  }

  async getAvailableDatabaseByName(name: string): Promise<AvailableDatabase> {
    return availableDatabasesAndVersions.filter((db) => db.name === name)[0];
  }

  async getDatabaseImage(name: string, version: string) {
    const baseImage = getDatabaseImage(name);
    await executeCommand(`docker pull ${baseImage}:${version}`);
  }

  async getDatabaseLogsById(id: string) {
    // let { since = 0 } = request.query;
    // if (since !== 0) {
    //   since = day(since).unix();
    // }
    const since = 0;

    const { destinationDockerId } = await this.prisma.database.findUnique({
      where: { id },
    });

    if (destinationDockerId) {
      try {
        const { stdout, stderr } = await executeCommand(
          `docker logs --since ${since} --tail 5000 --timestamps ${id}`,
        );
        const stripLogsStdout = stdout
          .toString()
          .split('\n')
          .map((l) => ansiRegex(l))
          .filter((a) => a);
        const stripLogsStderr = stderr
          .toString()
          .split('\n')
          .map((l) => ansiRegex(l))
          .filter((a) => a);

        return { logs: stripLogsStderr.concat(stripLogsStdout) };
      } catch (error) {
        const { statusCode } = error;
        if (statusCode === 404) {
          return {
            logs: [],
          };
        }
      }
    }

    return {
      message: 'No logs found.',
    };
  }

  async getDatabaseStatusById(id: string): Promise<{ isRunning: boolean }> {
    try {
      let isRunning = false;

      const database = await this.prisma.database.findFirst({
        where: {
          id,
        },
        include: { destinationDocker: true, settings: true },
      });
      if (database) {
        const { destinationDockerId } = database;
        if (destinationDockerId) {
          try {
            const { stdout } = await executeCommand(
              `docker inspect --format '{{json .State}}' ${id}`,
            );

            if (JSON.parse(stdout).Running) {
              isRunning = true;
            }
          } catch (error) {
            //
          }
        }
      }

      return {
        isRunning,
      };
    } catch ({ status, message }) {
      console.log('status', status);
      console.log('message', message);
      return {
        isRunning: false,
      };
    }
  }

  async create(data: Database) {
    const name = generateName();
    const dbUser = createId();
    const dbUserPassword = encrypt(generatePassword({}));
    const rootUser = createId();
    const rootUserPassword = encrypt(generatePassword({}));
    const defaultDatabase = createId();

    const database = await this.prisma.database.create({
      data: {
        name,
        defaultDatabase,
        dbUser,
        dbUserPassword,
        rootUser,
        rootUserPassword,
        type: data.type,
        version: data.version,
        databaseSecret: {
          create: [
            {
              name: 'dbUserPassword',
              value: dbUserPassword,
            },
            {
              name: 'rootUserPassword',
              value: rootUserPassword,
            },
          ],
        },
        destinationDocker: { connect: { id: data.destinationDockerId } },
        settings: { create: { isPublic: false } },
      },
    });

    return database;
  }

  async startDatabase(id: string) {
    const database = await this.prisma.database.findFirst({
      where: {
        id,
      },
      include: {
        destinationDocker: true,
        settings: true,
        databaseSecret: true,
      },
    });

    if (database.dbUserPassword)
      database.dbUserPassword = decrypt(database.dbUserPassword);
    if (database.rootUserPassword)
      database.rootUserPassword = decrypt(database.rootUserPassword);

    const {
      type,
      destinationDockerId,
      destinationDocker,
      publicPort,
      settings: { isPublic },
      databaseSecret,
    } = database;
    const {
      privatePort,
      command,
      environmentVariables,
      image,
      volume,
      ulimits,
    } = generateDatabaseConfiguration(database);

    const network = destinationDockerId && destinationDocker.network;
    const volumeName = volume.split(':')[0];
    const labels = await makeStandaloneLabel({
      image,
      volume,
      name: database.name,
    });
    const { workdir } = await createDirectories({
      repository: type,
      buildId: id,
    });

    if (databaseSecret.length > 0) {
      databaseSecret.forEach((secret) => {
        environmentVariables[secret.name] = decrypt(secret.value);
      });
    }
    const composeFile: ComposeFile = {
      version: '3.8',
      services: {
        [id]: {
          container_name: id,
          image,
          command,
          environment: environmentVariables,
          volumes: [volume],
          ulimits,
          labels,
          ...defaultComposeConfiguration(network),
        },
      },
      networks: {
        [network]: {
          external: true,
        },
      },
      volumes: {
        [volumeName]: {
          name: volumeName,
        },
      },
    };
    const composeFileDestination = `${workdir}/docker-compose.yaml`;
    writeFileSync(composeFileDestination, dump(composeFile));
    await executeCommand(`docker compose -f ${composeFileDestination} up -d`);

    if (isPublic)
      await startTraefikTCPProxy(
        destinationDocker,
        id,
        publicPort,
        privatePort,
      );

    return {};
  }

  async stopDatabase(id: string) {
    try {
      const database = await this.prisma.database.findFirst({
        where: {
          id,
        },
        include: { destinationDocker: true, settings: true },
      });
      if (database.dbUserPassword)
        database.dbUserPassword = decrypt(database.dbUserPassword);
      if (database.rootUserPassword)
        database.rootUserPassword = decrypt(database.rootUserPassword);
      const everStarted = await stopDatabaseContainer(database);
      if (everStarted)
        await stopTcpHttpProxy(
          id,
          database.destinationDocker,
          database.publicPort,
        );
      await this.prisma.database.update({
        where: { id },
        data: {
          settings: {
            upsert: {
              update: { isPublic: false },
              create: { isPublic: false },
            },
          },
        },
      });
      await this.prisma.database.update({
        where: { id },
        data: { publicPort: null },
      });

      return {};
    } catch ({ status, message }) {
      console.error({ status, message });
    }
  }
}
