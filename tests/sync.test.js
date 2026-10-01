'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { samePath } = require('../scripts/managed');

test('isolated sync repairs links, respects COPILOT_HOME, and preserves unrelated files', t => {
  const temporary = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'agentic-sync-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const source = path.resolve(__dirname, '..');
  const root = path.join(temporary, 'central');
  const userHome = path.join(temporary, 'user');
  fs.mkdirSync(root);
  for (const name of ['scripts', 'instructions', 'adapters', 'config']) {
    fs.cpSync(path.join(source, name), path.join(root, name), { recursive: true });
  }
  const skill = path.join(root, 'skills/code-review');
  fs.cpSync(path.join(source, 'skills/code-review'), skill, { recursive: true });
  fs.mkdirSync(path.join(userHome, '.codex'), { recursive: true });
  const unrelated = path.join(userHome, '.codex/AGENTS.md');
  fs.writeFileSync(unrelated, 'unrelated instructions');
  const link = path.join(userHome, '.agents/skills/code-review');
  fs.mkdirSync(path.dirname(link), { recursive: true });
  if (process.platform !== 'win32') { fs.symlinkSync(path.join(root, 'missing'), link); }
  const env = { ...process.env, AGENTIC_DOTNET_HOME: root, AGENTIC_DOTNET_USER_HOME: userHome, COPILOT_HOME: path.join(userHome, 'custom-copilot'), AGENTIC_DOTNET_REPLACE_EXISTING: '0' };
  const powershell = process.platform === 'win32' || process.env.AGENTIC_TEST_PWSH;
  const command = powershell ? (process.env.AGENTIC_TEST_PWSH || 'pwsh') : 'bash';
  const args = powershell ? ['-NoProfile', '-File', path.join(root, 'scripts/sync.ps1')] : [path.join(root, 'scripts/sync.sh')];
  for (let pass = 0; pass < 2; pass++) {
    const result = spawnSync(command, args, { env, encoding: 'utf8', timeout: 30000 });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(samePath(link, skill), true);
    assert.equal(fs.readFileSync(unrelated, 'utf8'), 'unrelated instructions');
    assert.equal(fs.readFileSync(path.join(env.COPILOT_HOME, 'copilot-instructions.md'), 'utf8').includes('# Global coding-agent instructions'), true);
    assert.equal(fs.lstatSync(path.join(userHome, '.cursor/plugins/local/agentic-dotnet')).isSymbolicLink(), false);
  }
});
