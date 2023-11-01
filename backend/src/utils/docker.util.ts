import { executeCommand } from './command.util';

export async function checkContainer({
  container,
  remove = false,
}: {
  dockerId?: string;
  container: string;
  remove?: boolean;
}): Promise<{
  found: boolean;
  status?: { isExited: boolean; isRunning: boolean; isRestarting: boolean };
}> {
  let containerFound = false;
  try {
    const { stdout } = await executeCommand(
      `docker inspect --format '{{json .State}}' ${container}`,
    );
    containerFound = true;
    const parsedStdout = JSON.parse(stdout);
    const status = parsedStdout.Status;
    const isRunning = status === 'running';
    const isRestarting = status === 'restarting';
    const isExited = status === 'exited';
    if (status === 'created') {
      await executeCommand(`docker rm ${container}`);
    }
    if (remove && status === 'exited') {
      await executeCommand(`docker rm ${container}`);
    }

    return {
      found: containerFound,
      status: {
        isRunning,
        isRestarting,
        isExited,
      },
    };
  } catch (err) {
    // Container not found
  }
  return {
    found: false,
  };
}
