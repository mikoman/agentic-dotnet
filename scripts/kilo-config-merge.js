#!/usr/bin/env node
'use strict';

// Managed by ~/.agentic-dotnet. Merges the canonical Kilo additions (Microsoft Learn MCP
// and official dotnet/skills skill paths) into ~/.config/kilo/kilo.jsonc idempotently while
// preserving every other user setting. Edit the canonical sources (config/plugins.yaml and
// config/mcp.yaml) instead of the generated sections.

const fs = require('fs');
const path = require('path');
const util = require('util');

const [, , targetFile, backupRoot] = process.argv;

function stripJsonc(text) {
  let out = '';
  let i = 0;
  let quote = null;
  while (i < text.length) {
    const c = text[i];
    if (quote) {
      out += c;
      if (c === '\\') { out += text[i + 1] || ''; i += 2; continue; }
      if (c === quote) quote = null;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; out += c; i += 1; continue; }
    if (c === '/' && text[i + 1] === '/') { while (i < text.length && text[i] !== '\n') i += 1; continue; }
    if (c === '/' && text[i + 1] === '*') { i += 2; while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i += 1; i += 2; continue; }
    if (c === ',') {
      let j = i + 1;
      while (j < text.length && /\s/.test(text[j])) j += 1;
      if (text[j] === '}' || text[j] === ']') { i += 1; continue; }
    }
    out += c;
    i += 1;
  }
  return out;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function applyPatch(current, patch) {
  const out = JSON.parse(JSON.stringify(current));

  if (patch.mcp) {
    if (!isPlainObject(out.mcp)) out.mcp = {};
    for (const [name, cfg] of Object.entries(patch.mcp)) out.mcp[name] = cfg;
  }

  if (patch.skills && Array.isArray(patch.skills.paths)) {
    if (!isPlainObject(out.skills)) out.skills = {};
    const canonical = patch.skills.paths;
    const managedPrefix = typeof patch.skills.managedPrefix === 'string' ? patch.skills.managedPrefix : '';
    const existing = Array.isArray(out.skills.paths) ? out.skills.paths : [];
    const preserved = existing.filter((p) => {
      if (typeof p !== 'string') return false;
      if (canonical.includes(p)) return false;
      if (managedPrefix && p.startsWith(managedPrefix)) return false;
      return true;
    });
    out.skills.paths = canonical.concat(preserved);
  }

  return out;
}

function backupOriginal(backupRoot, file, content) {
  if (!backupRoot) return;
  const relative = file.replace(/^\//, '');
  const destination = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content);
}

function main() {
  if (!targetFile) {
    console.error('usage: kilo-config-merge.js <targetFile> [backupRoot]');
    process.exit(2);
  }

  let patchText = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => { patchText += d; });
  process.stdin.on('end', () => {
    let patch;
    try { patch = JSON.parse(patchText); } catch (e) {
      console.error('invalid patch JSON: ' + e.message);
      process.exit(2);
    }

    let raw = '';
    try { raw = fs.readFileSync(targetFile, 'utf8'); } catch (e) { raw = '{}'; }

    let current;
    try { current = JSON.parse(stripJsonc(raw) || '{}'); } catch (e) {
      console.error('could not parse ' + targetFile + ': ' + e.message);
      process.exit(1);
    }

    const merged = applyPatch(current, patch);
    if (util.isDeepStrictEqual(current, merged)) {
      process.exit(0);
    }

    backupOriginal(backupRoot, targetFile, raw);
    const output = '// mcp and skills sections are managed by ~/.agentic-dotnet; edit config/plugins.yaml and config/mcp.yaml.\n' + JSON.stringify(merged, null, 2) + '\n';
    fs.mkdirSync(path.dirname(targetFile), { recursive: true });
    fs.writeFileSync(targetFile, output);
    console.log('updated ' + targetFile);
  });
}

main();
