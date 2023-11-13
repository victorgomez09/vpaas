import { pathExistsSync } from 'fs';

const NAMESPACE = 'namespace';
const HASHED_PASSWORD = 'hashedPassword';
const CUSTOM_DOMAIN = 'customDomain';
const HAS_ROOT_SSL = 'hasRootSsl';
const FORCE_ROOT_SSL = 'forceRootSsl';
const HAS_REGISTRY_SSL = 'hasRegistrySsl';
const EMAIL_ADDRESS = 'emailAddress';
const NET_DATA_INFO = 'netDataInfo';
const NGINX_BASE_CONFIG = 'nginxBaseConfig';
const NGINX_CAPTAIN_CONFIG = 'nginxCaptainConfig';
const CUSTOM_ONE_CLICK_APP_URLS = 'oneClickAppUrls';
const FEATURE_FLAGS = 'featureFlags';

const DEFAULT_CAPTAIN_ROOT_DOMAIN = 'captain.localhost';

const DEFAULT_NGINX_BASE_CONFIG = fs
  .readFileSync(__dirname + '/../../template/base-nginx-conf.ejs')
  .toString();
const DEFAULT_NGINX_CAPTAIN_CONFIG = fs
  .readFileSync(__dirname + '/../../template/root-nginx-conf.ejs')
  .toString();

let DEFAULT_NGINX_CONFIG_FOR_APP_PATH =
  __dirname + '/../../template/server-block-conf.ejs';

const SERVER_BLOCK_CONF_OVERRIDE_PATH =
  CaptainConstants.captainDataDirectory + '/server-block-conf-override.ejs';

if (pathExistsSync(SERVER_BLOCK_CONF_OVERRIDE_PATH)) {
  DEFAULT_NGINX_CONFIG_FOR_APP_PATH = SERVER_BLOCK_CONF_OVERRIDE_PATH;
}

const DEFAULT_NGINX_CONFIG_FOR_APP = fs
  .readFileSync(DEFAULT_NGINX_CONFIG_FOR_APP_PATH)
  .toString();

export class DataStore {
  private encryptor: CaptainEncryptor;
  private namespace: string;
  private data: Configstore;
  private appsDataStore: AppsDataStore;
  private registriesDataStore: RegistriesDataStore;
  proDataStore: ProDataStore;

  constructor(namespace: string) {
    const data = new Configstore(
      `captain-store-${namespace}`, // This value seems to be unused
      {},
      {
        configPath: `${CaptainConstants.captainDataDirectory}/config-${namespace}.json`,
      },
    );

    this.data = data;
    this.namespace = namespace;
    this.data.set(NAMESPACE, namespace);
    this.appsDataStore = new AppsDataStore(this.data, namespace);
    this.proDataStore = new ProDataStore(this.data);
    this.registriesDataStore = new RegistriesDataStore(this.data, namespace);
  }

  setEncryptionSalt(salt: string) {
    this.encryptor = new CaptainEncryptor(this.namespace + salt);
    this.appsDataStore.setEncryptor(this.encryptor);
    this.registriesDataStore.setEncryptor(this.encryptor);
  }

  getNameSpace(): string {
    return this.data.get(NAMESPACE);
  }

  getFeatureFlags(): any {
    return this.data.get(FEATURE_FLAGS);
  }

  async setFeatureFlags(featureFlags: any) {
    return await this.data.set(FEATURE_FLAGS, featureFlags);
  }

  async setHashedPassword(newHashedPassword: string) {
    return await this.data.set(HASHED_PASSWORD, newHashedPassword);
  }

  async getHashedPassword() {
    return await this.data.get(HASHED_PASSWORD);
  }

  /*
            "smtp": {
                "to": "",
                "hostname": "",
                "server": "",
                "port": "",
                "allowNonTls": false,
                "password": "",
                "username": ""
            },
            "slack": {
                "hook": "",
                "channel": ""
            },
            "telegram": {
                "botToken": "",
                "chatId": ""
            },
            "pushBullet": {
                "fallbackEmail": "",
                "apiToken": ""
            }
     */
  async getNetDataInfo() {
    const netDataInfo = (await this.data.get(NET_DATA_INFO)) || {};
    netDataInfo.isEnabled = netDataInfo.isEnabled || false;
    netDataInfo.data = netDataInfo.data || {};
    netDataInfo.data.smtp =
      netDataInfo.data.smtp && netDataInfo.data.smtp.username
        ? netDataInfo.data.smtp
        : {};
    netDataInfo.data.slack = netDataInfo.data.slack || {};
    netDataInfo.data.telegram = netDataInfo.data.telegram || {};
    netDataInfo.data.pushBullet = netDataInfo.data.pushBullet || {};

    return netDataInfo;
  }

  async setNetDataInfo(netDataInfo: NetDataInfo) {
    return await this.data.set(NET_DATA_INFO, netDataInfo);
  }

  getRootDomain() {
    return this.data.get(CUSTOM_DOMAIN) || DEFAULT_CAPTAIN_ROOT_DOMAIN;
  }

  hasCustomDomain() {
    return !!this.data.get(CUSTOM_DOMAIN);
  }

  getAppsDataStore() {
    return this.appsDataStore;
  }

  getProDataStore() {
    return this.proDataStore;
  }

  getRegistriesDataStore() {
    return this.registriesDataStore;
  }

  async setUserEmailAddress(emailAddress: string) {
    await this.data.set(EMAIL_ADDRESS, emailAddress);
  }

  async getUserEmailAddress() {
    await this.data.get(EMAIL_ADDRESS);
  }

  async setHasRootSsl(hasRootSsl: boolean) {
    await this.data.set(HAS_ROOT_SSL, hasRootSsl);
  }

  async setForceSsl(forceSsl: boolean) {
    await this.data.set(FORCE_ROOT_SSL, forceSsl);
  }

  async getForceSsl() {
    !!(await this.data.get(FORCE_ROOT_SSL));
  }

  async setHasRegistrySsl(hasRegistrySsl: boolean) {
    await this.data.set(HAS_REGISTRY_SSL, hasRegistrySsl);
  }

  getDefaultAppNginxConfig() {
    return DEFAULT_NGINX_CONFIG_FOR_APP;
  }

  async getNginxConfig() {
    return {
      baseConfig: {
        byDefault: DEFAULT_NGINX_BASE_CONFIG,
        customValue: await this.data.get(NGINX_BASE_CONFIG),
      },
      captainConfig: {
        byDefault: DEFAULT_NGINX_CAPTAIN_CONFIG,
        customValue: await this.data.get(NGINX_CAPTAIN_CONFIG),
      },
    };
  }

  async setNginxConfig(baseConfig: string, captainConfig: string) {
    await this.data.set(NGINX_BASE_CONFIG, baseConfig);
    await this.data.set(NGINX_CAPTAIN_CONFIG, captainConfig);
  }

  async getHasRootSsl() {
    await this.data.get(HAS_ROOT_SSL);
  }

  async getHasRegistrySsl() {
    !!(await this.data.get(HAS_REGISTRY_SSL));
  }

  async setCustomDomain(customDomain: string) {
    await this.data.set(CUSTOM_DOMAIN, customDomain);
  }

  async getAllOneClickBaseUrls() {
    const dataString = await this.data.get(CUSTOM_ONE_CLICK_APP_URLS);
    const parsedArray = JSON.parse(dataString || '[]') as string[];

    return parsedArray;
  }

  async insertOneClickBaseUrl(url: string) {
    const parsedArray = JSON.parse(
      (await this.data.get(CUSTOM_ONE_CLICK_APP_URLS)) || '[]',
    ) as string[];

    parsedArray.push(url);
    await this.data.set(CUSTOM_ONE_CLICK_APP_URLS, JSON.stringify(parsedArray));
  }

  async deleteOneClickBaseUrl(url: string) {
    const parsedArray = JSON.parse(
      (await this.data.get(CUSTOM_ONE_CLICK_APP_URLS)) || '[]',
    ) as string[];

    await this.data.set(
      CUSTOM_ONE_CLICK_APP_URLS,
      JSON.stringify(parsedArray.filter((it) => it !== url)),
    );
  }
}
