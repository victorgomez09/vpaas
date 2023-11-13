import { Injectable, Logger } from '@nestjs/common';
import { Application } from '@prisma/client';
import { setDefaultConfiguration } from 'src/buildpack/common.buildpack';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateName } from 'src/utils/string.util';
import { decryptApplication } from 'src/utils/application.util';
import { setDefaultBaseImage } from 'src/utils/build.pack.util';

@Injectable()
export class ApplicationService {
  constructor(private prisma: PrismaService) {}

  async getBuildPack(id: string) {
    try {
      const application: any = await this.getApplicationFromDB(id);

      return {
        type: application.gitSource?.type || 'dockerRegistry',
        projectId: application.projectId,
        repository: application.repository,
        branch: application.branch,
        apiUrl: application.gitSource?.apiUrl || null,
        isPublicRepository: application.settings.isPublicRepository,
      };
    } catch ({ status, message }) {
      Logger.error('status', status);
      Logger.error('message', message);
    }
  }

  async checkRepository({
    id,
    repository,
    branch,
  }: {
    id: string;
    repository: string;
    branch: string;
  }) {
    try {
      const application = await this.prisma.application.findUnique({
        where: { id },
        include: { gitSource: true },
      });
      const found = await this.prisma.application.findFirst({
        where: {
          branch,
          repository,
          gitSource: { type: application.gitSource.type },
          id: { not: id },
        },
      });

      return {
        used: found ? true : false,
      };
    } catch ({ status, message }) {
      Logger.error('status', status);
      Logger.error('message', message);
    }
  }

  async saveApplicationSource({
    id,
    forPublic,
    gitSourceId,
    simpleDockerfile,
    type,
  }: {
    id: string;
    gitSourceId?: string | null;
    forPublic?: boolean;
    type?: string;
    simpleDockerfile?: string;
  }) {
    let application: Application;
    try {
      if (forPublic) {
        const publicGit = await this.prisma.gitSource.findFirst({
          where: { type, forPublic },
        });

        application = await this.prisma.application.update({
          where: { id },
          data: { gitSource: { connect: { id: publicGit.id } } },
        });
      }
      if (simpleDockerfile) {
        application = await this.prisma.application.update({
          where: { id },
          data: {
            simpleDockerfile,
            settings: { update: { autodeploy: false } },
          },
        });
      }
      if (gitSourceId) {
        application = await this.prisma.application.update({
          where: { id },
          data: { gitSource: { connect: { id: gitSourceId } } },
        });
      }

      return application;
    } catch ({ status, message }) {
      Logger.error('status', status);
      Logger.error('message', message);
    }
  }

  async create(data: any) {
    try {
      const { id } = await this.prisma.application.create({
        data: {
          name: generateName(),
          settings: { create: { debug: false, previews: false } },
        },
      });

      let { port, exposePort, denoOptions } = data;
      const {
        name,
        buildPack,
        fqdn,
        installCommand,
        buildCommand,
        startCommand,
        baseDirectory,
        publishDirectory,
        pythonWSGI,
        pythonModule,
        pythonVariable,
        dockerFileLocation,
        denoMainFile,
        gitCommitHash,
        baseImage,
        baseBuildImage,
        deploymentType,
        baseDatabaseBranch,
        dockerComposeFile,
        dockerComposeFileLocation,
        dockerComposeConfiguration,
        simpleDockerfile,
        dockerRegistryImageName,
        basicAuthPw,
        basicAuthUser,
      } = data;
      if (port) port = Number(port);
      if (exposePort) {
        exposePort = Number(exposePort);
      }
      const {
        destinationDocker: { engine },
        exposePort: configuredPort,
      } = await this.prisma.application.findUnique({
        where: { id },
        include: { destinationDocker: true },
      });
      if (exposePort)
        await this.checkExposedPort({
          id,
          configuredPort,
          exposePort,
          engine,
          //   remoteEngine,
          //   remoteIpAddress,
        });
      if (denoOptions) denoOptions = denoOptions.trim();
      const defaultConfiguration = await setDefaultConfiguration({
        buildPack,
        port,
        installCommand,
        startCommand,
        buildCommand,
        publishDirectory,
        baseDirectory,
        dockerFileLocation,
        dockerComposeFileLocation,
        denoMainFile,
      });
      if (baseDatabaseBranch) {
        await this.prisma.application.update({
          where: { id },
          data: {
            name,
            fqdn,
            exposePort,
            pythonWSGI,
            pythonModule,
            pythonVariable,
            denoOptions,
            baseImage,
            gitCommitHash,
            baseBuildImage,
            deploymentType,
            dockerComposeFile,
            dockerComposeFileLocation,
            dockerComposeConfiguration,
            simpleDockerfile,
            dockerRegistryImageName,
            basicAuthPw,
            basicAuthUser,
            ...defaultConfiguration,
            connectedDatabase: {
              update: { hostedDatabaseDBName: baseDatabaseBranch },
            },
          },
        });
      } else {
        await this.prisma.application.update({
          where: { id },
          data: {
            name,
            fqdn,
            exposePort,
            pythonWSGI,
            pythonModule,
            gitCommitHash,
            pythonVariable,
            denoOptions,
            baseImage,
            baseBuildImage,
            deploymentType,
            dockerComposeFile,
            dockerComposeFileLocation,
            dockerComposeConfiguration,
            simpleDockerfile,
            basicAuthPw,
            basicAuthUser,
            dockerRegistryImageName,
            ...defaultConfiguration,
          },
        });
      }

      return;
    } catch (error) {
      Logger.error(error);
    }
  }

  /** PRIVATE METHODS */
  private async checkExposedPort({
    //     id,
    //     configuredPort,
    //     exposePort,
    //     engine,
    //     _remoteEngine,
    //     _remoteIpAddress,
    //   }: {
    //     id: string;
    //     configuredPort?: number;
    //     exposePort: number;
    //     engine: string;
    //     remoteEngine: boolean;
    //     remoteIpAddress?: string;
    //   }) {
    id,
    configuredPort,
    exposePort,
    engine,
  }: {
    id: string;
    configuredPort?: number;
    exposePort: number;
    engine: string;
  }) {
    if (exposePort < 1024 || exposePort > 65535) {
      throw {
        status: 500,
        message: `Exposed Port needs to be between 1024 and 65535.`,
      };
    }
    if (configuredPort) {
      if (configuredPort !== exposePort) {
        const availablePort = await this.getFreeExposedPort(
          id,
          exposePort,
          engine,
          //   remoteEngine,
          //   remoteIpAddress,
        );
        if (availablePort.toString() !== exposePort.toString()) {
          throw {
            status: 500,
            message: `Port ${exposePort} is already in use.`,
          };
        }
      }
    } else {
      const availablePort = await this.getFreeExposedPort(
        id,
        exposePort,
        engine,
        // remoteEngine,
        // remoteIpAddress,
      );
      if (availablePort.toString() !== exposePort.toString()) {
        throw { status: 500, message: `Port ${exposePort} is already in use.` };
      }
    }
  }

  private async getFreeExposedPort(
    id: string,
    exposePort: number,
    engine: string,
    // remoteEngine,
    // remoteIpAddress,
  ) {
    const { default: checkPort } = await import('is-port-reachable');
    // if (remoteEngine) {
    //   const applicationUsed = await (
    //     await this.prisma.application.findMany({
    //       where: {
    //         exposePort: { not: null },
    //         id: { not: id },
    //         destinationDocker: { remoteIpAddress },
    //       },
    //       select: { exposePort: true },
    //     })
    //   ).map((a) => a.exposePort);
    //   const serviceUsed = await (
    //     await this.prisma.service.findMany({
    //       where: {
    //         exposePort: { not: null },
    //         id: { not: id },
    //         destinationDocker: { remoteIpAddress },
    //       },
    //       select: { exposePort: true },
    //     })
    //   ).map((a) => a.exposePort);
    //   const usedPorts = [...applicationUsed, ...serviceUsed];
    //   if (usedPorts.includes(exposePort)) {
    //     return false;
    //   }
    //   const found = await checkPort(exposePort, { host: remoteIpAddress });
    //   if (!found) {
    //     return exposePort;
    //   }
    //   return false;
    // } else {
    const applicationUsed = await (
      await this.prisma.application.findMany({
        where: {
          exposePort: { not: null },
          id: { not: id },
          destinationDocker: { engine },
        },
        select: { exposePort: true },
      })
    ).map((a) => a.exposePort);
    const serviceUsed = await (
      await this.prisma.service.findMany({
        where: {
          exposePort: { not: null },
          id: { not: id },
          destinationDocker: { engine },
        },
        select: { exposePort: true },
      })
    ).map((a) => a.exposePort);
    const usedPorts = [...applicationUsed, ...serviceUsed];
    if (usedPorts.includes(exposePort)) {
      return false;
    }
    const found = await checkPort(exposePort, { host: 'localhost' });
    if (!found) {
      return exposePort;
    }
    return false;
    // }
  }

  private async getApplicationFromDB(id: string) {
    try {
      let application = await this.prisma.application.findFirst({
        where: {
          id,
        },
        include: {
          destinationDocker: true,
          settings: true,
          gitSource: { include: { githubApp: true, gitlabApp: true } },
          secrets: true,
          persistentStorage: true,
          connectedDatabase: true,
          previewApplication: true,
          dockerRegistry: true,
        },
      });
      if (!application) {
        throw { status: 404, message: 'Application not found.' };
      }
      application = decryptApplication(application);
      const buildPack = application?.buildPack || null;
      const { baseImage, baseBuildImage, baseBuildImages, baseImages } =
        setDefaultBaseImage(buildPack);

      // Set default build images
      if (!application.baseImage) {
        application.baseImage = baseImage;
      }
      if (!application.baseBuildImage) {
        application.baseBuildImage = baseBuildImage;
      }
      return { ...application, baseBuildImages, baseImages };
    } catch ({ status, message }) {
      Logger.error('status', status);
      Logger.error('message', message);
    }
  }
}
