import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { startProcesses } from '../scripts/dev.mjs';

const fixture = ['-e', 'setInterval(() => {}, 1000)'];

test('one failed development service closes its sibling and preserves the failure exit code', async () => {
  const services = startProcesses([
    { name: 'Fixture long-running process', args: fixture },
    { name: 'Fixture failing process', args: ['-e', 'setTimeout(() => process.exit(17), 30)'] },
  ], { stdio: 'ignore', report: () => {} });
  const code = await services.done;
  assert.equal(code, 17);
  assert.ok(services.children.every(child => child.exitCode !== null || child.signalCode !== null));
  for (const child of services.children) assert.throws(() => process.kill(child.pid, 0));
});

test('explicit development shutdown closes every child without an error exit code', async () => {
  const services = startProcesses([
    { name: 'First fixture', args: fixture },
    { name: 'Second fixture', args: fixture },
  ], { stdio: 'ignore', report: () => {} });
  await Promise.all(services.children.map(child => once(child, 'spawn')));
  services.stop(0);
  assert.equal(await services.done, 0);
  for (const child of services.children) assert.throws(() => process.kill(child.pid, 0));
});
