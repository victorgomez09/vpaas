import { executeCommand } from './command.util';
import { removeContainer } from './docker.util';

export type AvailableDatabase = {
  name: string;
  fancyName: string;
  baseImage: string;
  baseImageARM?: string;
  versions: string[];
  versionsARM?: string[];
};

export const availableDatabasesAndVersions: AvailableDatabase[] = [
  {
    name: 'mongodb',
    fancyName: 'MongoDB',
    baseImage: 'bitnami/mongodb',
    baseImageARM: 'mongo',
    versions: ['6.0', '5.0', '4.4', '4.2'],
    versionsARM: ['6.0', '5.0', '4.4', '4.2'],
  },
  {
    name: 'mysql',
    fancyName: 'MySQL',
    baseImage: 'bitnami/mysql',
    baseImageARM: 'mysql',
    versions: ['8.0', '5.7'],
    versionsARM: ['8.0', '5.7'],
  },
  {
    name: 'mariadb',
    fancyName: 'MariaDB',
    baseImage: 'bitnami/mariadb',
    baseImageARM: 'mariadb',
    versions: [
      '10.11',
      '10.10',
      '10.9',
      '10.8',
      '10.7',
      '10.6',
      '10.5',
      '10.4',
      '10.3',
      '10.2',
    ],
    versionsARM: [
      '10.11',
      '10.10',
      '10.9',
      '10.8',
      '10.7',
      '10.6',
      '10.5',
      '10.4',
      '10.3',
      '10.2',
    ],
  },
  {
    name: 'postgresql',
    fancyName: 'PostgreSQL',
    baseImage: 'bitnami/postgresql',
    baseImageARM: 'postgres',
    versions: [
      '15.2.0',
      '14.7.0',
      '14.5.0',
      '13.8.0',
      '12.12.0',
      '11.17.0',
      '10.22.0',
    ],
    versionsARM: ['15.2', '14.7', '14.5', '13.8', '12.12', '11.17', '10.22'],
  },
  {
    name: 'redis',
    fancyName: 'Redis',
    baseImage: 'bitnami/redis',
    baseImageARM: 'redis',
    versions: ['7.0', '6.2', '6.0', '5.0'],
    versionsARM: ['7.0', '6.2', '6.0', '5.0'],
  },
  {
    name: 'couchdb',
    fancyName: 'CouchDB',
    baseImage: 'bitnami/couchdb',
    baseImageARM: 'couchdb',
    versions: ['3.3.1', '3.2.2', '3.1.2', '2.3.1'],
    versionsARM: ['3.3', '3.2.2', '3.1.2', '2.3.1'],
  },
  {
    name: 'edgedb',
    fancyName: 'EdgeDB',
    baseImage: 'edgedb/edgedb',
    versions: ['latest', '2.9', '2.8', '2.7'],
  },
];

export function isARM() {
  const arch = process.arch;
  if (arch === 'arm' || arch === 'arm64') {
    return true;
  }

  return false;
}
export function getDatabaseImage(type: string): string {
  const found = availableDatabasesAndVersions.find((t) => t.name === type);
  if (found) {
    if (isARM()) {
      return found.baseImageARM || found.baseImage;
    }

    return found.baseImage;
  }

  return '';
}

type DatabaseConfiguration =
  | {
      volume: string;
      image: string;
      command?: string;
      ulimits: Record<string, unknown>;
      privatePort: number;
      environmentVariables: {
        MYSQL_DATABASE: string;
        MYSQL_PASSWORD: string;
        MYSQL_ROOT_USER: string;
        MYSQL_USER: string;
        MYSQL_ROOT_PASSWORD: string;
      };
    }
  | {
      volume: string;
      image: string;
      command?: string;
      ulimits: Record<string, unknown>;
      privatePort: number;
      environmentVariables: {
        MONGO_INITDB_ROOT_USERNAME?: string;
        MONGO_INITDB_ROOT_PASSWORD?: string;
        MONGODB_ROOT_USER?: string;
        MONGODB_ROOT_PASSWORD?: string;
      };
    }
  | {
      volume: string;
      image: string;
      command?: string;
      ulimits: Record<string, unknown>;
      privatePort: number;
      environmentVariables: {
        MARIADB_ROOT_USER: string;
        MARIADB_ROOT_PASSWORD: string;
        MARIADB_USER: string;
        MARIADB_PASSWORD: string;
        MARIADB_DATABASE: string;
      };
    }
  | {
      volume: string;
      image: string;
      command?: string;
      ulimits: Record<string, unknown>;
      privatePort: number;
      environmentVariables: {
        POSTGRES_PASSWORD?: string;
        POSTGRES_USER?: string;
        POSTGRES_DB?: string;
        POSTGRESQL_POSTGRES_PASSWORD?: string;
        POSTGRESQL_USERNAME?: string;
        POSTGRESQL_PASSWORD?: string;
        POSTGRESQL_DATABASE?: string;
      };
    }
  | {
      volume: string;
      image: string;
      command?: string;
      ulimits: Record<string, unknown>;
      privatePort: number;
      environmentVariables: {
        REDIS_AOF_ENABLED: string;
        REDIS_PASSWORD: string;
      };
    }
  | {
      volume: string;
      image: string;
      command?: string;
      ulimits: Record<string, unknown>;
      privatePort: number;
      environmentVariables: {
        COUCHDB_PASSWORD: string;
        COUCHDB_USER: string;
      };
    }
  | {
      volume: string;
      image: string;
      command?: string;
      ulimits: Record<string, unknown>;
      privatePort: number;
      environmentVariables: {
        EDGEDB_SERVER_PASSWORD: string;
        EDGEDB_SERVER_USER: string;
        EDGEDB_SERVER_DATABASE: string;
        EDGEDB_SERVER_TLS_CERT_MODE: string;
      };
    };

export function generateDatabaseConfiguration(
  database: any,
): DatabaseConfiguration {
  const {
    id,
    dbUser,
    dbUserPassword,
    rootUser,
    rootUserPassword,
    defaultDatabase,
    version,
    type,
  } = database;
  const baseImage = getDatabaseImage(type);
  if (type === 'mysql') {
    const configuration = {
      privatePort: 3306,
      environmentVariables: {
        MYSQL_USER: dbUser,
        MYSQL_PASSWORD: dbUserPassword,
        MYSQL_ROOT_PASSWORD: rootUserPassword,
        MYSQL_ROOT_USER: rootUser,
        MYSQL_DATABASE: defaultDatabase,
      },
      image: `${baseImage}:${version}`,
      volume: `${id}-${type}-data:/bitnami/mysql/data`,
      ulimits: {},
    };
    if (isARM()) {
      configuration.volume = `${id}-${type}-data:/var/lib/mysql`;
    }
    return configuration;
  } else if (type === 'mariadb') {
    const configuration: DatabaseConfiguration = {
      privatePort: 3306,
      environmentVariables: {
        MARIADB_ROOT_USER: rootUser,
        MARIADB_ROOT_PASSWORD: rootUserPassword,
        MARIADB_USER: dbUser,
        MARIADB_PASSWORD: dbUserPassword,
        MARIADB_DATABASE: defaultDatabase,
      },
      image: `${baseImage}:${version}`,
      volume: `${id}-${type}-data:/bitnami/mariadb`,
      ulimits: {},
    };
    if (isARM()) {
      configuration.volume = `${id}-${type}-data:/var/lib/mysql`;
    }
    return configuration;
  } else if (type === 'mongodb') {
    const configuration: DatabaseConfiguration = {
      privatePort: 27017,
      environmentVariables: {
        MONGODB_ROOT_USER: rootUser,
        MONGODB_ROOT_PASSWORD: rootUserPassword,
      },
      image: `${baseImage}:${version}`,
      volume: `${id}-${type}-data:/bitnami/mongodb`,
      ulimits: {},
    };
    if (isARM()) {
      configuration.environmentVariables = {
        MONGO_INITDB_ROOT_USERNAME: rootUser,
        MONGO_INITDB_ROOT_PASSWORD: rootUserPassword,
      };
      configuration.volume = `${id}-${type}-data:/data/db`;
    }
    return configuration;
  } else if (type === 'postgresql') {
    const configuration: DatabaseConfiguration = {
      privatePort: 5432,
      environmentVariables: {
        POSTGRESQL_POSTGRES_PASSWORD: rootUserPassword,
        POSTGRESQL_PASSWORD: dbUserPassword,
        POSTGRESQL_USERNAME: dbUser,
        POSTGRESQL_DATABASE: defaultDatabase,
      },
      image: `${baseImage}:${version}`,
      volume: `${id}-${type}-data:/bitnami/postgresql`,
      ulimits: {},
    };
    if (isARM()) {
      configuration.volume = `${id}-${type}-data:/var/lib/postgresql/data`;
      configuration.environmentVariables = {
        POSTGRES_PASSWORD: dbUserPassword,
        POSTGRES_USER: dbUser,
        POSTGRES_DB: defaultDatabase,
      };
    }
    return configuration;
  } else if (type === 'redis') {
    const {
      settings: { appendOnly },
    } = database;
    const configuration: DatabaseConfiguration = {
      privatePort: 6379,
      command: undefined,
      environmentVariables: {
        REDIS_PASSWORD: dbUserPassword,
        REDIS_AOF_ENABLED: appendOnly ? 'yes' : 'no',
      },
      image: `${baseImage}:${version}`,
      volume: `${id}-${type}-data:/bitnami/redis/data`,
      ulimits: {},
    };
    if (isARM()) {
      configuration.volume = `${id}-${type}-data:/data`;
      configuration.command = `/usr/local/bin/redis-server --appendonly ${
        appendOnly ? 'yes' : 'no'
      } --requirepass ${dbUserPassword}`;
    }
    return configuration;
  } else if (type === 'couchdb') {
    const configuration: DatabaseConfiguration = {
      privatePort: 5984,
      environmentVariables: {
        COUCHDB_PASSWORD: dbUserPassword,
        COUCHDB_USER: dbUser,
      },
      image: `${baseImage}:${version}`,
      volume: `${id}-${type}-data:/bitnami/couchdb`,
      ulimits: {},
    };
    if (isARM()) {
      configuration.volume = `${id}-${type}-data:/opt/couchdb/data`;
    }
    return configuration;
  } else if (type === 'edgedb') {
    const configuration: DatabaseConfiguration = {
      privatePort: 5656,
      environmentVariables: {
        EDGEDB_SERVER_PASSWORD: rootUserPassword,
        EDGEDB_SERVER_USER: rootUser,
        EDGEDB_SERVER_DATABASE: defaultDatabase,
        EDGEDB_SERVER_TLS_CERT_MODE: 'generate_self_signed',
      },
      image: `${baseImage}:${version}`,
      volume: `${id}-${type}-data:/var/lib/edgedb/data`,
      ulimits: {},
    };
    return configuration;
  }
}

export async function stopDatabaseContainer(database: any): Promise<boolean> {
  let everStarted = false;
  const { id, destinationDockerId } = database;
  if (destinationDockerId) {
    try {
      const { stdout } = await executeCommand(
        `docker inspect --format '{{json .State}}' ${id}`,
      );

      if (stdout) {
        everStarted = true;
        await removeContainer({ id });
      }
    } catch (error) {
      //
    }
  }

  return everStarted;
}
