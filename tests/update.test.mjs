import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
const scratch = fs.mkdtempSync(path.join(root, '..', 'mono-test-'));
after(() => fs.rmSync(scratch, { recursive: true, force: true }));
function git(dir, ...args) {
  const r = spawnSync('git', ['-C', dir, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', ...args], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr); return r.stdout.trim();
}
function commit(dir, file, value) { fs.writeFileSync(path.join(dir, file), value); git(dir, 'add', '.'); git(dir, 'commit', '-m', 'test update'); }
function fixture() {
  const temp = fs.mkdtempSync(path.join(scratch, 'case-')); const origin = path.join(temp, 'origin'); const clone = path.join(temp, 'clone');
  fs.mkdirSync(origin); git(origin, 'init', '-b', 'main'); fs.cpSync(path.join(root, 'scripts'), path.join(origin, 'scripts'), { recursive: true });
  if (fs.existsSync(path.join(root, 'update.sh'))) fs.copyFileSync(path.join(root, 'update.sh'), path.join(origin, 'update.sh'));
  fs.writeFileSync(path.join(origin, '.gitignore'), '.env\n.maintenance.lock\n.deployment-pending\n.deployed-revisions\nbackups/\n.backup.*/\n');
  commit(origin, 'version.txt', 'v1'); git(temp, 'clone', origin, clone);
  fs.writeFileSync(path.join(clone, '.env'), 'PUBLIC_URL=http://localhost\n');
  const bin = path.join(temp, 'bin'); fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, 'docker'), '#!/usr/bin/env bash\nprintf "%s\\n" "$*" >> "$DOCKER_LOG"\nif [[ "$*" == *"up -d --build"* && $FAIL_START == 1 ]]; then exit 42; fi\nexit 0\n', { mode: 0o755 });
  if (process.platform === 'win32') fs.writeFileSync(path.join(bin, 'flock'), '#!/usr/bin/env bash\nexit 0\n', { mode: 0o755 });
  return { temp, origin, clone, bin };
}
function run(f, file, extra = {}) { return spawnSync(bash, ['-c', 'export PATH="$PWD/../bin:$PATH"; bash "$1"', 'test', file], { cwd: f.clone, encoding: 'utf8', timeout: 20000, env: { ...process.env, DOCKER_LOG: path.join(f.temp, 'docker.log').replaceAll('\\', '/'), ...extra } }); }
test('single-repo update fast-forwards code and starts both apps without replacing env', () => {
  const f = fixture(); commit(f.origin, 'version.txt', 'v2'); const r = run(f, 'update.sh');
  assert.equal(r.status, 0, r.stderr); assert.equal(fs.readFileSync(path.join(f.clone, 'version.txt'), 'utf8'), 'v2');
  assert.equal(fs.readFileSync(path.join(f.clone, '.env'), 'utf8'), 'PUBLIC_URL=http://localhost\n');
  assert.ok(fs.readFileSync(path.join(f.temp, 'docker.log'), 'utf8').includes('up -d --build'));
  assert.match(fs.readFileSync(path.join(f.clone, '.deployed-revisions'), 'utf8'), /^REPOSITORY=[a-f0-9]{40}$/m);
});
test('local edits stop update before advancing source', () => {
  const f = fixture(); commit(f.origin, 'version.txt', 'v2'); fs.writeFileSync(path.join(f.clone, 'version.txt'), 'my local edit');
  assert.notEqual(run(f, 'update.sh').status, 0); assert.equal(fs.readFileSync(path.join(f.clone, 'version.txt'), 'utf8'), 'my local edit');
});
test('failed compose start leaves pending marker and blocks subsequent update', () => {
  const f = fixture(); commit(f.origin, 'version.txt', 'v2'); assert.notEqual(run(f, 'update.sh', { FAIL_START: '1' }).status, 0);
  assert.ok(fs.existsSync(path.join(f.clone, '.deployment-pending'))); assert.notEqual(run(f, 'update.sh').status, 0);
});
