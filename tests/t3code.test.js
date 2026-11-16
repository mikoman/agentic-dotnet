'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { inspect, findings } = require('../scripts/t3code');

const SECRET = 'PLANTED-SECRET-VALUE';
const REQUIRED = ['asd-ste100', 'j-space', 'grilling'];

function write(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value));
}

function cache(driver, extra = {}) {
  return { driver, instanceId: driver, enabled: true, installed: true, skills: [], ...extra };
}

function skills(...names) {
  return names.map(name => ({ name, path: '/x/' + name + '/SKILL.md', scope: 'user', enabled: true }));
}

function makeHome(t) {
  const temporary = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'agentic-t3-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const directory = path.join(temporary, '.t3');
  write(path.join(directory, 'userdata/desktop-last-started-version'), '0.1.7\n');
  write(path.join(directory, 'userdata/settings.json'), {
    providerInstances: {
      cursor: { driver: 'cursor', enabled: false, config: { binaryPath: 'cursor-agent' } },
      opencode: { driver: 'opencode', enabled: true, config: { binaryPath: 'opencode', serverPassword: SECRET } },
      'codex-work': { driver: 'codex', enabled: true, config: { homePath: '/somewhere/else' } },
    },
  });
  write(path.join(directory, 'userdata/secrets/server-signing-key'), SECRET);
  write(path.join(directory, 'caches/claudeAgent.json'), cache('claudeAgent', { skills: skills(...REQUIRED) }));
  write(path.join(directory, 'caches/codex.json'), cache('codex', { skills: skills('asd-ste100') }));
  write(path.join(directory, 'caches/codex-work.json'), cache('codex', { instanceId: 'codex-work', skills: skills(...REQUIRED) }));
  write(path.join(directory, 'caches/opencode.json'), cache('opencode'));
  write(path.join(directory, 'caches/cursor.json'), cache('cursor', { enabled: false, installed: false }));
  write(path.join(directory, 'caches/pi.json'), cache('pi'));
  return directory;
}

function describe(list) {
  return list.map(([level, message]) => level + ' ' + message).join('\n');
}

test('inspect returns null when T3 Code has no home directory', t => {
  const temporary = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'agentic-t3-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  assert.equal(inspect(path.join(temporary, 'missing')), null);
  assert.deepEqual(findings(null, { requiredSkills: REQUIRED }), []);
});

test('inspect reads only whitelisted fields and never returns a planted secret', t => {
  const info = inspect(makeHome(t));
  assert.equal(info.version, '0.1.7');
  assert.deepEqual(info.providers.map(provider => provider.instance), ['claudeAgent', 'codex', 'codex-work', 'cursor', 'opencode', 'pi']);
  assert.deepEqual(Object.keys(info.providers[0]).sort(), ['customHome', 'driver', 'enabled', 'installed', 'instance', 'skills']);
  assert.equal(JSON.stringify(info).includes(SECRET), false);
  assert.equal(info.providers.find(provider => provider.instance === 'codex-work').customHome, true);
  assert.equal(info.providers.find(provider => provider.instance === 'opencode').customHome, false);
});

test('findings report skills, custom homes, missing adapters, and OpenCode state', t => {
  const info = inspect(makeHome(t));
  const configured = describe(findings(info, { requiredSkills: REQUIRED, opencodeConfigured: true, opencodeDirectory: '/h/.config/opencode' }));
  assert.match(configured, /PASS T3 Code 0\.1\.7 found/);
  assert.match(configured, /PASS T3 provider claudeAgent skill cache lists the shared skills/);
  assert.match(configured, /WARN T3 provider codex skill cache lacks j-space, grilling/);
  assert.match(configured, /WARN T3 provider codex-work uses a custom home path/);
  assert.match(configured, /WARN T3 provider opencode shows no skills in T3 Code/);
  assert.match(configured, /WARN T3 provider pi \(pi\) is enabled\. This package has no adapter for it\./);
  assert.doesNotMatch(configured, /provider cursor/);
  assert.equal(configured.includes(SECRET), false);

  const missing = describe(findings(info, { requiredSkills: REQUIRED, opencodeConfigured: false, opencodeDirectory: '/h/.config/opencode' }));
  assert.match(missing, /WARN T3 provider opencode is enabled, but \/h\/\.config\/opencode does not exist/);
});

test('findings warn about an empty skill cache', t => {
  const directory = makeHome(t);
  write(path.join(directory, 'caches/claudeAgent.json'), cache('claudeAgent'));
  const text = describe(findings(inspect(directory), { requiredSkills: REQUIRED, opencodeConfigured: true, opencodeDirectory: '/h' }));
  assert.match(text, /WARN T3 provider claudeAgent has an empty skill cache/);
});

test('command line summary uses T3CODE_HOME, lists providers, and prints no secret', t => {
  const directory = makeHome(t);
  const script = path.resolve(__dirname, '../scripts/t3code.js');
  const result = spawnSync(process.execPath, [script], { encoding: 'utf8', timeout: 15000, env: { ...process.env, T3CODE_HOME: directory } });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\[install\] T3 Code 0\.1\.7 found/);
  assert.match(result.stdout, /T3 provider claudeAgent: configured through the Claude Code adapter\./);
  assert.match(result.stdout, /T3 provider opencode: configured through the OpenCode adapter\./);
  assert.match(result.stdout, /T3 provider pi: no adapter in this package\./);
  assert.equal(result.stdout.includes(SECRET) || result.stderr.includes(SECRET), false);

  const absent = spawnSync(process.execPath, [script], { encoding: 'utf8', timeout: 15000, env: { ...process.env, T3CODE_HOME: path.join(directory, 'missing') } });
  assert.equal([3, 4].includes(absent.status), true);
  assert.equal(absent.stdout, '');
});
