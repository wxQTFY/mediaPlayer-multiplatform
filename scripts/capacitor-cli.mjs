import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const capacitorDir = resolve(__dirname, '..', 'src-capacitor');
const args = process.argv.slice(2);

const child = spawn('npx', ['cap', ...args], {
  cwd: capacitorDir,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
