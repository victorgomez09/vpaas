import { Injectable, Logger } from '@nestjs/common';
import * as Docker from 'dockerode';
import * as DockerUtils from 'dockerode/lib/util';

import { dockerConstants } from 'src/common/constants/docker.constant';
import {
  AppEnvVar,
  AppPort,
  AppVolume,
} from 'src/common/models/application.model';
import {
  DockerApiPort,
  DockerAuthObj,
  DockerContainerResource,
  VolumesTypes,
} from 'src/common/models/docker.model';
import { safeParseChunk } from 'src/common/utils/docker.util';

@Injectable()
export class DockerService {
  private dockerode: Docker;

  constructor() {
    if (this.dockerode === null || this.dockerode === undefined) {
      const dockerApiAddressSplited = (
        process.env.VPAAS_DOCKER_API || ''
      ).split(':');
      const connectionParams: Docker.DockerOptions =
        dockerApiAddressSplited.length < 2
          ? {
              socketPath: dockerConstants.dockerSocketPath,
            }
          : dockerApiAddressSplited.length === 2
            ? {
                host: dockerApiAddressSplited[0],
                port: Number(dockerApiAddressSplited[1]),
              }
            : {
                host: `${dockerApiAddressSplited[0]}:${dockerApiAddressSplited[1]}`,
                port: Number(dockerApiAddressSplited[2]),
              };

      connectionParams.version = dockerConstants.dockerApiVersion;

      this.dockerode = new Docker(connectionParams);
    }
  }

  async getDockerVersion() {
    return await this.dockerode.version();
  }

  async getDockerInfo() {
    return await this.dockerode.info();
  }

  async pullImage(
    imageNameIncludingTag: string,
    authObj: DockerAuthObj | undefined,
  ) {
    const parsedTag = DockerUtils.parseRepositoryTag(imageNameIncludingTag);
    const repository = parsedTag.repository;
    const tag = parsedTag.tag || 'latest';

    const stream = await this.dockerode.createImage({
      fromImage: repository,
      tag: tag,
      authconfig: authObj,
    });
    return await new Promise<void>(function (resolve, reject) {
      let errorMessage = '';
      const logsBeforeError: string[] = [];
      for (let i = 0; i < 20; i++) {
        logsBeforeError.push('');
      }

      stream.setEncoding('utf8');

      // THIS BLOCK HAS TO BE HERE. "end" EVENT WON'T GET CALLED OTHERWISE.
      stream.on('data', function (chunkRaw) {
        Logger.debug(`stream data ${chunkRaw}`);
        safeParseChunk(chunkRaw).forEach((chunk) => {
          const chuckStream = chunk.stream;
          if (chuckStream) {
            // Logger.dev('stream data ' + chuckStream);
            logsBeforeError.shift();
            logsBeforeError.push(chuckStream);
          }

          if (chunk.error) {
            Logger.error(chunk.error);
            Logger.error(JSON.stringify(chunk.errorDetail));
            errorMessage += '\n [truncated] \n';
            errorMessage += logsBeforeError.join('');
            errorMessage += '\n';
            errorMessage += chunk.error;
          }
        });
      });

      stream.on('end', function () {
        if (errorMessage) {
          reject(errorMessage);

          return;
        }
        resolve();
      });

      stream.on('error', function (chunk_1) {
        errorMessage += chunk_1;
      });
    });
  }

  async ensureSwarmExists() {
    const data = await this.dockerode.swarmInspect();

    return data.ID;
  }

  async initSwarm(ip: string, portNumber?: number) {
    portNumber = portNumber || 2377;
    const port = `${portNumber}`;

    const advertiseAddr = `${ip}:${port}`;

    const swarmOptions = {
      ListenAddr: `0.0.0.0:${port}`,
      AdvertiseAddr: advertiseAddr,
      ForceNewCluster: false,
    };

    Logger.debug(`Starting swarm at ${advertiseAddr}`);

    return await this.dockerode.swarmInit(swarmOptions);
  }

  async getLeaderNodeId() {
    const nodes = await this.dockerode.listNodes();
    for (let idx = 0; idx < nodes.length; idx++) {
      const node = nodes[idx];
      if (node.ManagerStatus && node.ManagerStatus.Leader) {
        return node.ID;
      }
    }
  }

  /**
   * Creates a new service
   *
   * @param imageName         REQUIRED
   * @param serviceName       REQUIRED
   * @param portsToMap        an array, containerPort & hostPort
   * @param nodeId            node ID on which we lock down the service
   * @param volumeToMount     an array, hostPath & containerPath
   * @param arrayOfEnvKeyAndValue:
   * [
   *    {
   *        key: 'somekey'
   *        value: 'some value'
   *    }
   * ]
   * @param resourcesObject:
   * [
   *    {
   *        Limits:      {   NanoCPUs	, MemoryBytes}
   *        Reservation: {   NanoCPUs	, MemoryBytes}
   *
   * ]
   */
  async createServiceOnNodeId(
    imageName: string,
    serviceName: string,
    portsToMap: AppPort[] | undefined,
    nodeId: string | undefined,
    volumeToMount: AppVolume[] | undefined,
    arrayOfEnvKeyAndValue: AppEnvVar[] | undefined,
    resourcesObject?: DockerContainerResource,
  ) {
    const ports: DockerApiPort[] = [];

    if (portsToMap) {
      for (let i = 0; i < portsToMap.length; i++) {
        const publishMode = portsToMap[i].publishMode;
        const protocol = portsToMap[i].protocol;
        const containerPort = portsToMap[i].containerPort;
        const hostPort = portsToMap[i].hostPort;

        if (protocol) {
          const item: DockerApiPort = {
            Protocol: protocol,
            TargetPort: containerPort,
            PublishedPort: hostPort,
          };

          if (publishMode) {
            item.PublishMode = publishMode;
          }

          ports.push(item);
        } else {
          const tcpItem: DockerApiPort = {
            Protocol: 'tcp',
            TargetPort: containerPort,
            PublishedPort: hostPort,
          };
          const udpItem: DockerApiPort = {
            Protocol: 'udp',
            TargetPort: containerPort,
            PublishedPort: hostPort,
          };
          if (publishMode) {
            tcpItem.PublishMode = publishMode;
            udpItem.PublishMode = publishMode;
          }
          ports.push(tcpItem);
          ports.push(udpItem);
        }
      }
    }

    const dataToCreate: any = {
      name: serviceName,
      TaskTemplate: {
        ContainerSpec: {
          Image: imageName,
        },
        Resources: resourcesObject,
        Placement: {
          Constraints: nodeId ? [`node.id == ${nodeId}`] : [],
        },
        LogDriver: {
          Name: 'json-file',
          Options: {
            'max-size': dockerConstants.defaultMaxLogSize,
          },
        },
      },
      EndpointSpec: {
        Ports: ports,
      },
    };

    if (volumeToMount) {
      const mts = [];
      for (let idx = 0; idx < volumeToMount.length; idx++) {
        const v = volumeToMount[idx];
        if (!v.containerPath) {
          throw new Error(
            'Service Create currently only supports bind volumes.',
          );
        }
        mts.push({
          Source: v.hostPath,
          Target: v.containerPath,
          Type: VolumesTypes.BIND,
          ReadOnly: false,
          Consistency: 'default',
        });
      }

      dataToCreate.TaskTemplate.ContainerSpec.Mounts = mts;
    }

    if (arrayOfEnvKeyAndValue) {
      dataToCreate.TaskTemplate.ContainerSpec.Env = [];

      for (let i = 0; i < arrayOfEnvKeyAndValue.length; i++) {
        const keyVal = arrayOfEnvKeyAndValue[i];
        const newSet = `${keyVal.key}=${keyVal.value}`;
        dataToCreate.TaskTemplate.ContainerSpec.Env.push(newSet);
      }
    }

    return await this.dockerode.createService(dataToCreate);
  }
}
