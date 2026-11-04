import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const bash = process.env.BASH_EXE || (process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash');
const scratch = fs.mkdtempSync(path.join(root, '..', 'setup-test-'));
after(() => fs.rmSync(scratch, { recursive: true, force: true }));

function fixture() {
  const dir = fs.mkdtempSync(path.join(scratch, 'case-'));
  if (fs.existsSync(path.join(root, 'setup.sh'))) fs.copyFileSync(path.join(root, 'setup.sh'), path.join(dir, 'setup.sh'));
  if (fs.existsSync(path.join(root, 'scripts'))) fs.cpSync(path.join(root, 'scripts'), path.join(dir, 'scripts'), { recursive: true });
  return dir;
}
function run(dir, args) {
  return spawnSync(bash, ['setup.sh', ...args], { cwd: dir, encoding: 'utf8', timeout: 15000 });
}
function env(dir) { return fs.readFileSync(path.join(dir, '.env'), 'utf8'); }

test('fresh domain setup generates distinct secrets and HTTPS configuration', () => {
  const dir = fixture();
  const result = run(dir, ['--host', 'conference.example.org', '--configure-only']);
  assert.equal(result.status, 0, result.stderr);
  const content = env(dir);
  assert.match(content, /^SITE_ADDRESS=conference\.example\.org$/m);
  assert.match(content, /^PUBLIC_URL=https:\/\/conference\.example\.org$/m);
  const secrets = ['POSTGRES_PASSWORD', 'JWT_SECRET', 'SEED_ADMIN_PASSWORD'].map(key => content.match(new RegExp(`^${key}=([a-f0-9]{48,})$`, 'm'))?.[1]);
  assert.ok(secrets.every(Boolean), 'strong generated secrets');
  assert.equal(new Set(secrets).size, 3);
  assert.ok(!content.includes('Admin123!'));
});

test('IP setup uses explicit HTTP and repeat setup preserves customized configuration', () => {
  const dir = fixture();
  assert.equal(run(dir, ['--host', '203.0.113.10', '--configure-only']).status, 0);
  const original = env(dir) + '\n# custom setting\n';
  fs.writeFileSync(path.join(dir, '.env'), original);
  assert.match(original, /^SITE_ADDRESS=http:\/\/203\.0\.113\.10$/m);
  assert.equal(run(dir, ['--configure-only']).status, 0);
  assert.equal(env(dir), original);
});

test('different host never silently replaces an existing configuration', () => {
  const dir = fixture();
  assert.equal(run(dir, ['--host', 'one.example.org', '--configure-only']).status, 0);
  const original = env(dir);
  assert.notEqual(run(dir, ['--host', 'two.example.org', '--configure-only']).status, 0);
  assert.equal(env(dir), original);
});

test('invalid hosts, missing values and unknown options fail without writing env', () => {
  for (const args of [ ['--host', 'bad;touch-owned', '--configure-only'], ['--host', 'https://x.org/path', '--configure-only'], ['--host', '-invalid.org', '--configure-only'], ['--host', '999.1.1.1', '--configure-only'], ['--host'], ['--surprise'] ]) {
    const dir = fixture();
    assert.notEqual(run(dir, args).status, 0, JSON.stringify(args));
    assert.ok(!fs.existsSync(path.join(dir, '.env')));
  }
});
