'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { deploy, snapshot, matches } = require('../scripts/cursor-adapter');
const { releaseFiles, stage, checkTarget } = require('../scripts/release-files');
const { run } = require('../scripts/managed');

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'agentic-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}
function write(directory, name, text) {
  const file = path.join(directory, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  return file;
}

test('Cursor deployment is physical, backed up, idempotent, and preserves local edits', t => {
  const directory = fixture(t);
  const source = path.join(directory, 'source');
  write(source, 'rules/test.mdc', 'first');
  const destination = path.join(directory, 'local/plugin');
  const backup = path.join(directory, 'backup');
  fs.mkdirSync(path.dirname(destination));
  fs.symlinkSync(source, destination, process.platform === 'win32' ? 'junction' : 'dir');
  assert.equal(deploy(source, destination, backup), 'deployed');
  assert.equal(fs.lstatSync(destination).isSymbolicLink(), false);
  assert.equal(fs.lstatSync(path.join(backup, 'plugin')).isSymbolicLink(), true);
  assert.equal(deploy(source, destination, backup), 'unchanged');
  write(source, 'rules/test.mdc', 'second');
  assert.equal(deploy(source, destination, path.join(directory, 'backup-2')), 'deployed');
  assert.equal(matches(destination, snapshot(source)), true);
  write(destination, 'rules/test.mdc', 'local edit');
  assert.throws(() => deploy(source, destination, backup), /Modified/);
  assert.equal(fs.readFileSync(path.join(destination, 'rules/test.mdc'), 'utf8'), 'local edit');
});

test('Cursor preserves unmanaged directories', t => {
  const directory = fixture(t);
  const source = path.join(directory, 'source');
  const destination = path.join(directory, 'local');
  write(source, 'plugin.json', '{}');
  write(destination, 'user.txt', 'keep');
  assert.throws(() => deploy(source, destination, path.join(directory, 'backup')), /Unmanaged/);
  assert.equal(fs.readFileSync(path.join(destination, 'user.txt'), 'utf8'), 'keep');
});

test('release allowlist excludes untracked data and rejects unsafe paths', t => {
  const directory = fixture(t);
  const source = path.join(directory, 'source');
  const manifest = ['.github/test.yml', 'README.md', 'config/release-files.json'];
  write(source, 'README.md', 'release');
  write(source, '.github/test.yml', 'workflow');
  write(source, 'config/release-files.json', JSON.stringify(manifest));
  write(source, '.env', 'fixture only');
  write(source, '.gitnexus/data', 'excluded');
  write(source, 'private.txt', 'excluded');
  const destination = path.join(directory, 'stage');
  assert.deepEqual(stage(source, destination), manifest);
  assert.equal(fs.existsSync(path.join(destination, 'private.txt')), false);
  assert.equal(fs.existsSync(path.join(destination, '.env')), false);
  assert.equal(fs.existsSync(path.join(destination, '.github/test.yml')), true);
  assert.throws(() => stage(source, destination), /empty/);
  for (const bad of ['../escape', '.env', '.gitnexus/data', 'cert.key', '/absolute']) {
    write(source, 'config/release-files.json', JSON.stringify([bad]));
    assert.throws(() => releaseFiles(source), /release path/);
  }
});

test('bootstrap rejects linked destination directories without changing targets', t => {
  const directory = fixture(t);
  const source = path.join(directory, 'source');
  write(source, 'rules/a.txt', 'new');
  write(source, 'config/release-files.json', JSON.stringify(['rules/a.txt']));
  const outside = path.join(directory, 'outside');
  write(outside, 'a.txt', 'keep');
  const destination = path.join(directory, 'destination');
  fs.mkdirSync(destination);
  fs.symlinkSync(outside, path.join(destination, 'rules'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => checkTarget(source, destination), /Linked package/);
  assert.equal(fs.readFileSync(path.join(outside, 'a.txt'), 'utf8'), 'keep');
});

test('bounded command returns after a timeout', t => {
  const directory = fixture(t);
  const script = write(directory, 'slow.js', 'setInterval(() => {}, 1000);');
  const start = Date.now();
  const result = run(process.execPath, [script], 200);
  assert.equal(result.error?.code, 'ETIMEDOUT');
  assert.ok(Date.now() - start < 5000);
});
