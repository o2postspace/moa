import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

/**
 * Run direct Node children, keeping the API and web server in one lifecycle.
 * Commands and failures never print process arguments or environment values.
 * @param {{ name: string, args: string[] }[]} commands
 * @param {{ cwd?: string, stdio?: import('node:child_process').StdioOptions, report?: (message: string) => void }} options
 */
export function startProcesses(commands, options = {}) {
  const children = [];
  const closed = [];
  let stopping = false;
  let exitCode = 0;
  const report = options.report || console.error;

  const stop = (code = 0) => {
    if (stopping) return;
    stopping = true;
    exitCode = code;
    for (const child of children) {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
    }
    // Do not leave a child behind if it ignores SIGTERM on a Unix host.
    const force = setTimeout(() => {
      for (const child of children) {
        if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
      }
    }, 2000);
    force.unref();
    Promise.all(closed).finally(() => clearTimeout(force));
  };

  for (const command of commands) {
    const child = spawn(process.execPath, command.args, {
      cwd: options.cwd || projectRoot,
      stdio: options.stdio || 'inherit',
      shell: false,
      windowsHide: true,
    });
    children.push(child);
    closed.push(new Promise((complete) => {
      child.once('error', () => {
        report(`${command.name} 실행을 시작하지 못했습니다. 설치와 설정을 확인해 주세요.`);
        stop(1);
      });
      child.once('close', (code) => {
        if (!stopping) {
          report(`${command.name} 실행이 종료되어 나머지 개발 서버도 정리합니다.`);
          stop(code && code > 0 ? code : 1);
        }
        complete();
      });
    }));
  }

  return { children, stop, done: Promise.all(closed).then(() => exitCode) };
}

async function main() {
  const services = startProcesses([
    { name: '모아 API', args: ['--env-file-if-exists=.env.local', 'server/index.ts'] },
    { name: '모아 웹', args: ['node_modules/vite/bin/vite.js'] },
  ]);
  const onInterrupt = () => services.stop(0);
  const onExit = () => services.stop(0);
  process.once('SIGINT', onInterrupt);
  process.once('SIGTERM', onInterrupt);
  process.once('exit', onExit);
  process.exitCode = await services.done;
  process.removeListener('SIGINT', onInterrupt);
  process.removeListener('SIGTERM', onInterrupt);
  process.removeListener('exit', onExit);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
