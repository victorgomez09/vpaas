import { Injectable } from '@nestjs/common';
import { Service } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from 'src/prisma/prisma.service';
import {
  fixType,
  getDomain,
  getTags,
  getTemplates,
} from 'src/utils/service.util';
import { decrypt, generateName } from 'src/utils/string.util';

@Injectable()
export class ServiceService {
  constructor(private prisma: PrismaService) {}

  getAvailableServices(): any[] {
    return getTemplates();
  }

  async getAll(): Promise<Service[]> {
    return await this.prisma.service.findMany();
  }

  async getServiceType(id: string) {
    try {
      const service = await this.getServiceFromDB(id);
      if (!service) {
        throw { status: 404, message: 'Service not found.' };
      }
      let template = {};
      let tags = [];
      if (service.type) {
        template = await this.parseAndFindServiceTemplates(service);
        tags = await getTags(service.type);
      }
      return {
        settings: await this.prisma.setting.findFirst({ where: { id: '0' } }),
        service,
        template,
        tags,
      };
    } catch ({ status, message }) {
      console.log('status', status);
      console.log('message', message);
    }
  }

  async create(data: Service) {
    return this.prisma.service.create({
      data: {
        ...data,
        name: generateName(),
      },
    });
  }

  private async getServiceFromDB(id: string): Promise<any> {
    const settings = await this.prisma.setting.findFirst();
    const body = await this.prisma.service.findFirst({
      where: {
        id,
      },
      include: {
        destinationDocker: true,
        persistentStorage: true,
        serviceSecret: true,
        serviceSetting: true,
        wordpress: true,
        plausibleAnalytics: true,
      },
    });
    if (!body) {
      return null;
    }
    // body.type = fixType(body.type);

    if (body?.serviceSecret.length > 0) {
      body.serviceSecret = body.serviceSecret.map((s) => {
        s.value = decrypt(s.value);
        return s;
      });
    }
    if (body.wordpress) {
      body.wordpress.ftpPassword = decrypt(body.wordpress.ftpPassword);
    }

    return { ...body, settings };
  }

  private async parseAndFindServiceTemplates(
    service: any,
    workdir?: string,
    isDeploy: boolean = false,
  ) {
    const templates = await getTemplates();
    const foundTemplate = templates.find(
      (t) => fixType(t.type) === service.type,
    );
    let parsedTemplate = {};
    if (foundTemplate) {
      if (!isDeploy) {
        for (const [key, value] of Object.entries<any>(
          foundTemplate.services,
        )) {
          const realKey = key.replace('$$id', service.id);
          let name = value.name;
          if (!name) {
            if (Object.keys(foundTemplate.services).length === 1) {
              name = foundTemplate.name || service.name.toLowerCase();
            } else {
              if (key === '$$id') {
                name =
                  foundTemplate.name ||
                  key.replaceAll('$$id-', '') ||
                  service.name.toLowerCase();
              } else {
                name =
                  key.replaceAll('$$id-', '') || service.name.toLowerCase();
              }
            }
          }
          parsedTemplate[realKey] = {
            value,
            name,
            documentation:
              value.documentation ||
              foundTemplate.documentation ||
              'https://docs.coollabs.io',
            image: value.image,
            files: value?.files,
            environment: [],
            fqdns: [],
            hostPorts: [],
            proxy: {},
          };
          if (value.environment?.length > 0) {
            for (const env of value.environment) {
              // eslint-disable-next-line prefer-const
              let [envKey, ...envValue] = env.split('=');
              envValue = envValue.join('=');
              let variable = null;
              if (foundTemplate?.variables) {
                variable =
                  foundTemplate?.variables.find((v) => v.name === envKey) ||
                  foundTemplate?.variables.find((v) => v.id === envValue);
              }
              if (variable) {
                const id = variable.id.replaceAll('$$', '');
                const label = variable?.label;
                const description = variable?.description;
                const defaultValue = variable?.defaultValue;
                const main = variable?.main || '$$id';
                const type = variable?.type || 'input';
                const placeholder = variable?.placeholder || '';
                const readOnly = variable?.readOnly || false;
                const required = variable?.required || false;
                if (
                  envValue.startsWith('$$config') ||
                  variable?.showOnConfiguration
                ) {
                  if (envValue.startsWith('$$config_coolify')) {
                    continue;
                  }
                  parsedTemplate[realKey].environment.push({
                    id,
                    name: envKey,
                    value: envValue,
                    main,
                    label,
                    description,
                    defaultValue,
                    type,
                    placeholder,
                    required,
                    readOnly,
                  });
                }
              }
            }
          }
          if (value?.proxy && value.proxy.length > 0) {
            for (const proxyValue of value.proxy) {
              if (proxyValue.domain) {
                const variable = foundTemplate?.variables.find(
                  (v) => v.id === proxyValue.domain,
                );
                if (variable) {
                  const {
                    id,
                    name,
                    label,
                    description,
                    defaultValue,
                    required = false,
                  } = variable;
                  const found = await this.prisma.serviceSetting.findFirst({
                    where: {
                      serviceId: service.id,
                      variableName: proxyValue.domain,
                    },
                  });
                  parsedTemplate[realKey].fqdns.push({
                    id,
                    name,
                    value: found?.value || '',
                    label,
                    description,
                    defaultValue,
                    required,
                  });
                }
              }
              if (proxyValue.hostPort) {
                const variable = foundTemplate?.variables.find(
                  (v) => v.id === proxyValue.hostPort,
                );
                if (variable) {
                  const {
                    id,
                    name,
                    label,
                    description,
                    defaultValue,
                    required = false,
                  } = variable;
                  const found = await this.prisma.serviceSetting.findFirst({
                    where: {
                      serviceId: service.id,
                      variableName: proxyValue.hostPort,
                    },
                  });
                  parsedTemplate[realKey].hostPorts.push({
                    id,
                    name,
                    value: found?.value || '',
                    label,
                    description,
                    defaultValue,
                    required,
                  });
                }
              }
            }
          }
        }
      } else {
        parsedTemplate = foundTemplate;
      }
      let strParsedTemplate = JSON.stringify(parsedTemplate);

      // replace $$id and $$workdir
      strParsedTemplate = strParsedTemplate.replaceAll('$$id', service.id);
      strParsedTemplate = strParsedTemplate.replaceAll(
        '$$core_version',
        service.version || foundTemplate.defaultVersion,
      );

      // replace $$workdir
      if (workdir) {
        strParsedTemplate = strParsedTemplate.replaceAll('$$workdir', workdir);
      }

      // replace $$config
      if (service.serviceSetting.length > 0) {
        for (const setting of service.serviceSetting) {
          const { value, variableName } = setting;
          const regex = new RegExp(
            `\\$\\$config_${variableName.replace('$$config_', '')}\"`,
            'gi',
          );
          if (value === '$$generate_fqdn') {
            strParsedTemplate = strParsedTemplate.replaceAll(
              regex,
              service.fqdn + '"' || '' + '"',
            );
          } else if (value === '$$generate_fqdn_slash') {
            strParsedTemplate = strParsedTemplate.replaceAll(
              regex,
              service.fqdn + '/' + '"',
            );
          } else if (value === '$$generate_domain') {
            strParsedTemplate = strParsedTemplate.replaceAll(
              regex,
              getDomain(service.fqdn) + '"',
            );
          } else if (
            service.destinationDocker?.network &&
            value === '$$generate_network'
          ) {
            strParsedTemplate = strParsedTemplate.replaceAll(
              regex,
              service.destinationDocker.network + '"',
            );
          } else {
            strParsedTemplate = strParsedTemplate.replaceAll(
              regex,
              value + '"',
            );
          }
        }
      }

      // replace $$secret
      if (service.serviceSecret.length > 0) {
        for (const secret of service.serviceSecret) {
          // eslint-disable-next-line prefer-const
          let { name, value } = secret;
          name = name.toLowerCase();
          const regexHashed = new RegExp(
            `\\$\\$hashed\\$\\$secret_${name}`,
            'gi',
          );
          const regex = new RegExp(`\\$\\$secret_${name}`, 'gi');
          if (value) {
            strParsedTemplate = strParsedTemplate.replaceAll(
              regexHashed,
              bcrypt.hashSync(value.replaceAll('"', '\\"'), 10),
            );
            strParsedTemplate = strParsedTemplate.replaceAll(
              regex,
              value.replaceAll('"', '\\"'),
            );
          } else {
            strParsedTemplate = strParsedTemplate.replaceAll(regexHashed, '');
            strParsedTemplate = strParsedTemplate.replaceAll(regex, '');
          }
        }
      }
      parsedTemplate = JSON.parse(strParsedTemplate);
    }
    return parsedTemplate;
  }
}
