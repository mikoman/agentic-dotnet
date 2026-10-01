#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { exists } = require('./managed');

function releaseFiles(source) {
  const manifest = JSON.parse(fs.readFileSync(path.join(source, 'config/release-files.json'), 'utf8'));
  if (!Array.isArray(manifest) || new Set(manifest).size !== manifest.length) { throw new Error('Invalid release manifest.'); }
  const denied = new Set(['.git', '.gitnexus', 'backups', 'reports', 'dist', 'node_modules', '.DS_Store']);
  for (const name of manifest) {
    if (typeof name !== 'string' || !name || /[\\\r\n\0:]/.test(name) || path.isAbsolute(name)) { throw new Error('Invalid release path.'); }
    const parts = name.split('/');
    if (parts.some(part => !part || part === '.' || part === '..' || denied.has(part) || /^\.env(?:\.|$)/.test(part)) || /\.(pem|pfx|p12|key)$/i.test(name)) {
      throw new Error('Forbidden release path: ' + name);
    }
    let current = source;
    for (const part of parts) {
      current = path.join(current, part);
      if (!exists(current) || fs.lstatSync(current).isSymbolicLink()) { throw new Error('Missing or linked release path: ' + name); }
    }
    if (!fs.statSync(current).isFile()) { throw new Error('Release entry is not a file: ' + name); }
  }
  return manifest;
}

function stage(source, destination) {
  const names = releaseFiles(source);
  fs.mkdirSync(destination, { recursive: true });
  if (fs.readdirSync(destination).length) { throw new Error('Release staging must be empty.'); }
  for (const name of names) {
    const target = path.join(destination, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(source, name), target, fs.constants.COPYFILE_EXCL);
    fs.chmodSync(target, fs.statSync(path.join(source, name)).mode & 0o777);
  }
  return names;
}

function checkTarget(source, destination) {
  const names = releaseFiles(source);
  for (const name of names) {
    let current = path.resolve(destination, name);
    while (true) {
      if (exists(current) && fs.lstatSync(current).isSymbolicLink()) {
        throw new Error('Linked package destination requires manual review: ' + current);
      }
      if (current === path.dirname(current)) { break; }
      current = path.dirname(current);
    }
    const target = path.join(destination, name);
    if (exists(target) && !fs.statSync(target).isFile()) { throw new Error('Package destination is not a file: ' + target); }
  }
}

if (require.main === module) {
  const source = path.resolve(__dirname, '..');
  if (process.argv[2] === '--check-target' && process.argv[3]) {
    checkTarget(source, process.argv[3]);
    console.log('[package] destination is safe');
  } else if (process.argv[2] === '--stage' && process.argv[3]) {
    console.log('[package] staged ' + stage(source, path.resolve(process.argv[3])).length + ' manifest files');
  } else if (process.argv[2] === '--list') {
    console.log(releaseFiles(source).join('\n'));
  } else {
    console.log('[package] validated ' + releaseFiles(source).length + ' manifest files');
  }
}
module.exports = { releaseFiles, stage, checkTarget };
