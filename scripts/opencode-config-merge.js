#!/usr/bin/env node
'use strict';

// Managed by ~/.agentic-dotnet. Merges the canonical OpenCode additions into the global
// opencode.json idempotently. The managed parts are the Microsoft Learn MCP server
// (policy source: config/mcp.yaml) and the official dotnet/skills skill directories
// (selection source: config/plugins.yaml). Every other setting stays unchanged.
//
// OpenCode 2.2.5 stops loading all skills when the first skills path does not exist.
// The merge therefore lists only directories that exist and removes stale managed entries.
// The file can hold an API key, so new files and backups use mode 0600.

const fs = require('fs');
const path = require('path');
const util = require('util');
const { home, plugins, officialSkillsDirectory } = require('./managed');

const SCHEMA = 'https://opencode.ai/config.json';
const LEARN = { type: 'remote', url: 'https://learn.microsoft.com/api/mcp' };
const MANAGED_PREFIX = path.join(home, '.cache/agentic-dotnet/dotnet-skills/plugins') + path.sep;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function fold(value) {
  return process.platform === 'win32' ? value.toLowerCase() : value;
}

function isManagedEntry(entry) {
  return typeof entry === 'string' && fold(path.normalize(entry)).startsWith(fold(MANAGED_PREFIX));
}

function presentSkillDirectories() {
  const result = [];
  for (const name of plugins()) {
    const directory = officialSkillsDirectory(name);
    let present = false;
    try { present = fs.statSync(directory).isDirectory(); } catch { present = false; }
    if (present) { result.push(directory); }
  }
  return result;
}

function mergeEntries(existing, canonical) {
  return existing.filter(entry => !isManagedEntry(entry)).concat(canonical);
}

function applyPatch(current, directories) {
  const out = JSON.parse(JSON.stringify(current));

  if (out.mcp === undefined) { out.mcp = {}; }
  if (!isPlainObject(out.mcp)) { throw new Error('"mcp" is not an object'); }
  if (out.mcp.servers === undefined) { out.mcp.servers = {}; }
  if (!isPlainObject(out.mcp.servers)) { throw new Error('"mcp.servers" is not an object'); }
  out.mcp.servers['microsoft-learn'] = { ...LEARN };

  if (Array.isArray(out.skills)) {
    out.skills = mergeEntries(out.skills, directories);
  } else if (isPlainObject(out.skills)) {
    if (out.skills.paths !== undefined && !Array.isArray(out.skills.paths)) {
      throw new Error('"skills.paths" is not an array');
    }
    if (out.skills.paths !== undefined || directories.length > 0) {
      out.skills.paths = mergeEntries(out.skills.paths || [], directories);
    }
  } else if (out.skills === undefined) {
    if (directories.length > 0) { out.skills = directories; }
  } else {
    throw new Error('"skills" has an unsupported type');
  }
  return out;
}

function backupOriginal(backupRoot, file, content) {
  if (!backupRoot) { return; }
  const relative = file.replace(/^[a-zA-Z]:[\\/]/, '').replace(/^[\\/]/, '');
  const destination = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
  fs.writeFileSync(destination, content, { mode: 0o600 });
}

function main() {
  const [, , targetFile, backupRoot] = process.argv;
  if (!targetFile) {
    console.error('usage: opencode-config-merge.js <targetFile> [backupRoot]');
    process.exit(2);
  }

  let raw = null;
  try { raw = fs.readFileSync(targetFile, 'utf8'); } catch { raw = null; }

  let current;
  try { current = raw === null ? {} : JSON.parse(raw); } catch (error) {
    console.error('could not parse ' + targetFile + ': ' + error.message);
    process.exit(1);
  }
  if (!isPlainObject(current)) {
    console.error('could not merge ' + targetFile + ': the top level is not an object');
    process.exit(1);
  }

  let merged;
  try { merged = applyPatch(current, presentSkillDirectories()); } catch (error) {
    console.error('could not merge ' + targetFile + ': ' + error.message);
    process.exit(1);
  }
  if (raw === null) { merged = { $schema: SCHEMA, ...merged }; }
  if (util.isDeepStrictEqual(current, merged)) { process.exit(0); }

  if (raw !== null) { backupOriginal(backupRoot, targetFile, raw); }
  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  fs.writeFileSync(targetFile, JSON.stringify(merged, null, 2) + '\n', { mode: 0o600 });
  console.log('updated ' + targetFile);
}

if (require.main === module) {
  main();
}

module.exports = { applyPatch, isManagedEntry };
