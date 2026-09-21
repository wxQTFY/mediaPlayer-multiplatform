import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const srcCapacitorDir = fileURLToPath(new URL('../src-capacitor/', import.meta.url));
const capacitorCliPath = fileURLToPath(
  new URL('../src-capacitor/node_modules/@capacitor/cli/bin/capacitor', import.meta.url)
);
const quasarCliPath = fileURLToPath(
  new URL('../node_modules/@quasar/app-vite/bin/quasar.js', import.meta.url)
);

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
const skipAdbReverse = hasFlag('--skip-adb-reverse') || process.env.SKIP_ADB_REVERSE === '1';
const explicitUrl = readOption('--url') ?? process.env.CAPACITOR_SERVER_URL;

const devServerUrl = explicitUrl ?? (isDevice ? '' : `http://127.0.0.1:${port}`);

if (!devServerUrl) {
  console.error(
    'For a physical Android device, pass --url http://<your-computer-lan-ip>:' +
      port +
      ' or set CAPACITOR_SERVER_URL.'
  );
  process.exit(1);
}

const runNodeCli = (cliPath, commandArgs, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliPath, ...commandArgs], {
      stdio: 'inherit',
      env: {
        ...process.env,
        CAPACITOR_SERVER_URL: devServerUrl
      },
      ...options
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`${cliPath} exited with signal ${signal}`));
        return;
      }

      code === 0 ? resolve() : reject(new Error(`${cliPath} exited with code ${code}`));
    });
  });

const runCommand = (command, commandArgs, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      stdio: 'inherit',
      ...options
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`${command} exited with signal ${signal}`));
        return;
      }

      code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`));
    });
  });

const findAdb = () => {
  const executableName = process.platform === 'win32' ? 'adb.exe' : 'adb';
  const candidates = [
    process.env.ADB,
    process.env.ANDROID_HOME && join(process.env.ANDROID_HOME, 'platform-tools', executableName),
    process.env.ANDROID_SDK_ROOT && join(process.env.ANDROID_SDK_ROOT, 'platform-tools', executableName)
  ].filter(Boolean);

  const explicitAdb = candidates.find((candidate) => existsSync(candidate));
  return explicitAdb ?? 'adb';
};

const configureEmulatorReverseProxy = async () => {
  if (isDevice || explicitUrl || skipAdbReverse) return;

  console.log(`Mapping emulator http://127.0.0.1:${port} to this computer with adb reverse...`);

  try {
    await runCommand(findAdb(), ['reverse', `tcp:${port}`, `tcp:${port}`]);
  } catch (error) {
    console.error(
      '\nUnable to run adb reverse. Start the Android emulator first, make sure adb is available, then rerun this command.\n' +
        'Android Studio normally provides adb at %ANDROID_HOME%\\platform-tools\\adb.exe.\n'
    );
    throw error;
  }
};

console.log(`Android Capacitor dev server URL: ${devServerUrl}`);
await configureEmulatorReverseProxy();
console.log('Syncing Android Capacitor project...');

await runNodeCli(capacitorCliPath, ['sync', 'android'], {
  cwd: srcCapacitorDir
});

console.log('Starting Quasar dev server for Android emulator...');

const child = spawn(process.execPath, [quasarCliPath, 'dev', '-p', port, '--hostname', '0.0.0.0'], {
  stdio: 'inherit',
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
