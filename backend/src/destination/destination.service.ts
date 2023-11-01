import { Injectable } from '@nestjs/common';
import { Destination } from '@prisma/client';

import { DatabaseService } from 'src/database/database.service';
import { executeCommand } from 'src/utils/command.util';
import { startTraefikProxy } from 'src/utils/traefik.util';
import { networkName } from './destination.constant';
import { generateName } from 'src/utils/string.utils';

@Injectable()
export class DestinationService {
  constructor(private prisma: DatabaseService) {}

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

  async delete(id: string) {
    return this.prisma.destination.delete({ where: { id } });
  }
}
