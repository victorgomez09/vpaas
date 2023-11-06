import { Injectable } from '@nestjs/common';
import { Database } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

import { PrismaService } from 'src/prisma/prisma.service';
import {
  encrypt,
  generateName,
  generatePassword,
} from 'src/utils/string.utils';
import {
  AvailableDatabase,
  availableDatabasesAndVersions,
  getDatabaseImage,
} from 'src/utils/database.util';
import { executeCommand } from 'src/utils/command.util';

@Injectable()
export class DatabaseService {
  constructor(private prisma: PrismaService) {}

  getAvailableDatabases(): AvailableDatabase[] {
    return availableDatabasesAndVersions;
  }

  async getDatabaseImage(name: string, version: string) {
    const baseImage = getDatabaseImage(name);
    await executeCommand(`docker pull ${baseImage}:${version}`);
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
        destinationDocker: { connect: { id: data.destinationDockerId } },
        settings: { create: { isPublic: false } },
      },
    });

    return database;
  }
}
