import { Injectable } from '@nestjs/common';
import { Destination } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { executeCommand } from 'src/utils/command.util';
import { startTraefikProxy, stopTraefikProxy } from 'src/utils/traefik.util';
import { networkName } from './destination.constant';
import { generateName } from 'src/utils/string.utils';

@Injectable()
export class DestinationService {
  constructor(private prisma: PrismaService) {}

  async getAll(): Promise<Destination[]> {
    return await this.prisma.destination.findMany();
  }

  async getById(id: string): Promise<Destination> {
    return await this.prisma.destination.findFirst({
      where: { id },
    });
  }

  async create(data: Destination): Promise<Destination> {
    if (
      data.engine &&
      (await this.prisma.destination.findFirst({
        where: { engine: data.engine },
      }))
    ) {
      throw new Error('Destination with this engine already exists');
    }

    if (
      await this.prisma.destination.findFirst({
        where: { name: data.name },
      })
    ) {
      throw new Error('Destination with this name already exists');
    }

    data.id = undefined;
    if (!data.name) data.name = generateName();
    if (!data.engine) data.engine = '/var/run/docker.sock';
    if (!data.network)
      data.network = `ntw-${data.name.replace(/\s/g, '_').toLowerCase()}`;

    const { stdout } = await executeCommand(
      `docker network ls --filter 'name=^${
        data.network ? data.network : networkName
      }$' --format '{{json .}}'`,
    );
    if (stdout || stdout === '') {
      await executeCommand(
        `docker network create --attachable ${
          data.network ? data.network : networkName
        }`,
      );
    }

    const destination = await this.prisma.destination.create({ data });
    if (destination.isProxyUsed) {
      await startTraefikProxy(destination);
    }

    return destination;
  }

  async update(id: string, data: Destination): Promise<Destination> {
    return this.prisma.destination.update({ where: { id }, data });
  }

  async updateProxy(id: string, proxyUsed: boolean): Promise<Destination> {
    const destination = await this.prisma.destination.findFirst({
      where: { id },
    });

    if (proxyUsed) {
      await startTraefikProxy(destination);
    } else {
      await stopTraefikProxy(destination);
    }

    return await this.prisma.destination.update({
      where: { id },
      data: { isProxyUsed: proxyUsed },
    });
  }

  async updateProxyForce(id: string): Promise<Destination> {
    const destination = await this.prisma.destination.findFirst({
      where: { id },
    });

    await startTraefikProxy(destination);
    await stopTraefikProxy(destination);

    return await this.prisma.destination.update({
      where: { id },
      data: { isProxyUsed: true },
    });
  }

  async delete(id: string) {
    // Remove services
    // const services = await this.prisma.service.findMany({ where: { destinationDockerId: id } });
    // for (const service of services) {
    //   await removeService({ id: service.id });
    // }

    // Remove applications
    // const applications = await prisma.application.findMany({ where: { destinationDockerId: id } });
    // for (const application of applications) {
    //   await prisma.applicationSettings.deleteMany({ where: { application: { id: application.id } } });
    //   await prisma.buildLog.deleteMany({ where: { applicationId: application.id } });
    //   await prisma.build.deleteMany({ where: { applicationId: application.id } });
    //   await prisma.secret.deleteMany({ where: { applicationId: application.id } });
    //   await prisma.applicationPersistentStorage.deleteMany({ where: { applicationId: application.id } });
    //   await prisma.applicationConnectedDatabase.deleteMany({ where: { applicationId: application.id } });
    //   await prisma.previewApplication.deleteMany({ where: { applicationId: application.id } });
    // }

    // remove databases
    // const databases = await prisma.database.findMany({ where: { destinationDockerId: id } });
    // for (const database of databases) {
    //   await prisma.databaseSettings.deleteMany({ where: { databaseId: database.id } });
    //   await prisma.databaseSecret.deleteMany({ where: { databaseId: database.id } });
    //   await prisma.database.delete({ where: { id: database.id } });
    // }
    await this.prisma.destination.delete({ where: { id } });

    return {};
  }
}
