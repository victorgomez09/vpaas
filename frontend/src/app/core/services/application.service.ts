import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  constructor(private http: HttpClient) {}

  async loadBranches(id: string) {
    let publicRepositoryLink = '';
    let branchSelectOptions: any = [];

    try {
      publicRepositoryLink = publicRepositoryLink.trim();
      const protocol = publicRepositoryLink.split(':')[0];
      const gitUrl = publicRepositoryLink
        .replace('http://', '')
        .replace('https://', '');

      let [host, ...path] = gitUrl.split('/');
      const [owner, repository, ...branch] = path;

      const ownerName = owner;
      const repositoryName = repository;

      let type = '';
      let branchName = '';
      let projectId = '';
      if (host === 'github.com') {
        host = 'api.github.com';
        type = 'github';
        if (branch[0] === 'tree' && branch[1]) {
          branchName = branch[1];
        }
        if (branch.length === 1) {
          branchName = branch[0];
        }
      }
      if (host === 'gitlab.com') {
        host = 'gitlab.com/api/v4';
        type = 'gitlab';
        if (branch[1] === 'tree' && branch[2]) {
          branchName = branch[2];
        }
        if (branch.length === 1) {
          branchName = branch[0];
        }
      }
      const apiUrl = `${protocol}://${host}`;
      if (type === 'github') {
        this.http
          .get<any>(`${apiUrl}/repos/${ownerName}/${repositoryName}`)
          .subscribe((data) => {
            projectId = data.id.toString();
          });
      }
      if (type === 'gitlab') {
        this.http
          .get<any>(`${apiUrl}/projects/${ownerName}%2F${repositoryName}`)
          .subscribe((data) => {
            projectId = data.id.toString();
          });
      }
      if (type === 'github' && branchName) {
        try {
          this.http
            .get(
              `${apiUrl}/repos/${ownerName}/${repositoryName}/branches/${branchName}`
            )
            .subscribe(async () => {
              await this.saveRepository(
                id,
                branchName,
                ownerName,
                repositoryName,
                projectId,
                type
              );
            });
        } catch (error) {
          console.log('error');
        }
      }
      if (type === 'gitlab' && branchName) {
        try {
          this.http
            .get(
              `${apiUrl}/projects/${ownerName}%2F${repositoryName}/repository/branches/${branchName}`
            )
            .subscribe(async () => {
              await this.saveRepository(
                id,
                branchName,
                ownerName,
                repositoryName,
                projectId,
                type
              );
            });
          return;
        } catch (error) {
          console.log('error', error);
        }
      }
      let branches: any[] = [];
      let page = 1;
      let branchCount = 0;
      this.loadBranchesByPage(
        apiUrl,
        ownerName,
        repositoryName,
        page,
        type
      ).subscribe((data) => {
        branches = branches.concat(data);
        branchCount = branches.length;
      });
      if (branchCount === 100) {
        while (branchCount === 100) {
          page = page + 1;
          this.loadBranchesByPage(
            apiUrl,
            ownerName,
            repositoryName,
            page,
            type
          ).subscribe((data) => {
            branches = branches.concat(data);
            branchCount = branches.length;
          });
        }
      }
      branchSelectOptions = branches.map((branch: any) => ({
        value: branch.name,
        label: branch.name,
      }));
    } catch (error) {
      console.log('error', error);
    }
  }

  async saveRepository(
    id: string,
    branchName: string,
    ownerName: string,
    repositoryName: string,
    projectId: string,
    type: string,
    event?: any
  ) {
    if (event?.detail?.value) {
      branchName = event.detail.value;
    }
    return this.http
      .post(`/applications/${id}/configuration/source`, {
        gitSourceId: null,
        forPublic: true,
        type,
      })
      .subscribe(() => {
        this.http.post(`/applications/${id}/configuration/repository`, {
          repository: `${ownerName}/${repositoryName}`,
          branch: branchName,
          projectId,
          autodeploy: false,
          webhookToken: null,
          isPublicRepository: true,
        });
      });
  }

  async saveBuildpack(
    id: string,
    name: string,
    packageManager = 'npm',
    dockerComposeConfiguration?: string,
    dockerComposeFile?: string,
    dockerComposeFileLocation?: string
  ) {
    const tempBuildPack = JSON.parse(
      JSON.stringify(this.findBuildPack(name, packageManager))
    );

    delete tempBuildPack.name;
    delete tempBuildPack.fancyName;
    delete tempBuildPack.color;
    delete tempBuildPack.hoverColor;
    const composeConfiguration: any = {};

    if (
      !dockerComposeConfiguration &&
      dockerComposeFile &&
      name === 'compose'
    ) {
      const parsed = JSON.parse(dockerComposeFile);
      if (!parsed?.services) {
        throw new Error(
          'No services found in docker-compose file. <br>Choose a different buildpack.'
        );
      }
      for (const [name, _] of Object.entries(parsed.services)) {
        composeConfiguration[name] = {};
      }
    }
    this.http.post(`/applications/${id}`, {
      ...tempBuildPack,
      buildPack: name,
      dockerComposeFile,
      dockerComposeFileLocation,
      dockerComposeConfiguration:
        JSON.stringify(composeConfiguration) || JSON.stringify({}),
    });
    this.http.post(`/applications/${id}/configuration/buildpack`, {
      buildPack: name,
    });
  }

  /** PRIVATE METHODS */
  private loadBranchesByPage(
    apiUrl: string,
    owner: string,
    repository: string,
    page = 1,
    type: string
  ) {
    if (type === 'github') {
      return this.http.get<any>(
        `${apiUrl}/repos/${owner}/${repository}/branches?per_page=100&page=${page}`
      );
    }
    // if (type === 'gitlab') {
    return this.http.get<any>(
      `${apiUrl}/projects/${owner}%2F${repository}/repository/branches?page=${page}`
    );
    // }
  }

  private findBuildPack(pack: string, packageManager = 'npm') {
    const metaData = this.buildPacks.find((b) => b.name === pack);
    if (pack === 'node') {
      return {
        ...metaData,
        ...this.defaultBuildAndDeploy(packageManager),
        buildCommand: null,
        publishDirectory: null,
        port: null,
      };
    }
    if (pack === 'static') {
      return {
        ...metaData,
        installCommand: null,
        buildCommand: null,
        startCommand: null,
        publishDirectory: null,
        port: 80,
      };
    }
    if (pack === 'docker' || pack === 'compose') {
      return {
        ...metaData,
        installCommand: null,
        buildCommand: null,
        startCommand: null,
        publishDirectory: null,
        port: null,
      };
    }

    if (pack === 'svelte') {
      return {
        ...metaData,
        ...this.defaultBuildAndDeploy(packageManager),
        publishDirectory: 'public',
        port: 80,
      };
    }
    if (pack === 'nestjs') {
      return {
        ...metaData,
        ...this.defaultBuildAndDeploy(packageManager),
        startCommand:
          packageManager === 'npm'
            ? 'npm run start:prod'
            : `${packageManager} run start:prod`,
        publishDirectory: null,
        port: 3000,
      };
    }
    if (pack === 'react') {
      return {
        ...metaData,
        ...this.defaultBuildAndDeploy(packageManager),
        publishDirectory: 'build',
        port: 80,
      };
    }
    if (pack === 'nextjs') {
      return {
        ...metaData,
        ...this.defaultBuildAndDeploy(packageManager),
        publishDirectory: null,
        port: 3000,
        deploymentType: 'node',
      };
    }
    if (pack === 'gatsby') {
      return {
        ...metaData,
        ...this.defaultBuildAndDeploy(packageManager),
        publishDirectory: 'public',
        port: 80,
      };
    }
    if (pack === 'vuejs') {
      return {
        ...metaData,
        ...this.defaultBuildAndDeploy(packageManager),
        publishDirectory: 'dist',
        port: 80,
      };
    }
    if (pack === 'nuxtjs') {
      return {
        ...metaData,
        ...this.defaultBuildAndDeploy(packageManager),
        publishDirectory: null,
        port: 3000,
        deploymentType: 'node',
      };
    }
    if (pack === 'preact') {
      return {
        ...metaData,
        ...this.defaultBuildAndDeploy(packageManager),
        publishDirectory: 'build',
        port: 80,
      };
    }
    if (pack === 'php') {
      return {
        ...metaData,
        installCommand: null,
        buildCommand: null,
        startCommand: null,
        publishDirectory: null,
        port: 80,
      };
    }
    if (pack === 'rust') {
      return {
        ...metaData,
        installCommand: null,
        buildCommand: null,
        startCommand: null,
        publishDirectory: null,
        port: 3000,
      };
    }
    if (pack === 'astro') {
      return {
        ...metaData,
        ...this.defaultBuildAndDeploy(packageManager),
        publishDirectory: `dist`,
        port: 80,
      };
    }
    if (pack === 'eleventy') {
      return {
        ...metaData,
        ...this.defaultBuildAndDeploy(packageManager),
        publishDirectory: `_site`,
        port: 80,
      };
    }
    if (pack === 'python') {
      return {
        ...metaData,
        startCommand: null,
        port: 8000,
      };
    }
    if (pack === 'deno') {
      return {
        ...metaData,
        installCommand: null,
        buildCommand: null,
        startCommand: null,
        publishDirectory: null,
        port: 8000,
      };
    }
    if (pack === 'laravel') {
      return {
        ...metaData,
        installCommand: null,
        buildCommand: null,
        startCommand: null,
        publishDirectory: null,
        port: 80,
      };
    }
    if (pack === 'heroku') {
      return {
        ...metaData,
        installCommand: null,
        buildCommand: null,
        startCommand: null,
        publishDirectory: null,
        port: 5000,
      };
    }
    return {
      name: 'node',
      fancyName: 'Node.js',
      hoverColor: 'hover:bg-green-700',
      color: 'bg-green-700',
      installCommand: null,
      buildCommand: null,
      startCommand: null,
      publishDirectory: null,
      port: null,
    };
  }

  private defaultBuildAndDeploy(packageManager: string) {
    return {
      installCommand:
        packageManager === 'npm'
          ? `${packageManager} install`
          : `${packageManager} install`,
      buildCommand:
        packageManager === 'npm'
          ? `${packageManager} run build`
          : `${packageManager} build`,
      startCommand:
        packageManager === 'npm'
          ? `${packageManager} run start`
          : `${packageManager} start`,
    };
  }

  private buildPacks = [
    {
      name: 'node',
      type: 'base',
      fancyName: 'Node.js',
      hoverColor: 'hover:bg-green-700',
      color: 'bg-green-700',
      isCoolifyBuildPack: true,
    },
    {
      name: 'static',
      type: 'base',
      fancyName: 'Static',
      hoverColor: 'hover:bg-orange-700',
      color: 'bg-orange-700',
      isCoolifyBuildPack: true,
    },

    {
      name: 'php',
      type: 'base',
      fancyName: 'PHP',
      hoverColor: 'hover:bg-indigo-700',
      color: 'bg-indigo-700',
      isCoolifyBuildPack: true,
    },
    {
      name: 'laravel',
      type: 'specific',
      base: 'php',
      fancyName: 'Laravel',
      hoverColor: 'hover:bg-indigo-700',
      color: 'bg-indigo-700',
      isCoolifyBuildPack: true,
    },
    {
      name: 'docker',
      type: 'base',
      fancyName: 'Docker',
      hoverColor: 'hover:bg-sky-700',
      color: 'bg-sky-700',
      isCoolifyBuildPack: true,
    },
    {
      name: 'compose',
      type: 'base',
      fancyName: 'Docker Compose',
      hoverColor: 'hover:bg-sky-700',
      color: 'bg-sky-700',
      isCoolifyBuildPack: true,
    },
    {
      name: 'svelte',
      type: 'specific',
      base: 'node',
      fancyName: 'Svelte',
      hoverColor: 'hover:bg-orange-700',
      color: 'bg-orange-700',
      isCoolifyBuildPack: true,
    },
    {
      name: 'vuejs',
      type: 'specific',
      base: 'node',
      fancyName: 'VueJS',
      hoverColor: 'hover:bg-green-700',
      color: 'bg-green-700',
      isCoolifyBuildPack: true,
    },
    {
      name: 'nuxtjs',
      type: 'specific',
      base: 'node',
      fancyName: 'NuxtJS',
      hoverColor: 'hover:bg-green-700',
      color: 'bg-green-700',
      isCoolifyBuildPack: true,
    },
    {
      name: 'gatsby',
      type: 'specific',
      base: 'node',
      fancyName: 'Gatsby',
      hoverColor: 'hover:bg-blue-700',
      color: 'bg-blue-700',
      isCoolifyBuildPack: true,
    },
    {
      name: 'astro',
      type: 'specific',
      base: 'node',
      fancyName: 'Astro',
      hoverColor: 'hover:bg-pink-700',
      color: 'bg-pink-700',
      isCoolifyBuildPack: true,
    },
    {
      name: 'eleventy',
      type: 'specific',
      base: 'node',
      fancyName: 'Eleventy',
      hoverColor: 'hover:bg-red-700',
      color: 'bg-red-700',
      isCoolifyBuildPack: true,
    },
    {
      name: 'react',
      type: 'specific',
      base: 'node',
      fancyName: 'React',
      hoverColor: 'hover:bg-blue-700',
      color: 'bg-blue-700',
      isCoolifyBuildPack: true,
    },
    {
      name: 'preact',
      type: 'specific',
      base: 'node',
      fancyName: 'Preact',
      hoverColor: 'hover:bg-blue-700',
      color: 'bg-blue-700',
      isCoolifyBuildPack: true,
    },
    {
      name: 'nextjs',
      type: 'specific',
      base: 'node',
      fancyName: 'NextJS',
      hoverColor: 'hover:bg-blue-700',
      color: 'bg-blue-700',
      isCoolifyBuildPack: true,
    },
    {
      name: 'nestjs',
      type: 'specific',
      base: 'node',
      fancyName: 'NestJS',
      hoverColor: 'hover:bg-red-700',
      color: 'bg-red-700',
      isCoolifyBuildPack: true,
    },
    {
      name: 'rust',
      type: 'base',
      fancyName: 'Rust',
      hoverColor: 'hover:bg-pink-700',
      color: 'bg-pink-700',
      isCoolifyBuildPack: true,
    },
    {
      name: 'python',
      type: 'base',
      fancyName: 'Python',
      hoverColor: 'hover:bg-green-700',
      color: 'bg-green-700',
      isCoolifyBuildPack: true,
    },
    {
      name: 'deno',
      type: 'base',
      fancyName: 'Deno',
      hoverColor: 'hover:bg-green-700',
      color: 'bg-green-700',
      isCoolifyBuildPack: true,
    },
    {
      name: 'heroku',
      type: 'base',
      fancyName: 'Heroku',
      hoverColor: 'hover:bg-purple-700',
      color: 'bg-purple-700',
      isHerokuBuildPack: true,
    },
  ];
}
