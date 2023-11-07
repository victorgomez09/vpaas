import { executeCommand } from './command.util';

export async function checkContainer({
  container,
  remove = false,
}: {
  dockerId?: string;
  container: string;
  remove?: boolean;
}): Promise<{
  found: boolean;
  status?: { isExited: boolean; isRunning: boolean; isRestarting: boolean };
}> {
  let containerFound = false;
  try {
    const { stdout } = await executeCommand(
      `docker inspect --format '{{json .State}}' ${container}`,
    );
    containerFound = true;
    const parsedStdout = JSON.parse(stdout);
    const status = parsedStdout.Status;
    const isRunning = status === 'running';
    const isRestarting = status === 'restarting';
    const isExited = status === 'exited';
    if (status === 'created') {
      await executeCommand(`docker rm ${container}`);
    }
    if (remove && status === 'exited') {
      await executeCommand(`docker rm ${container}`);
    }

    return {
      found: containerFound,
      status: {
        isRunning,
        isRestarting,
        isExited,
      },
    };
  } catch (err) {
    // Container not found
  }
  return {
    found: false,
  };
}

type StandaloneLabel = {
  image: string;
  volume: string;
  name: string;
};

export async function makeStandaloneLabel({
  image,
  volume,
  name,
}: StandaloneLabel) {
  const version = '1.0.0';
  return [
    'vpaas.managed=true',
    `vpaas.version=${version}`,
    `vpaas.type=standalone-database`,
    `vpaas.name=${name}`,
    `vpaas.configuration=${Buffer.from(
      JSON.stringify({
        version,
        image,
        volume,
      }),
    ).toString('base64')}`,
  ];
}

export type ComposeFile = {
  version: ComposerFileVersion;
  services: Record<string, ComposeFileService>;
  networks: Record<string, ComposeFileNetwork>;
  volumes?: Record<string, ComposeFileVolume>;
};

export type ComposeFileService = {
  container_name: string;
  image?: string;
  networks: string[];
  environment?: Record<string, unknown>;
  volumes?: string[];
  ulimits?: unknown;
  labels?: string[];
  env_file?: string[];
  extra_hosts?: string[];
  restart: ComposeFileRestartOption;
  depends_on?: string[];
  command?: string;
  ports?: string[];
  build?:
    | {
        context: string;
        dockerfile: string;
        args?: Record<string, unknown>;
      }
    | string;
  deploy?: {
    restart_policy?: {
      condition?: string;
      delay?: string;
      max_attempts?: number;
      window?: string;
    };
  };
};

export type ComposerFileVersion =
  | '3.8'
  | '3.7'
  | '3.6'
  | '3.5'
  | '3.4'
  | '3.3'
  | '3.2'
  | '3.1'
  | '3.0'
  | '2.4'
  | '2.3'
  | '2.2'
  | '2.1'
  | '2.0';

export type ComposeFileRestartOption =
  | 'no'
  | 'always'
  | 'on-failure'
  | 'unless-stopped';

export type ComposeFileNetwork = {
  external: boolean;
};

export type ComposeFileVolume = {
  external?: boolean;
  name?: string;
};

export function defaultComposeConfiguration(network: string): any {
  return {
    networks: [network],
    restart: 'on-failure',
    deploy: {
      restart_policy: {
        condition: 'on-failure',
        delay: '5s',
        max_attempts: 10,
        window: '120s',
      },
    },
  };
}

export async function removeContainer({ id }: { id: string }): Promise<void> {
  try {
    const { stdout } = await executeCommand(
      `docker inspect --format '{{json .State}}' ${id}`,
    );
    if (JSON.parse(stdout).Running) {
      await executeCommand(`docker stop -t 0 ${id}`);
      await executeCommand(`docker rm ${id}`);
    }
    if (JSON.parse(stdout).Status === 'exited') {
      await executeCommand(`docker rm ${id}`);
    }
  } catch (error) {
    throw error;
  }
}
