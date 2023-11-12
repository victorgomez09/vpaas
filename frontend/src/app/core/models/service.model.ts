import { Destination } from './destination.model';

export interface Service {
  id?: string;
  name?: string;
  fqdn?: string;
  exposePort: number;
  dualCerts?: boolean;
  type: string;
  version?: string;
  templateVersion?: string;
  destinationDockerId: string;
  destinationDocker?: Destination;
  serviceSetting?: ServiceSettings[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServiceSettings {
  id: string;
  name: string;
  serviceId: string;
  value: string;
  variableName: string;
  createdAt: Date;
  updatedAt: Date;
}
