import { Destination } from '@prisma/client';

import fs from 'fs/promises';
import yaml from 'js-yaml';

import { executeCommand } from './command.util';
import { checkContainer } from './docker.util';

export function getAPIUrl() {
  if (process.env.GITPOD_WORKSPACE_URL) {
    const { href } = new URL(process.env.GITPOD_WORKSPACE_URL);
    const newURL = href.replace('https://', 'https://3001-').replace(/\/$/, '');
    return newURL;
  }
  if (process.env.CODESANDBOX_HOST) {
    return `https://${process.env.CODESANDBOX_HOST.replace(/\$PORT/, '3001')}`;
  }

  return process.env.NODE_ENV === 'production'
    ? 'http://host.docker.internal:3001'
    : 'http://localhost:3000';
}

const mainTraefikEndpoint =
  process.env.NODE_ENV === 'production'
    ? `${getAPIUrl()}/webhooks/traefik/main.json`
    : 'http://coolify:3000/webhooks/traefik/main.json';

export const isDev = process.env.NODE_ENV === 'development';
export const proxyPort = process.env.COOLIFY_PROXY_PORT;
export const proxySecurePort = process.env.COOLIFY_PROXY_SECURE_PORT;
export const defaultTraefikImage = `traefik:v2.8`;

export async function startTraefikProxy(
  destination: Destination,
): Promise<void> {
  const { engine, network } = destination;
  const { found } = await checkContainer({
    container: 'vpaas-proxy',
    remove: true,
  });

  if (!found) {
    const { stdout: vpaasNetwork } = await executeCommand(
      `docker network ls --filter 'name=vpaas-infra' --no-trunc --format "{{json .}}"`,
    );

    if (!vpaasNetwork) {
      await executeCommand(`docker network create --attachable vpaas-infra`);
    }

    const { stdout: Config } = await executeCommand(
      `docker network inspect ${network} --format '{{json .IPAM.Config }}'`,
    );
    const ip = JSON.parse(Config)[0].Gateway;
    const traefikUrl = mainTraefikEndpoint;
    await executeCommand(`docker run --restart always \
			--add-host 'host.docker.internal:host-gateway' \
			${ip ? `--add-host 'host.docker.internal:${ip}'` : ''} \
			-v vpaas-traefik-letsencrypt:/etc/traefik/acme \
			-v /var/run/docker.sock:/var/run/docker.sock \
			--network vpaas-infra \
			-p ${proxyPort ? `${proxyPort}:80` : `80:80`} \
			-p ${proxySecurePort ? `${proxySecurePort}:443` : `443:443`} \
			${isDev ? '-p "8080:8080"' : ''} \
			--name vpaas-proxy \
			-d ${defaultTraefikImage} \
			${isDev ? '--api.insecure=true' : ''} \
			--entrypoints.web.address=:80 \
			--entrypoints.web.forwardedHeaders.insecure=true \
			--entrypoints.websecure.address=:443 \
			--entrypoints.websecure.forwardedHeaders.insecure=true \
			--providers.docker=true \
			--providers.docker.exposedbydefault=false \
			--providers.http.endpoint=${traefikUrl} \
			--providers.http.pollTimeout=5s \
			--certificatesresolvers.letsencrypt.acme.httpchallenge=true \
			--certificatesresolvers.letsencrypt.acme.storage=/etc/traefik/acme/acme.json \
			--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web \
			--log.level=error`);
  }
  // Configure networks for local docker engine
  if (engine) {
    await configureNetworkTraefikProxy(destination);
  }
}

export async function stopTraefikProxy(
  destination: Destination,
): Promise<{ stdout: string; stderr: string } | Error> {
  const { found } = await checkContainer({
    dockerId: destination.id,
    container: 'vpaas-proxy',
  });

  try {
    if (found) {
      await executeCommand(
        `docker stop -t 0 vpaas-proxy && docker rm vpaas-proxy`,
      );
    }
  } catch (error) {
    return error;
  }
}

export async function configureNetworkTraefikProxy(
  destination: Destination,
): Promise<void> {
  const { stdout: networks } = await executeCommand(
    `docker ps -a --filter name=vpaas-proxy --format '{{json .Networks}}'`,
  );
  const configuredNetworks = networks
    .replace(/"/g, '')
    .replace('\n', '')
    .split(',');
  if (!configuredNetworks.includes(destination.network)) {
    await executeCommand(
      `docker network connect ${destination.network} vpaas-proxy`,
    );
  }
}

const otherTraefikEndpoint = isDev
  ? `${getAPIUrl()}/webhooks/traefik/other.json`
  : 'http://coolify:3000/webhooks/traefik/other.json';

export async function startTraefikTCPProxy(
  destinationDocker: any,
  id: string,
  publicPort: number,
  privatePort: number,
  type?: string,
): Promise<{ stdout: string; stderr: string } | Error> {
  const { network, id: dockerId, remoteEngine } = destinationDocker;
  const container = `${id}-${publicPort}`;
  const { found } = await checkContainer({ dockerId, container, remove: true });
  const { publicIpv4, publicIpv6 } = await import('public-ip');
  const ipv4 = await publicIpv4({ timeout: 2000 });
  const ipv6 = await publicIpv6({ timeout: 2000 });

  let dependentId = id;
  if (type === 'wordpressftp') dependentId = `${id}-ftp`;
  const { found: foundDependentContainer } = await checkContainer({
    dockerId,
    container: dependentId,
    remove: true,
  });
  try {
    if (foundDependentContainer && !found) {
      const { stdout: Config } = await executeCommand(
        `docker network inspect ${network} --format '{{json .IPAM.Config }}'`,
      );

      const ip = JSON.parse(Config)[0].Gateway;
      let traefikUrl = otherTraefikEndpoint;
      if (remoteEngine) {
        let ip = null;
        if (isDev) {
          ip = getAPIUrl();
        } else {
          ip = `http://${ipv4 || ipv6}:3000`;
        }
        traefikUrl = `${ip}/webhooks/traefik/other.json`;
      }

      const tcpProxy = {
        version: '3.8',
        services: {
          [`${id}-${publicPort}`]: {
            container_name: container,
            image: defaultTraefikImage,
            command: [
              `--entrypoints.tcp.address=:${publicPort}`,
              `--entryPoints.tcp.forwardedHeaders.insecure=true`,
              `--providers.http.endpoint=${traefikUrl}?id=${id}&privatePort=${privatePort}&publicPort=${publicPort}&type=tcp&address=${dependentId}`,
              '--providers.http.pollTimeout=10s',
              '--log.level=error',
            ],
            ports: [`${publicPort}:${publicPort}`],
            extra_hosts: [
              'host.docker.internal:host-gateway',
              `host.docker.internal: ${ip}`,
            ],
            volumes: ['/var/run/docker.sock:/var/run/docker.sock'],
            networks: ['coolify-infra', network],
          },
        },
        networks: {
          [network]: {
            external: false,
            name: network,
          },
          'coolify-infra': {
            external: false,
            name: 'coolify-infra',
          },
        },
      };
      await fs.writeFile(`/tmp/docker-compose-${id}.yaml`, yaml.dump(tcpProxy));
      await executeCommand(
        `docker compose -f /tmp/docker-compose-${id}.yaml up -d`,
      );
      await fs.rm(`/tmp/docker-compose-${id}.yaml`);
    }
    if (!foundDependentContainer && found) {
      await executeCommand(
        `docker stop -t 0 ${container} && docker rm ${container}`,
      );
    }
  } catch (error) {
    return error;
  }
}

export async function stopTcpHttpProxy(
  id: string,
  destinationDocker: any,
  publicPort: number,
  forceName: string = null,
): Promise<{ stdout: string; stderr: string } | Error> {
  const { id: dockerId } = destinationDocker;
  let container = `${id}-${publicPort}`;
  if (forceName) container = forceName;
  const { found } = await checkContainer({ dockerId, container });
  try {
    if (found) {
      return await executeCommand(
        `docker stop -t 0 ${container} && docker rm ${container}`,
      );
    }
  } catch (error) {
    return error;
  }
}
