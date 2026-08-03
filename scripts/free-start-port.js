const { execFileSync } = require('node:child_process');
const { readFileSync, existsSync } = require('node:fs');
const { join, resolve } = require('node:path');

const DEFAULT_PORT = 3000;
const SHUTDOWN_TIMEOUT_MS = 5000;
const POLL_INTERVAL_MS = 250;
const projectRoot = resolve(__dirname, '..');

function run(command, args) {
  return execFileSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function sleep(ms) {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms);
  });
}

function readConfiguredPort() {
  const envPort = parsePort(process.env.PORT);

  if (envPort !== null) {
    return envPort;
  }

  const envFilePath = join(projectRoot, '.env');

  if (!existsSync(envFilePath)) {
    return DEFAULT_PORT;
  }

  const envFile = readFileSync(envFilePath, 'utf8');
  const match = envFile.match(/^PORT\s*=\s*(.+)$/m);

  if (!match) {
    return DEFAULT_PORT;
  }

  const rawValue = match[1].trim().replace(/^['"]|['"]$/g, '');
  const port = parsePort(rawValue);

  return port ?? DEFAULT_PORT;
}

function parsePort(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function hasLsof() {
  try {
    run('which', ['lsof']);
    return true;
  } catch {
    return false;
  }
}

function getListeningPids(port) {
  try {
    const output = run('lsof', [
      '-nP',
      `-iTCP:${port}`,
      '-sTCP:LISTEN',
      '-Fp',
    ]);

    return [...new Set(
      output
        .split('\n')
        .filter((line) => line.startsWith('p'))
        .map((line) => Number(line.slice(1)))
        .filter((pid) => Number.isInteger(pid) && pid > 0),
    )];
  } catch {
    return [];
  }
}

function getProcessCwd(pid) {
  try {
    const output = run('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn']);
    const cwdLine = output.split('\n').find((line) => line.startsWith('n'));
    return cwdLine ? cwdLine.slice(1) : '';
  } catch {
    return '';
  }
}

function getProcessCommand(pid) {
  try {
    return run('ps', ['-o', 'command=', '-p', String(pid)]);
  } catch {
    return '';
  }
}

function isProjectProcess(pid) {
  const cwd = getProcessCwd(pid);
  const command = getProcessCommand(pid);

  return cwd === projectRoot || command.includes(projectRoot);
}

function isRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code !== 'ESRCH';
  }
}

async function stopProcess(pid) {
  try {
    process.kill(pid, 'SIGTERM');
  } catch (error) {
    if (error.code === 'ESRCH') {
      return;
    }

    throw error;
  }

  const deadline = Date.now() + SHUTDOWN_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (!isRunning(pid)) {
      return;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  process.kill(pid, 'SIGKILL');
}

async function main() {
  const port = readConfiguredPort();

  if (!hasLsof()) {
    return;
  }

  const listeners = getListeningPids(port).filter((pid) => pid !== process.pid);

  if (listeners.length === 0) {
    return;
  }

  const foreignProcesses = listeners.filter((pid) => !isProjectProcess(pid));

  if (foreignProcesses.length > 0) {
    const details = foreignProcesses
      .map((pid) => `${pid}: ${getProcessCommand(pid) || 'unknown process'}`)
      .join(', ');

    console.error(`Port ${port} is already in use by another process: ${details}`);
    process.exit(1);
  }

  for (const pid of listeners) {
    await stopProcess(pid);
    console.log(`[free-start-port] Stopped stale project process on port ${port} (PID ${pid}).`);
  }
}

main().catch((error) => {
  console.error(`[free-start-port] ${error.message}`);
  process.exit(1);
});
