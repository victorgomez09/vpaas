import fs from 'fs/promises';
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
    workdirFound = !!(await fs.stat(workdir));
  } catch (error) {}
  if (workdirFound) {
    await executeCommand(`rm -fr ${workdir}`);
  }
  await executeCommand(`mkdir -p ${workdir}`);

  return {
    workdir,
    repodir,
  };
};
