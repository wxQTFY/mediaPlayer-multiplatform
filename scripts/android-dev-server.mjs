import { spawn } from 'node:child_process';

const args = process.argv.slice(2);

const readOption = (name) => {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const hasFlag = (name) => args.includes(name);

const port = readOption('--port') ?? readOption('-p') ?? '9500';
const isDevice = hasFlag('--device');
const explicitUrl = readOption('--url') ?? process.env.CAPACITOR_SERVER_URL;

const devServerUrl = explicitUrl ?? (isDevice ? '' : `http://10.0.2.2:${port}`);

if (!devServerUrl) {
  console.error(
    'For a physical Android device, pass --url http://<your-computer-lan-ip>:' +
      port +
      ' or set CAPACITOR_SERVER_URL.'
  );
  process.exit(1);
}

const quasarArgs = ['quasar', 'dev', '-m', 'capacitor', '-T', 'android', '-p', port];

console.log(`Android Capacitor dev server URL: ${devServerUrl}`);

const child = spawn('npx', quasarArgs, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    CAPACITOR_SERVER_URL: devServerUrl
  }
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
