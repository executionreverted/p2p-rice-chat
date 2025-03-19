import { exec } from 'child_process';
import os from 'os';
import { promisify } from 'util';

// Using child_process.execFile is safer than exec for user-provided input
import { execFile } from 'child_process';
const execFilePromise = promisify(execFile);

// Cross-platform clipboard utility with security improvements
export const copyToClipboard = (text) => {
  const platform = os.platform();

  return new Promise((resolve, reject) => {
    try {
      if (platform === 'darwin') {
        // macOS - use pbcopy which reads from stdin
        const proc = exec('pbcopy', (error) => {
          if (error) {
            reject(new Error(`macOS clipboard error: ${error.message}`));
            return;
          }
          resolve(true);
        });
        proc.stdin.write(text);
        proc.stdin.end();
      } else if (platform === 'win32') {
        // Windows - use powershell Set-Clipboard which is safer than clip
        execFilePromise('powershell.exe', [
          '-command',
          `Set-Clipboard -Value ${JSON.stringify(text)}`
        ])
          .then(() => resolve(true))
          .catch(error => reject(new Error(`Windows clipboard error: ${error.message}`)));
      } else {
        // Linux (requires xclip) - use stdin to avoid shell interpolation
        const proc = exec('xclip -selection clipboard', (error) => {
          if (error) {
            reject(new Error(`Linux clipboard error: ${error.message}. Is xclip installed?`));
            return;
          }
          resolve(true);
        });
        proc.stdin.write(text);
        proc.stdin.end();
      }
    } catch (err) {
      reject(new Error(`Clipboard operation failed: ${err.message}`));
    }
  });
};
