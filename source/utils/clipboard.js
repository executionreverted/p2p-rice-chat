import { exec } from 'child_process';
import os from 'os';

// Cross-platform clipboard utility
export const copyToClipboard = (text) => {
  const platform = os.platform();

  return new Promise((resolve, reject) => {
    let command;

    if (platform === 'darwin') {
      // macOS
      command = `echo "${text}" | pbcopy`;
    } else if (platform === 'win32') {
      // Windows
      command = `echo ${text} | clip`;
    } else {
      // Linux (requires xclip)
      command = `echo "${text}" | xclip -selection clipboard`;
    }

    exec(command, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(true);
    });
  });
};
