#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { root, home, copilotHome, plugins, run, exists, treeDigest } = require('./managed');
const { sources, matches } = require('./cursor-adapter');
const totals = { PASS: 0, WARN: 0, FAIL: 0 };
const timeout = Number(process.env.AGENTIC_DOTNET_CHECK_TIMEOUT_MS || 10000);
if (!Number.isFinite(timeout) || timeout < 100 || timeout > 60000) { throw new Error('Invalid check timeout.'); }

function report(level, message) { totals[level]++; console.log(level.padEnd(5) + ' ' + message); }
function read(file) { try { return fs.readFileSync(file, 'utf8'); } catch { return ''; } }
function equalFile(actual, expected, label) {
  const expectedText = read(expected);
  const actualText = read(actual);
  report(expectedText && actualText.includes(expectedText.trim()) ? 'PASS' : 'FAIL', label + ' (file configuration)');
}
function command(name, args) { return run(name, args, timeout, { env: { ...process.env, OCR_NO_UPDATE: '1' } }); }
function pluginStatus(harness) {
  const args = harness === 'codex' ? ['plugin', 'list', '--marketplace', 'dotnet-agent-skills', '--json'] : ['plugin', 'list', '--json'];
  const result = command(harness, args);
  if (result.status !== 0) {
    report('WARN', harness + ' plugin status unknown: unavailable, failed, or timed out');
    return;
  }
  let entries;
  try {
    const state = JSON.parse(result.stdout);
    entries = harness === 'codex' ? state.installed : state;
    if (!Array.isArray(entries)) { throw new Error('Invalid status shape'); }
  } catch {
    report('WARN', harness + ' plugin status unknown: invalid response');
    return;
  }
  const baseline = JSON.parse(read(path.join(root, 'config/plugin-versions.json')));
  const reviewed = baseline.versions;
  for (const name of plugins()) {
    const entry = entries.find(item => harness === 'codex'
      ? item.name === name && item.marketplaceName === 'dotnet-agent-skills' && item.installed
      : item.id === name + '@dotnet-agent-skills');
    if (!entry || entry.enabled !== true) {
      report('WARN', harness + ' plugin not confirmed enabled: ' + name);
    } else {
      report(entry.version === reviewed[name] ? 'PASS' : 'WARN', harness + ' ' + name + ' ' + entry.version + ' (CLI status)');
      let exact = false;
      try { exact = treeDigest(path.join(home, '.' + harness, 'plugins/cache/dotnet-agent-skills', name, entry.version, 'skills')) === baseline.skillDigests?.[name]; } catch {}
      report(exact ? 'PASS' : 'WARN', harness + ' ' + name + ' reviewed skill content');
    }
  }
  const mcp = command(harness, ['mcp', 'get', 'microsoft-learn']);
  report(mcp.status === 0 && mcp.stdout.includes('https://learn.microsoft.com/api/mcp') ? 'PASS' : 'WARN', harness + ' Microsoft Learn registration (not a connectivity test)');
}

const canonical = path.join(root, 'instructions/global.md');
report(read(canonical) ? 'PASS' : 'FAIL', 'canonical global instructions');
equalFile(path.join(home, '.codex/AGENTS.md'), canonical, 'Codex instruction adapter');
const claude = read(path.join(home, '.claude/CLAUDE.md'));
report(claude.includes('@' + canonical.replace(/\\/g, '/')) ? 'PASS' : 'FAIL', 'Claude import adapter (file configuration)');
equalFile(path.join(copilotHome, 'copilot-instructions.md'), canonical, 'Copilot instruction adapter');
equalFile(path.join(copilotHome, 'mcp-config.json'), path.join(root, 'adapters/copilot/mcp-config.json'), 'Copilot MCP adapter');
equalFile(path.join(home, '.opencodereview/rule.json'), path.join(root, 'adapters/code-review/rule.json'), 'OCR review rules');

let skillCount = 0;
for (const skill of fs.readdirSync(path.join(root, 'skills'), { withFileTypes: true })) {
  if (!skill.isDirectory()) { continue; }
  const source = path.join(root, 'skills', skill.name);
  for (const prefix of ['.agents/skills', '.claude/skills']) {
    const destination = path.join(home, prefix, skill.name);
    try {
      if (fs.realpathSync(source) !== fs.realpathSync(destination)) { throw new Error('Wrong target'); }
    } catch { report('FAIL', 'skill link is missing or incorrect: ' + destination); }
  }
  skillCount++;
}
report('PASS', skillCount + ' canonical skill directories inspected');
for (const prefix of ['.agents/skills', '.claude/skills']) {
  const directory = path.join(home, prefix);
  if (!fs.existsSync(directory)) { continue; }
  for (const entry of fs.readdirSync(directory)) {
    const file = path.join(directory, entry);
    if (fs.lstatSync(file).isSymbolicLink() && !fs.existsSync(file)) { report('WARN', 'broken discovery link: ' + file); }
  }
}
for (const [name, source] of sources()) {
  const destination = path.join(home, '.cursor/plugins/local', name);
  if (!fs.existsSync(source)) { report('WARN', 'Cursor source unavailable: ' + name); continue; }
  const { snapshot } = require('./cursor-adapter');
  const valid = exists(destination) && !fs.lstatSync(destination).isSymbolicLink() && matches(destination, snapshot(source));
  report(valid ? 'PASS' : 'FAIL', 'Cursor deployment ' + name + ' (files only)');
}
report('WARN', 'Doctor does not inspect Cursor runtime. Check Customize after changes.');

const sdk = command('dotnet', ['--list-sdks']);
report(sdk.status === 0 && sdk.stdout.trim() ? 'PASS' : 'WARN', 'installed .NET SDK discovery');
pluginStatus('codex');
pluginStatus('claude');
const copilot = command('copilot', ['skill', 'list', '--json']);
report(copilot.status === 0 ? 'PASS' : 'WARN', 'Copilot skill discovery ' + (copilot.status === 0 ? '(CLI response)' : 'unavailable or unverified'));
const ocr = command('ocr', ['version']);
report(ocr.status === 0 ? 'PASS' : 'WARN', 'OCR executable ' + (ocr.status === 0 ? 'available' : 'unavailable'));
report('WARN', 'OCR model-provider access is not tested. Credentials are not inspected.');

if (fs.existsSync(path.join(home, '.config/kilo'))) {
  equalFile(path.join(home, '.config/kilo/AGENTS.md'), canonical, 'Kilo instruction adapter');
  for (const name of plugins()) {
    report(fs.existsSync(path.join(home, '.cache/agentic-dotnet/dotnet-skills/plugins', name, 'skills')) ? 'PASS' : 'WARN', 'Kilo official skill files: ' + name);
  }
}

const devRoot = process.argv[2] || process.env.AGENTIC_DOTNET_DEV_ROOT;
if (devRoot) {
  const skip = new Set(['.git', '.gitnexus', 'bin', 'obj', 'node_modules', 'packages', 'vendor', '.venv', 'venv', 'worktrees']);
  let found = 0;
  function scan(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink() || skip.has(entry.name)) { continue; }
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) { scan(file); continue; }
      if (/\.instructions\.md$/.test(entry.name) || /[/\\](\.cursor[/\\]rules|\.agents[/\\]skills|\.claude[/\\]skills)[/\\]/.test(file) || file.endsWith('copilot-instructions.md')) {
        report('WARN', 'repository instruction requires review: ' + file); found++;
      } else if (['AGENTS.md', 'CLAUDE.md'].includes(entry.name) && read(file) === read(canonical)) {
        report('WARN', 'copied global instructions: ' + file); found++;
      }
    }
  }
  try { scan(path.resolve(devRoot)); if (!found) { report('PASS', 'no known repository instruction duplicates'); } }
  catch { report('WARN', 'repository scan incomplete'); }
} else { report('WARN', 'repository duplicate scan skipped. Supply a development root.'); }

console.log('\nSummary: ' + totals.PASS + ' pass, ' + totals.WARN + ' warn, ' + totals.FAIL + ' fail');
process.exitCode = totals.FAIL ? 1 : 0;
