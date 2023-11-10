export interface Service {
  id?: string;
  name?: string;
  fqdn?: string;
  exposePort: number;
  dualCerts?: boolean;
  type: string;
  version?: string;
  templateVersion?: string;
  destinationDockerId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
