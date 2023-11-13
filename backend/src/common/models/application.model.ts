export interface AppVolume {
  containerPath: string;
  volumeName?: string;
  hostPath?: string;
  mode?: string;
}

export interface AppPort {
  containerPort: number;
  hostPort: number;
  protocol?: 'udp' | 'tcp';

  publishMode?: 'ingress' | 'host';
}

export interface AppEnvVar {
  key: string;
  value: string;
}
