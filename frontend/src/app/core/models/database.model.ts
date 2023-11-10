import { Destination } from './destination.model';

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
  settings?: DatabaseSettings;
  destination?: Destination;
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

export interface DatabaseUsage {
  BlockIO: string;
  CPUPerc: string;
  MemPerc: string;
  MemUsage: string;
  NetIO: string;
}

export interface DatabaseSettings {
  id: string;
  databaseId: string;
  isPublic: boolean;
  appendOnly: boolean;
  createdAt: string;
  updatedAt: string;
}
