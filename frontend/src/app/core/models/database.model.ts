export interface Database {
  id?: string;
  name?: string;
  publicPort?: number;
  defaultDatabase?: string;
  type: string;
  version: string;
  dbUser?: string;
  dbUserPassword?: string;
  rootUser?: string;
  rootUserPassword?: string;
  destinationDockerId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DatabaseSecrets {
  id: string;
  name: string;
  value: string;
  databaseId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailableDatabase {
  name: string;
  fancyName: string;
  baseImage: string;
  baseImageARM?: string;
  versions: string[];
  versionsARM?: string[];
}
