#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { root, home, run } = require('./managed');
const target = path.join(home, '.cache/agentic-dotnet/dotnet-skills');
const revision = JSON.parse(fs.readFileSync(path.join(root, 'config/plugin-versions.json'), 'utf8')).reviewedCommit;
if (!/^[a-f0-9]{40}$/.test(revision)) { throw new Error('Invalid reviewed source revision.'); }
function git(args, timeout = 15000) {
  const result = run('git', args, timeout);
  if (result.status !== 0) { throw new Error('Official cache operation failed or timed out.'); }
  return result.stdout.trim();
}
if (!fs.existsSync(target)) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  git(['clone', '--depth', '1', 'https://github.com/dotnet/skills.git', target], 60000);
}
const remote = git(['-C', target, 'remote', 'get-url', 'origin']);
if (remote !== 'https://github.com/dotnet/skills.git') { throw new Error('Preserved cache with an unexpected remote.'); }
if (git(['-C', target, 'status', '--porcelain'])) { throw new Error('Preserved cache with local changes.'); }
if (git(['-C', target, 'rev-parse', 'HEAD']) !== revision) {
  const backup = path.join(root, 'backups/cache-' + new Date().toISOString().replace(/[:.]/g, '-'));
  fs.mkdirSync(backup, { recursive: true });
  git(['-C', target, 'archive', '--format=tar', '--output=' + path.join(backup, 'before.tar'), 'HEAD']);
  git(['-C', target, 'fetch', '--depth', '1', 'origin', revision], 60000);
  git(['-C', target, 'checkout', '--detach', revision]);
}
console.log('[cache] Official source matches reviewed commit ' + revision.slice(0, 8));
