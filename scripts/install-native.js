#!/usr/bin/env node
'use strict';

const { plugins, run } = require('./managed');
let failures = 0;
function warn(message) { console.log('[install] WARN ' + message); }
function checked(harness, args) {
  const result = run(harness, args, 60000);
  if (result.status !== 0) { failures++; warn(harness + ' command failed or timed out: ' + args.slice(0, 3).join(' ')); }
  return result;
}
for (const harness of ['codex', 'claude']) {
  const available = run(harness, ['--version']);
  if (available.error?.code === 'ENOENT' || (process.platform === 'win32' && available.status === 1 && !available.stdout)) {
    warn(harness + ' unavailable. Its file adapters are prepared.'); continue;
  }
  if (available.status !== 0) { failures++; warn(harness + ' availability check failed'); continue; }
  const verb = harness === 'codex' ? 'add' : 'install';
  if (checked(harness, ['plugin', verb, '--help']).status !== 0) { continue; }
  const marketplaces = checked(harness, ['plugin', 'marketplace', 'list']);
  if (marketplaces.status !== 0) { continue; }
  if (!marketplaces.stdout.includes('dotnet-agent-skills')) {
    if (checked(harness, ['plugin', 'marketplace', 'add', '--help']).status !== 0) { continue; }
    const args = ['plugin', 'marketplace', 'add', ...(harness === 'claude' ? ['--scope', 'user'] : []), 'dotnet/skills'];
    if (checked(harness, args).status !== 0) { continue; }
  }
  const query = harness === 'codex' ? ['plugin', 'list', '--marketplace', 'dotnet-agent-skills', '--json'] : ['plugin', 'list', '--json'];
  const result = checked(harness, query);
  if (result.status !== 0) { continue; }
  let entries;
  try { const state = JSON.parse(result.stdout); entries = harness === 'codex' ? state.installed : state; if (!Array.isArray(entries)) { throw new Error(); } }
  catch { failures++; warn(harness + ' status is invalid. No plugin changes attempted.'); continue; }
  for (const name of plugins()) {
    const existing = entries.find(entry => harness === 'codex' ? entry.name === name && entry.marketplaceName === 'dotnet-agent-skills' && entry.installed : entry.id === name + '@dotnet-agent-skills');
    if (existing) {
      console.log('[install] Preserve ' + harness + '/' + name + (existing.enabled === false ? ' (disabled)' : ' (installed)'));
      continue;
    }
    checked(harness, ['plugin', verb, ...(harness === 'claude' ? ['--scope', 'user'] : []), name + '@dotnet-agent-skills']);
  }
  const mcp = run(harness, ['mcp', 'get', 'microsoft-learn']);
  if (mcp.status === 0) { console.log('[install] Preserve ' + harness + ' Microsoft Learn registration'); }
  else if (mcp.error || mcp.signal) { failures++; warn(harness + ' MCP status unknown. No change attempted.'); }
  else {
    if (checked(harness, ['mcp', 'add', '--help']).status !== 0) { continue; }
    const args = harness === 'codex'
      ? ['mcp', 'add', 'microsoft-learn', '--url', 'https://learn.microsoft.com/api/mcp']
      : ['mcp', 'add', '--scope', 'user', '--transport', 'http', 'microsoft-learn', 'https://learn.microsoft.com/api/mcp'];
    checked(harness, args);
  }
}
process.exitCode = failures ? 1 : 0;
