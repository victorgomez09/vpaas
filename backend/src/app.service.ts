import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ip as publicIpv4 } from 'address';

import { DockerService } from './common/services/docker/docker.service';
import { dockerConstants } from './common/constants/docker.constant';
import { AppEnvVar, AppPort } from './common/models/application.model';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private docker: DockerService) {}

  onModuleInit() {
    this.install();
  }

  async checkSystemReq() {
    try {
      const output = await this.docker.getDockerVersion();
      console.log(' ');
      console.log(' ');
      console.log(' ');
      console.log(' >>> Checking System Compatibility <<<');

      const ver = output.Version.split('.');
      const maj = Number(ver[0]);
      const min = Number(ver[1]);

      let versionOk = false;

      if (maj > 17) {
        versionOk = true;
      } else if (maj === 17 && min >= 6) {
        versionOk = true;
      }

      if (versionOk) {
        console.log('   Docker Version passed.');
      } else {
        console.log(
          'Warning!! Minimum Docker version is 17.06.x CapRover may not run properly on your Docker version.',
        );
      }
      const output_1 = await this.docker.getDockerInfo();
      if (output_1.OperatingSystem.toLowerCase().indexOf('ubuntu') < 0) {
        console.log(
          '******* Warning *******    CapRover and Docker work best on Ubuntu - specially when it comes to storage drivers.',
        );
      } else {
        console.log('   Ubuntu detected.');
      }

      const totalMemInMb = Math.round(output_1.MemTotal / 1000 / 1000);

      if (totalMemInMb < 1000) {
        console.log(
          '******* Warning *******   With less than 1GB RAM, Docker builds might fail, see CapRover system requirements.',
        );
      } else {
        console.log(`   Total RAM ${totalMemInMb} MB`);
      }
    } catch (error) {
      console.log(' ');
      console.log(' ');
      console.log('**** WARNING!!!! System requirement check failed!  *****');
      console.log(' ');
      console.log(' ');
      console.error(error);
    }
  }

  async install() {
    //   const backupManger = new BackupManager();
    let ipv4 = null;

    try {
      console.log('     ');
      console.log(' Installation of CapRover is starting...     ');
      console.log(
        'For troubleshooting, please see: https://caprover.com/docs/troubleshooting.html',
      );
      console.log('     ');
      console.log('     ');

      await this.checkSystemReq();

      if (process.env.MAIN_NODE_IP_ADDRESS) {
        ipv4 = process.env.MAIN_NODE_IP_ADDRESS;
      } else {
        ipv4 = publicIpv4();
      }

      console.log(`Pulling: ${dockerConstants.nginxImageName}`);
      await this.docker.pullImage(dockerConstants.nginxImageName, undefined);

      console.log(`Pulling: ${dockerConstants.certbotImageName}`);
      await this.docker.pullImage(dockerConstants.certbotImageName, undefined);

      if (dockerConstants.useExistingSwarm) {
        await this.docker.ensureSwarmExists();
      }
      await this.docker.initSwarm(ipv4);

      const nodeId = await this.docker.getLeaderNodeId();
      const volumeToMount = [
        {
          hostPath: dockerConstants.baseDirectory,
          containerPath: dockerConstants.baseDirectory,
        },
      ];

      const env = [] as AppEnvVar[];
      env.push({
        key: 'IS_VPAAS_INSTANCE',
        value: '1',
      });

      if (process.env.DEFAULT_PASSWORD) {
        env.push({
          key: 'DEFAULT_PASSWORD',
          value: process.env.DEFAULT_PASSWORD,
        });
      }

      if (process.env.VPAAS_DOCKER_API) {
        env.push({
          key: 'VPAAS_DOCKER_API',
          value: process.env.VPAAS_DOCKER_API,
        });
      } else {
        volumeToMount.push({
          hostPath: dockerConstants.dockerSocketPath,
          containerPath: dockerConstants.dockerSocketPath,
        });
      }

      if (process.env.VPAAS_BASE_DIRECTORY) {
        env.push({
          key: 'VPAAS_BASE_DIRECTORY',
          value: process.env.VPAAS_BASE_DIRECTORY,
        });
      }

      const ports: AppPort[] = [];

      const captainNameAndVersion = `${dockerConstants.publishedNameOnDockerHub}:${dockerConstants.version}`;

      ports.push({
        protocol: 'tcp',
        publishMode: 'host',
        containerPort: dockerConstants.captainServiceExposedPort,
        hostPort: dockerConstants.captainServiceExposedPort,
      });

      await this.docker.createServiceOnNodeId(
        captainNameAndVersion,
        dockerConstants.serviceName,
        ports,
        nodeId,
        volumeToMount,
        env,
        {
          Reservation: {
            MemoryBytes: 100 * 1024 * 1024,
          },
        },
      );

      console.log('*** Vpaas is initializing ***');
      console.log(
        'Please wait at least 60 seconds before trying to access Vpaas.',
      );
    } catch (error) {
      Logger.error(error);
    }

    Promise.resolve();
    //   if (CaptainConstants.isDebug) {
    //     return new Promise<string>(function (resolve, reject) {
    //       DockerApi.get()
    //         .swarmLeave(true)
    //         .then(function (ignore) {
    //           resolve(ip4);
    //         })
    //         .catch(function (error) {
    //           if (error && error.statusCode === 503) {
    //             resolve(ip4);
    //           } else {
    //             reject(error);
    //           }
    //         });
    //     });
    //   } else {
    //     return ip4;
    //   }
    // })
    // .then(function () {
    //   const imageName = CaptainConstants.configs.appPlaceholderImageName;
    //   console.log(`Pulling: ${imageName}`);
    //   return DockerApi.get().pullImage(imageName, undefined);
    // })
    // .then(function () {
    //   return backupManger.checkAndPrepareRestoration();
    // })
    // .then(function (swarmId: string) {
    //   console.log(`Swarm started: ${swarmId}`);
    //   return backupManger.startRestorationIfNeededPhase1(myIp4);
    // })
  }
}
