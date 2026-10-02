'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
if (Number(process.versions.node.split('.')[0]) < 18) { throw new Error('Node.js 18 or later is required.'); }

const root = path.resolve(process.env.AGENTIC_DOTNET_HOME || path.join(__dirname, '..'));
const home = process.env.AGENTIC_DOTNET_USER_HOME || os.homedir();
const copilotHome = process.env.COPILOT_HOME || path.join(home, '.copilot');

function plugins(directory = root) {
  let active = false;
  const names = [];
  for (const line of fs.readFileSync(path.join(directory, 'config/plugins.yaml'), 'utf8').split(/\r?\n/)) {
    if (/^(core|standard|optional):/.test(line)) {
      active = true;
    } else if (/^[a-zA-Z_][\w-]*:/.test(line)) {
      active = false;
    } else if (active && /^\s+- [a-z0-9-]+\s*$/.test(line)) {
      names.push(line.trim().slice(2));
    }
  }
  return [...new Set(names)];
}

function run(command, args, timeout = 15000, options = {}) {
  const settings = { encoding: 'utf8', timeout, maxBuffer: 8 * 1024 * 1024, ...options };
  // Windows npm shims require a shell. Reject shell expansion in supplied values.
  if (process.platform === 'win32') {
    const values = [command, ...args];
    if (values.some(value => /["%!^&|<>\r\n]/.test(value))) {
      return { status: null, error: { code: 'UNSAFE_SHELL_ARGUMENT' }, stdout: '', stderr: '' };
    }
    return spawnSync(values.map(value => '"' + value + '"').join(' '), { ...settings, shell: true });
  }
  return spawnSync(command, args, settings);
}

function stableVersionAtLeast(actual, minimum) {
  function parse(value) {
    if (typeof value !== 'string' || !/^\d+\.\d+\.\d+$/.test(value)) { return null; }
    const parts = value.split('.').map(Number);
    return parts.every(Number.isSafeInteger) ? parts : null;
  }
  const version = parse(actual);
  const baseline = parse(minimum);
  if (!version || !baseline) { return false; }
  for (let index = 0; index < baseline.length; index++) {
    if (version[index] !== baseline[index]) { return version[index] > baseline[index]; }
  }
  return true;
}

function exists(file) {
  try { fs.lstatSync(file); return true; } catch (error) {
    if (error.code === 'ENOENT') { return false; }
    throw error;
  }
}

function samePath(left, right) {
  // Windows can spell the same directory with a long name or an 8.3 alias.
  return fs.realpathSync.native(left) === fs.realpathSync.native(right);
}

function files(directory, prefix = '') {
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isSymbolicLink()) { throw new Error('Refusing a linked source: ' + relative); }
    if (entry.isDirectory()) {
      result.push(...files(path.join(directory, entry.name), relative + '/'));
    } else if (entry.isFile()) {
      result.push(relative);
    }
  }
  return result.sort();
}

function digest(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function treeDigest(directory) {
  const entries = files(directory).map(name => [name, digest(path.join(directory, name))]);
  return crypto.createHash('sha256').update(JSON.stringify(entries)).digest('hex');
}

module.exports = { root, home, copilotHome, plugins, run, stableVersionAtLeast, exists, samePath, files, digest, treeDigest };
