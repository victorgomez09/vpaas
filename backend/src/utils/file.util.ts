import { statSync } from 'fs';
import * as os from 'os';

import { executeCommand } from './command.util';

export const createDirectories = async ({
  repository,
  buildId,
}: {
  repository: string;
  buildId: string;
}): Promise<{ workdir: string; repodir: string }> => {
  if (repository) repository = repository.replaceAll(' ', '');
  const repodir = `/tmp/build-sources/${repository}/`;
  const workdir = `/tmp/build-sources/${repository}/${buildId}`;
  let workdirFound = false;
  try {
    workdirFound = !!statSync(workdir);
  } catch (error) {
    console.log('error', error);
  }

  if (workdirFound) {
    if (os.platform() === 'win32') {
      await executeCommand(`rm ${workdir} -r -fo`);
    } else {
      await executeCommand(`rm -rf ${workdir}`);
    }
  }
  await executeCommand(`mkdir -p ${workdir}`);

  return {
    workdir,
    repodir,
  };
};
