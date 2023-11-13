export const dockerConstants = {
  dockerSocketPath: '/var/run/docker.sock',
  dockerApiVersion: 'v1.40',
  nginxImageName: 'nginx:1.24',
  certbotImageName: 'caprover/certbot-sleeping:v1.6.0',
  useExistingSwarm: false,
  baseDirectory: '/vpass',
  publishedNameOnDockerHub: 'vpaas/vpaas',
  version: '1.0.0',
  serviceName: 'vpaas-vpaas',
  defaultMaxLogSize: '512m',
  captainServiceExposedPort: 3000,
};
