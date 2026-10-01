#!/usr/bin/env node
'use strict';

// Managed by ~/.agentic-dotnet. Merges the canonical Microsoft Learn MCP registration
// (policy source: config/mcp.yaml) into the OMP user MCP file idempotently while
// preserving every other entry: additional servers, disabledServers, enabledServers,
// and unknown keys. The managed entry is the "microsoft-learn" server only.

const fs = require('fs');
const path = require('path');
const util = require('util');

const [, , targetFile, backupRoot] = process.argv;

const SCHEMA = 'https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/src/config/mcp-schema.json';
const MANAGED = {
  'microsoft-learn': {
    type: 'http',
    url: 'https://learn.microsoft.com/api/mcp',
  },
};

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function applyPatch(current, patch) {
  const out = JSON.parse(JSON.stringify(current));
  if (!isPlainObject(out.mcpServers)) { out.mcpServers = {}; }
  for (const [name, cfg] of Object.entries(patch)) { out.mcpServers[name] = cfg; }
  if (typeof out.$schema !== 'string') {
    const rebuilt = { $schema: SCHEMA };
    for (const [key, value] of Object.entries(out)) { rebuilt[key] = value; }
    return rebuilt;
  }
  return out;
}

function backupOriginal(file, content) {
  if (!backupRoot) { return; }
  const relative = file.replace(/^[a-zA-Z]:[\\/]/, '').replace(/^\//, '');
  const destination = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content);
}

function main() {
  if (!targetFile) {
    console.error('usage: omp-mcp-merge.js <targetFile> [backupRoot]');
    process.exit(2);
  }

  let raw = null;
  try { raw = fs.readFileSync(targetFile, 'utf8'); } catch { raw = null; }

  let current;
  try { current = raw === null ? {} : JSON.parse(raw); } catch (error) {
    console.error('could not parse ' + targetFile + ': ' + error.message);
    process.exit(1);
  }

  const merged = applyPatch(current, MANAGED);
  if (util.isDeepStrictEqual(current, merged)) { process.exit(0); }

  if (raw !== null) { backupOriginal(targetFile, raw); }
  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  fs.writeFileSync(targetFile, JSON.stringify(merged, null, 2) + '\n');
  console.log('updated ' + targetFile);
}

main();
