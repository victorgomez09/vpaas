// import { spawn } from 'child_process';
//
// Spawn fuction that returns stdout as string
// export const executeCommand = async (
//   command: string,
// ): Promise<{ stdout: string; stderr: string }> => {
//   return new Promise((resolve, reject) => {
//     const child = spawn(command, { stdio: ['pipe', 'pipe', 'pipe'] });
//     let stdout = '';
//     let stderr = '';
//     child.stdout.on('data', (data) => {
//       stdout += data.toString();
//     });
//     child.on('close', () => {
//       resolve({ stdout, stderr });
//     });
//     child.stderr.on('data', (data) => {
//       stderr += data.toString();
//     });
//     child.on('error', (error) => {
//       reject(error);
//     });
//   });
// };

import * as os from 'os';
import { execaCommand } from '@esm2cjs/execa';

export const executeCommand = async (command: string) => {
  if (os.platform() === 'win32') {
    return execaCommand(command, {
      shell: 'powershell.exe',
    });
  }

  return execaCommand(command);

  // return new promise
  // const promise = new Promise<{ stdout: string; stderr: string }>(
  //   (resolve, reject) => {
  //     exec(command, (error, stdout, stderr) => {
  //       // if (error) {
  //       //   reject();
  //       // }

  //       if (stderr) {
  //         stderr += stderr;
  //         resolve({ stdout, stderr });
  //         return { stdout, stderr };
  //       }

  //       if (stdout) {
  //         stdout += stdout;

  //         resolve({ stdout, stderr });
  //         return { stdout, stderr };
  //       }
  //     });
  //   },
  // );

  // return promise;

  // exec(command, { shell: 'powershell.exe' }, (error, stdout, stderr) => {
  //   if (error) {
  //     console.log('error', error);
  //     return;
  //   }
  //   if (stderr) {
  //     console.log('stderr', stderr);
  //     stderr += stderr;
  //   }
  //   if (stdout) {
  //     console.log('stdout', stdout);
  //     stdout += stdout;
  //   }
  // });

  // return { stdout, stderr };
};
