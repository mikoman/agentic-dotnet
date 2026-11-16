'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { plugins } = require('../scripts/managed');

const script = path.resolve(__dirname, '../scripts/opencode-config-merge.js');
const LEARN = { type: 'remote', url: 'https://learn.microsoft.com/api/mcp' };

function fixture(t) {
  const temporary = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'agentic-opencode-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const userHome = path.join(temporary, 'user');
  return {
    userHome,
    target: path.join(userHome, '.config', 'opencode', 'opencode.json'),
    backupRoot: path.join(temporary, 'backup'),
  };
}

function skillsDirectory(userHome, name) {
  return path.join(userHome, '.cache/agentic-dotnet/dotnet-skills/plugins', name, 'skills');
}

function makeSkills(userHome, names) {
  for (const name of names) { fs.mkdirSync(skillsDirectory(userHome, name), { recursive: true }); }
}

function runMerge(userHome, target, backupRoot) {
  const args = [script, target];
  if (backupRoot) { args.push(backupRoot); }
  return spawnSync(process.execPath, args, {
    encoding: 'utf8',
    timeout: 15000,
    env: { ...process.env, AGENTIC_DOTNET_USER_HOME: userHome },
  });
}

function writeConfig(target, value) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n');
}

test('opencode merge adds Learn MCP and existing skill directories, preserves user settings, and is idempotent', t => {
  const { userHome, target, backupRoot } = fixture(t);
  const [first, second] = plugins();
  makeSkills(userHome, [first, second]);
  const original = {
    $schema: 'https://opencode.ai/config.json',
    model: 'local/model',
    provider: { local: { options: { baseURL: 'http://127.0.0.1:8000/v1', apiKey: 'TEST-KEY-VALUE' } } },
    instructions: ['docs/extra.md'],
    skills: ['/custom/skills'],
    mcp: { servers: { 'user-server': { type: 'local', command: ['example'] } }, timeout: { startup: 5000 } },
  };
  writeConfig(target, original);

  const result = runMerge(userHome, target, backupRoot);
  assert.equal(result.status, 0, result.stderr);
  const merged = JSON.parse(fs.readFileSync(target, 'utf8'));
  assert.deepEqual(merged.mcp.servers['microsoft-learn'], LEARN);
  assert.deepEqual(merged.mcp.servers['user-server'], original.mcp.servers['user-server']);
  assert.deepEqual(merged.mcp.timeout, original.mcp.timeout);
  assert.deepEqual(merged.provider, original.provider);
  assert.deepEqual(merged.instructions, original.instructions);
  assert.equal(merged.model, original.model);
  assert.deepEqual(merged.skills, ['/custom/skills', skillsDirectory(userHome, first), skillsDirectory(userHome, second)]);

  const relative = target.replace(/^[a-zA-Z]:[\\/]/, '').replace(/^[\\/]/, '');
  const backedUp = path.join(backupRoot, relative);
  assert.equal(fs.readFileSync(backedUp, 'utf8'), JSON.stringify(original, null, 2) + '\n');
  if (process.platform !== 'win32') { assert.equal(fs.statSync(backedUp).mode & 0o777, 0o600); }

  const before = fs.readFileSync(target, 'utf8');
  const again = runMerge(userHome, target, backupRoot);
  assert.equal(again.status, 0, again.stderr);
  assert.equal(fs.readFileSync(target, 'utf8'), before);
  assert.equal(again.stdout.trim(), '');
});

test('opencode merge removes stale managed skill entries and keeps user entries first', t => {
  const { userHome, target } = fixture(t);
  const [first, second] = plugins();
  makeSkills(userHome, [second]);
  writeConfig(target, { skills: [skillsDirectory(userHome, first), '/custom/skills'] });

  const result = runMerge(userHome, target);
  assert.equal(result.status, 0, result.stderr);
  const merged = JSON.parse(fs.readFileSync(target, 'utf8'));
  assert.deepEqual(merged.skills, ['/custom/skills', skillsDirectory(userHome, second)]);
});

test('opencode merge supports the deprecated skills object and creates no empty skills entry', t => {
  const { userHome, target } = fixture(t);
  const [first] = plugins();
  makeSkills(userHome, [first]);
  writeConfig(target, { skills: { paths: ['/custom/skills'], urls: ['https://example.com/skills/'] } });
  assert.equal(runMerge(userHome, target).status, 0);
  const merged = JSON.parse(fs.readFileSync(target, 'utf8'));
  assert.deepEqual(merged.skills.paths, ['/custom/skills', skillsDirectory(userHome, first)]);
  assert.deepEqual(merged.skills.urls, ['https://example.com/skills/']);

  const bare = fixture(t);
  writeConfig(bare.target, {});
  assert.equal(runMerge(bare.userHome, bare.target).status, 0);
  const bareMerged = JSON.parse(fs.readFileSync(bare.target, 'utf8'));
  assert.deepEqual(bareMerged.mcp.servers['microsoft-learn'], LEARN);
  assert.equal('skills' in bareMerged, false);
});

test('opencode merge creates a missing file with a schema, owner-only mode, and no phantom backup', t => {
  const { userHome, target, backupRoot } = fixture(t);
  const result = runMerge(userHome, target, backupRoot);
  assert.equal(result.status, 0, result.stderr);
  const merged = JSON.parse(fs.readFileSync(target, 'utf8'));
  assert.equal(merged.$schema, 'https://opencode.ai/config.json');
  assert.deepEqual(merged.mcp.servers['microsoft-learn'], LEARN);
  assert.equal(fs.existsSync(backupRoot), false);
  if (process.platform !== 'win32') { assert.equal(fs.statSync(target).mode & 0o777, 0o600); }
});

test('opencode merge keeps the mode of an existing owner-only file', { skip: process.platform === 'win32' }, t => {
  const { userHome, target } = fixture(t);
  writeConfig(target, { model: 'local/model' });
  fs.chmodSync(target, 0o600);
  assert.equal(runMerge(userHome, target).status, 0);
  assert.equal(fs.statSync(target).mode & 0o777, 0o600);
});

test('opencode merge refuses invalid input and leaves the file untouched', t => {
  const { userHome, target } = fixture(t);
  for (const text of ['{not json', '[]', '{"mcp": []}', '{"mcp": {"servers": 1}}', '{"skills": 5}', '{"skills": {"paths": "x"}}']) {
    writeConfig(target, text);
    const result = runMerge(userHome, target);
    assert.equal(result.status, 1, text);
    assert.equal(fs.readFileSync(target, 'utf8'), text);
  }
});
