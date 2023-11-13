export interface DockerAuthObj {
  serveraddress: string;
  username: string;
  password: string;
}

export interface DockerContainerResource {
  Limits?: { NanoCPUs?: number; MemoryBytes?: number };
  Reservation?: { NanoCPUs?: number; MemoryBytes?: number };
}

export interface DockerApiPort {
  Protocol: string;
  TargetPort: number;
  PublishedPort: number;
  PublishMode?: 'ingress' | 'host';
}

export abstract class VolumesTypes {
  public static readonly BIND = 'bind';
  public static readonly VOLUME = 'volume';
}
