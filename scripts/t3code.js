#!/usr/bin/env node
'use strict';

// T3 Code is a desktop host. It has no instruction, skill, or MCP settings of its own.
// It starts provider agents (Claude Code, Codex, OpenCode, and others). Those agents read
// their own user configuration, which this package already prepares.
//
// This module reports which providers T3 Code runs. It reads only whitelisted, non-secret
// fields of settings.json and of the provider caches. It never opens the secrets or clerk
// directories. It never copies a settings value into its output.
//
// Command line use prints install-flow status lines. Exit code 0: T3 Code found.
// Exit code 3: not found. Exit code 4: the app exists but never started.

const fs = require('fs');
const path = require('path');
const { home } = require('./managed');

const ADAPTERS = {
  claudeAgent: 'Claude Code',
  codex: 'Codex',
  opencode: 'OpenCode',
  cursor: 'Cursor',
};

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function t3Home() {
  return process.env.T3CODE_HOME ? path.resolve(process.env.T3CODE_HOME) : path.join(home, '.t3');
}

function isDirectory(directory) {
  try { return fs.statSync(directory).isDirectory(); } catch { return false; }
}

function readText(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return ''; }
}

function readJson(file) {
  try { return JSON.parse(readText(file)); } catch { return null; }
}

function appInstalled() {
  if (process.platform !== 'darwin') { return false; }
  try { return fs.readdirSync('/Applications').some(name => /^T3 Code.*\.app$/.test(name)); } catch { return false; }
}

function skillNames(cache) {
  if (!Array.isArray(cache.skills)) { return []; }
  return cache.skills
    .map(skill => (isPlainObject(skill) && typeof skill.name === 'string' ? skill.name : null))
    .filter(Boolean);
}

function inspect(directory = t3Home()) {
  if (!isDirectory(directory)) { return null; }
  const userdata = path.join(directory, 'userdata');
  const version = readText(path.join(userdata, 'desktop-last-started-version')).trim();
  const providers = new Map();

  const caches = path.join(directory, 'caches');
  let names = [];
  try { names = fs.readdirSync(caches).filter(name => name.endsWith('.json')).sort(); } catch { names = []; }
  for (const name of names) {
    const cache = readJson(path.join(caches, name));
    if (!isPlainObject(cache) || typeof cache.driver !== 'string') { continue; }
    const instance = typeof cache.instanceId === 'string' ? cache.instanceId : cache.driver;
    providers.set(instance, {
      instance,
      driver: cache.driver,
      enabled: cache.enabled === true,
      installed: cache.installed === true,
      skills: skillNames(cache),
      customHome: false,
    });
  }

  const settings = readJson(path.join(userdata, 'settings.json'));
  const instances = isPlainObject(settings) && isPlainObject(settings.providerInstances) ? settings.providerInstances : {};
  for (const [instance, entry] of Object.entries(instances)) {
    if (!isPlainObject(entry) || typeof entry.driver !== 'string') { continue; }
    const provider = providers.get(instance) || {
      instance,
      driver: entry.driver,
      enabled: false,
      installed: false,
      skills: [],
      customHome: false,
    };
    if (typeof entry.enabled === 'boolean') { provider.enabled = entry.enabled; }
    const config = isPlainObject(entry.config) ? entry.config : {};
    provider.customHome = typeof config.homePath === 'string' && config.homePath.trim() !== '';
    providers.set(instance, provider);
  }

  return {
    directory,
    version: /^[0-9A-Za-z.+-]{1,32}$/.test(version) ? version : null,
    providers: [...providers.values()].sort((left, right) => left.instance.localeCompare(right.instance)),
  };
}

function findings(info, options) {
  const out = [];
  if (!info) { return out; }
  out.push(['PASS', 'T3 Code ' + (info.version || '(unknown version)') + ' found. It is a host that starts provider agents.']);
  for (const provider of info.providers) {
    if (!provider.enabled || !provider.installed) { continue; }
    const label = 'T3 provider ' + provider.instance;
    if (provider.driver === 'claudeAgent' || provider.driver === 'codex') {
      if (provider.customHome) {
        out.push(['WARN', label + ' uses a custom home path. This package configures the default home only.']);
      } else if (provider.skills.length === 0) {
        out.push(['WARN', label + ' has an empty skill cache. Open T3 Code to refresh it. Run doctor again.']);
      } else {
        const missing = options.requiredSkills.filter(name => !provider.skills.includes(name));
        out.push(missing.length === 0
          ? ['PASS', label + ' skill cache lists the shared skills (T3 cache, not a live session)']
          : ['WARN', label + ' skill cache lacks ' + missing.join(', ') + '. Run sync. Refresh T3 Code.']);
      }
    } else if (provider.driver === 'opencode') {
      if (!options.opencodeConfigured) {
        out.push(['WARN', label + ' is enabled, but ' + options.opencodeDirectory + ' does not exist. This package configured nothing for it.']);
      } else if (provider.skills.length === 0) {
        out.push(['WARN', label + ' shows no skills in T3 Code. OpenCode loads them itself. Doctor checks the OpenCode files.']);
      }
    } else if (provider.driver !== 'cursor') {
      out.push(['WARN', label + ' (' + provider.driver + ') is enabled. This package has no adapter for it.']);
    }
  }
  return out;
}

function summary() {
  const info = inspect();
  if (!info) { return appInstalled() ? 4 : 3; }
  console.log('[install] T3 Code ' + (info.version || '(unknown version)') + ' found. It starts provider agents and uses their configuration.');
  for (const provider of info.providers) {
    if (!provider.enabled || !provider.installed) { continue; }
    const adapter = ADAPTERS[provider.driver];
    console.log('[install] T3 provider ' + provider.instance + ': ' + (adapter ? 'configured through the ' + adapter + ' adapter.' : 'no adapter in this package.'));
  }
  return 0;
}

if (require.main === module) {
  process.exitCode = summary();
}

module.exports = { t3Home, inspect, findings, appInstalled };
