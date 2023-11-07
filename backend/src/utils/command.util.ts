import * as os from 'os';
import { execaCommand } from '@esm2cjs/execa';

export const executeCommand = async (command: string) => {
  if (os.platform() === 'win32') {
    return execaCommand(command, {
      shell: 'powershell.exe',
    });
  }

  return execaCommand(command, { shell: true });
};
