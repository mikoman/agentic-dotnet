#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { root, home, run, plugins, treeDigest } = require('./managed');
const apply = process.argv.includes('--apply');
const selected = process.argv.find(value => value.startsWith('--harness='))?.split('=')[1];
if (selected && !['codex', 'claude'].includes(selected)) { throw new Error('Unsupported harness.'); }
const baseline = JSON.parse(fs.readFileSync(path.join(root, 'config/plugin-versions.json'), 'utf8'));
const versions = baseline.versions;
function contentMatches(harness, name, version) {
  if (!baseline.skillDigests?.[name]) { return false; }
  try { return treeDigest(path.join(home, '.' + harness, 'plugins/cache/dotnet-agent-skills', name, version, 'skills')) === baseline.skillDigests[name]; }
  catch { return false; }
}
const plan = [];
for (const harness of selected ? [selected] : ['codex', 'claude']) {
  const args = harness === 'codex' ? ['plugin', 'list', '--marketplace', 'dotnet-agent-skills', '--json'] : ['plugin', 'list', '--json'];
  const result = run(harness, args);
  if (result.status !== 0) { console.log('[update] WARN status unavailable: ' + harness); continue; }
  const state = JSON.parse(result.stdout);
  const entries = harness === 'codex' ? state.installed : state;
  for (const name of plugins()) {
    const entry = entries.find(item => harness === 'codex' ? item.name === name && item.marketplaceName === 'dotnet-agent-skills' : item.id === name + '@dotnet-agent-skills');
    if (!entry) { console.log('[update] Not installed: ' + harness + '/' + name); continue; }
    if (entry.enabled !== true) { console.log('[update] Preserve disabled plugin: ' + harness + '/' + name); continue; }
    if (entry.version !== versions[name] || !contentMatches(harness, name, entry.version)) {
      plan.push({ harness, name, installed: entry.version, reviewed: versions[name], reason: entry.version === versions[name] ? 'skill content drift' : 'version drift' });
    }
  }
}
console.log(JSON.stringify({ mode: apply ? 'apply' : 'audit', changes: plan }, null, 2));
if (apply && plan.length) {
  const backup = path.join(root, 'backups/plugins-' + new Date().toISOString().replace(/[:.]/g, '-'));
  fs.mkdirSync(backup, { recursive: true });
  fs.writeFileSync(path.join(backup, 'versions-before.json'), JSON.stringify(plan, null, 2) + '\n');
  for (const item of plan) {
    const source = path.join(home, '.' + item.harness, 'plugins/cache/dotnet-agent-skills', item.name, item.installed);
    if (fs.existsSync(source)) {
      fs.cpSync(source, path.join(backup, item.harness, item.name), { recursive: true });
    }
  }
  for (const harness of [...new Set(plan.map(item => item.harness))]) {
    const help = run(harness, ['plugin', harness === 'claude' ? 'update' : 'add', '--help']);
    if (help.status !== 0) { throw new Error('Current plugin help is unavailable: ' + harness); }
    if (harness === 'claude') {
      const refresh = run(harness, ['plugin', 'marketplace', 'update', 'dotnet-agent-skills'], 60000);
      if (refresh.status !== 0) { throw new Error('Marketplace refresh failed.'); }
    } else {
      if (run(harness, ['plugin', 'marketplace', 'upgrade', '--help']).status !== 0) { throw new Error('Marketplace upgrade help is unavailable.'); }
      const refresh = run(harness, ['plugin', 'marketplace', 'upgrade', 'dotnet-agent-skills', '--json'], 60000);
      if (refresh.status !== 0) { throw new Error('Marketplace refresh failed.'); }
    }
  }
  for (const item of plan) {
    const args = item.harness === 'claude'
      ? ['plugin', 'update', item.name + '@dotnet-agent-skills', '--scope', 'user', '--json']
      : ['plugin', 'add', item.name + '@dotnet-agent-skills', '--json'];
    let result = run(item.harness, args, 60000);
    if (result.status === 0 && item.harness === 'claude' && item.reason === 'skill content drift' && !contentMatches(item.harness, item.name, item.reviewed)) {
      // Claude can retain a cached release when upstream changes without a version bump.
      // Reinstall through the native CLI. Preserve plugin data and dependencies.
      for (const verb of ['uninstall', 'install']) {
        if (run('claude', ['plugin', verb, '--help']).status !== 0) { throw new Error('Reinstall help is unavailable.'); }
      }
      console.log('[update] Reinstall same-version content: ' + item.name);
      result = run('claude', ['plugin', 'uninstall', item.name + '@dotnet-agent-skills', '--scope', 'user', '--keep-data', '--json'], 60000);
      if (result.status === 0) {
        result = run('claude', ['plugin', 'install', item.name + '@dotnet-agent-skills', '--scope', 'user', '--json'], 60000);
      }
    }
    // Verify native status. A successful command can still leave an old version.
    const query = item.harness === 'codex' ? ['plugin', 'list', '--marketplace', 'dotnet-agent-skills', '--json'] : ['plugin', 'list', '--json'];
    const check = run(item.harness, query);
    let version;
    try {
      const state = JSON.parse(check.stdout);
      const entries = item.harness === 'codex' ? state.installed : state;
      version = entries.find(entry => item.harness === 'codex' ? entry.name === item.name && entry.marketplaceName === 'dotnet-agent-skills' : entry.id === item.name + '@dotnet-agent-skills')?.version;
    } catch {}
    const verified = result.status === 0 && check.status === 0 && version === item.reviewed && contentMatches(item.harness, item.name, version);
    console.log('[update] ' + (verified ? 'Verified ' : 'WARN version not confirmed: ') + item.harness + '/' + item.name);
    if (!verified) { process.exitCode = 1; }
  }
  console.log('[update] Run doctor and start fresh harness sessions.');
}
