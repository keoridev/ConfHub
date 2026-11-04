import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const bash = process.env.BASH_EXE || (process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash');
const scratch = fs.mkdtempSync(path.join(root, '..', 'operations-test-'));
after(() => fs.rmSync(scratch, { recursive: true, force: true }));
function fixture() {
  const dir = fs.mkdtempSync(path.join(scratch, 'case-'));
  if (fs.existsSync(path.join(root, 'scripts'))) fs.cpSync(path.join(root, 'scripts'), path.join(dir, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'fake-bin'));
  // Git Bash lacks util-linux; Linux CI uses the real flock executable.
  if (process.platform === 'win32') fs.writeFileSync(path.join(dir, 'fake-bin', 'flock'), '#!/usr/bin/env bash\nexit 0\n', { mode: 0o755 });
  fs.writeFileSync(path.join(dir, 'fake-bin', 'find'), '#!/usr/bin/env bash\nif [[ $FAIL_FIND == 1 ]]; then echo "find: Permission denied" >&2; exit 1; fi\nif [[ $NONEMPTY_UPLOADS == 1 ]]; then echo /app/uploads/existing.pdf; fi\n', { mode: 0o755 });
  fs.writeFileSync(path.join(dir, '.env'), 'SITE_ADDRESS=http://localhost\nPUBLIC_URL=http://localhost\n');
  fs.writeFileSync(path.join(dir, 'compose.yaml'), 'services: {}\n');
  fs.writeFileSync(path.join(dir, 'fake-bin', 'docker'), `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$FAKE_LOG"
case "$*" in
  *'ps --status running --services'*) if [[ $APP_STOPPED != 1 ]]; then echo app; fi ;;
  *'start app'*) if [[ $FAIL_START == 1 ]]; then exit 43; fi ;;
  *pg_dump*) if [[ $FAIL_DUMP == 1 ]]; then exit 42; fi; printf PGDMPfake ;;
  *'-czf - .'*) tar -czf - --files-from /dev/null ;;
  *'COUNT(*)'*) if [[ -n $DB_TABLES ]]; then echo "$DB_TABLES"; else echo 2; fi ;;
  *'find /app/uploads'*) for argument in "$@"; do command=$argument; done; sh -ec "$command"; exit $? ;;
esac
exit 0
`, { mode: 0o755 });
  return dir;
}
function run(dir, file, args = [], extra = {}) {
  const log = path.join(dir, 'commands.log').replaceAll('\\', '/');
  return spawnSync(bash, ['-c', 'export PATH="$PWD/fake-bin:$PATH"; bash "$@"', 'test', file, ...args], {
    cwd: dir, encoding: 'utf8', timeout: 15000, env: { ...process.env, FAKE_LOG: log, ...extra }
  });
}
test('backup pauses writers, includes database/uploads/env and resumes app', () => {
  const dir = fixture();
  const result = run(dir, 'scripts/backup.sh');
  assert.equal(result.status, 0, result.stderr);
  const files = fs.readdirSync(path.join(dir, 'backups')).filter(x => x.endsWith('.tar.gz'));
  assert.equal(files.length, 1);
  const listing = spawnSync(bash, ['-c', 'tar -tzf "$1"', 'test', `backups/${files[0]}`], { cwd: dir, encoding: 'utf8' });
  for (const file of ['database.dump', 'uploads.tar.gz', '.env', 'manifest.txt']) assert.ok(listing.stdout.includes(file));
  const commands = fs.readFileSync(path.join(dir, 'commands.log'), 'utf8');
  assert.ok(commands.indexOf('stop app') < commands.indexOf('pg_dump'));
  assert.ok(commands.indexOf('start app') > commands.indexOf('pg_dump'));
});
test('failed dump resumes app and never publishes a completed backup', () => {
  const dir = fixture();
  const result = run(dir, 'scripts/backup.sh', [], { FAIL_DUMP: '1' });
  assert.notEqual(result.status, 0);
  const commands = fs.readFileSync(path.join(dir, 'commands.log'), 'utf8');
  assert.ok(commands.includes('stop app'));
  assert.ok(commands.includes('start app'));
  const backupDir = path.join(dir, 'backups');
  assert.ok(!fs.existsSync(backupDir) || fs.readdirSync(backupDir).every(x => !x.endsWith('.tar.gz')));
});
test('restore refuses an already configured target and leaves its env intact', () => {
  const dir = fixture();
  const original = fs.readFileSync(path.join(dir, '.env'), 'utf8');
  const result = run(dir, 'scripts/restore.sh', ['not-an-archive.tar.gz']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /\.env/);
  assert.equal(fs.readFileSync(path.join(dir, '.env'), 'utf8'), original);
  assert.ok(!fs.existsSync(path.join(dir, 'commands.log')));
});

test('backup never starts an app that was already stopped', () => {
  const dir = fixture();
  const result = run(dir, 'scripts/backup.sh', [], { APP_STOPPED: '1' });
  assert.equal(result.status, 0, result.stderr);
  const commands = fs.readFileSync(path.join(dir, 'commands.log'), 'utf8');
  assert.ok(!commands.includes('stop app'));
  assert.ok(!commands.includes('start app'));
});

test('failure to resume app is reported as a failed operation', () => {
  const dir = fixture();
  const result = run(dir, 'scripts/backup.sh', [], { FAIL_START: '1' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Не удалось возобновить API/);
});

test('restore refuses nonempty database before importing or writing env', () => {
  const dir = fixture();
  assert.equal(run(dir, 'scripts/backup.sh').status, 0);
  const archive = fs.readdirSync(path.join(dir, 'backups')).find(x => x.endsWith('.tar.gz'));
  fs.unlinkSync(path.join(dir, '.env'));
  fs.writeFileSync(path.join(dir, 'commands.log'), '');
  const result = run(dir, 'scripts/restore.sh', [`backups/${archive}`]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /не пустая/);
  assert.ok(!fs.existsSync(path.join(dir, '.env')));
  assert.ok(!fs.readFileSync(path.join(dir, 'commands.log'), 'utf8').includes('pg_restore'));
});

for (const [name, fault] of [['unreadable uploads', { FAIL_FIND: '1' }], ['nonempty uploads', { NONEMPTY_UPLOADS: '1' }]]) {
  test(`restore refuses ${name} before importing or writing env`, () => {
    const dir = fixture();
    assert.equal(run(dir, 'scripts/backup.sh').status, 0);
    const archive = fs.readdirSync(path.join(dir, 'backups')).find(x => x.endsWith('.tar.gz'));
    fs.unlinkSync(path.join(dir, '.env'));
    fs.writeFileSync(path.join(dir, 'commands.log'), '');
    const result = run(dir, 'scripts/restore.sh', [`backups/${archive}`], { DB_TABLES: '0', ...fault });
    assert.notEqual(result.status, 0, result.stderr);
    assert.ok(!fs.existsSync(path.join(dir, '.env')));
    const commands = fs.readFileSync(path.join(dir, 'commands.log'), 'utf8');
    assert.ok(!commands.includes('pg_restore'));
    assert.ok(!commands.includes('tar -xzf'));
  });
}
