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
