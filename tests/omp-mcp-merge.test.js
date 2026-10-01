'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const script = path.resolve(__dirname, '../scripts/omp-mcp-merge.js');

function runMerge(target, backupRoot) {
  const args = [script, target];
  if (backupRoot) { args.push(backupRoot); }
  return spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 15000 });
}

test('omp mcp merge adds microsoft-learn once and preserves user entries', t => {
  const temporary = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'agentic-omp-mcp-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const target = path.join(temporary, '.omp', 'agent', 'mcp.json');
  const backupRoot = path.join(temporary, 'backup');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const original = {
    mcpServers: { 'user-server': { type: 'stdio', command: 'example', args: ['--flag'] } },
    disabledServers: ['user-server'],
    customKey: 42,
  };
  fs.writeFileSync(target, JSON.stringify(original, null, 2) + '\n');

  const first = runMerge(target, backupRoot);
  assert.equal(first.status, 0, first.stderr);
  const merged = JSON.parse(fs.readFileSync(target, 'utf8'));
  assert.deepEqual(merged.mcpServers['microsoft-learn'], { type: 'http', url: 'https://learn.microsoft.com/api/mcp' });
  assert.deepEqual(merged.mcpServers['user-server'], original.mcpServers['user-server']);
  assert.deepEqual(merged.disabledServers, ['user-server']);
  assert.equal(merged.customKey, 42);
  assert.equal(typeof merged.$schema, 'string');
  const backedUp = path.join(backupRoot, target.replace(/^[a-zA-Z]:[\\/]/, '').replace(/^\//, ''));
  assert.equal(fs.readFileSync(backedUp, 'utf8'), JSON.stringify(original, null, 2) + '\n');

  const before = fs.readFileSync(target, 'utf8');
  const second = runMerge(target, backupRoot);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(fs.readFileSync(target, 'utf8'), before);
  assert.equal(second.stdout.trim(), '');
});

test('omp mcp merge creates a missing file without a phantom backup', t => {
  const temporary = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'agentic-omp-mcp-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const target = path.join(temporary, '.omp', 'agent', 'mcp.json');
  const backupRoot = path.join(temporary, 'backup');
  const result = runMerge(target, backupRoot);
  assert.equal(result.status, 0, result.stderr);
  const merged = JSON.parse(fs.readFileSync(target, 'utf8'));
  assert.deepEqual(merged.mcpServers['microsoft-learn'], { type: 'http', url: 'https://learn.microsoft.com/api/mcp' });
  assert.equal(fs.existsSync(backupRoot), false);
});

test('omp mcp merge refuses invalid JSON and leaves the file untouched', t => {
  const temporary = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'agentic-omp-mcp-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const target = path.join(temporary, 'mcp.json');
  fs.writeFileSync(target, '{not json');
  const result = runMerge(target);
  assert.equal(result.status, 1);
  assert.equal(fs.readFileSync(target, 'utf8'), '{not json');
});
