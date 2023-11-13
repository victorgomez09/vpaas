import { decrypt } from './string.util';

export function decryptApplication(application: any) {
  if (application) {
    if (application?.gitSource?.githubApp?.clientSecret) {
      application.gitSource.githubApp.clientSecret =
        decrypt(application.gitSource.githubApp.clientSecret) || null;
    }
    if (application?.gitSource?.githubApp?.webhookSecret) {
      application.gitSource.githubApp.webhookSecret =
        decrypt(application.gitSource.githubApp.webhookSecret) || null;
    }
    if (application?.gitSource?.githubApp?.privateKey) {
      application.gitSource.githubApp.privateKey =
        decrypt(application.gitSource.githubApp.privateKey) || null;
    }
    if (application?.gitSource?.gitlabApp?.appSecret) {
      application.gitSource.gitlabApp.appSecret =
        decrypt(application.gitSource.gitlabApp.appSecret) || null;
    }
    if (application?.secrets.length > 0) {
      application.secrets = application.secrets.map((s: any) => {
        s.value = decrypt(s.value) || null;
        return s;
      });
    }

    return application;
  }
}
