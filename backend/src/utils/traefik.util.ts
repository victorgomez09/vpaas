import { Destination } from '@prisma/client';
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
    console.log('test', vpaasNetwork);

    if (!vpaasNetwork) {
      await executeCommand(`docker network create --attachable vpaas-infra`);
    }

    const { stdout: Config } = await executeCommand(
      `docker network inspect ${network} --format '{{json .IPAM.Config }}'`,
    );
    console.log('stdout', Config);
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
