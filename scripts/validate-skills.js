#!/usr/bin/env node
'use strict';

// Check this repository's metadata conventions. This is not a general YAML parser.
const fs = require('fs');
const path = require('path');
const { root } = require('./managed');
const manual = new Set(['ask-matt', 'grill-me', 'grill-with-docs', 'handoff', 'implement', 'improve-codebase-architecture', 'setup-matt-pocock-skills', 'teach', 'to-questionnaire', 'to-spec', 'to-tickets', 'triage', 'wait-what', 'wayfinder']);
const portable = process.argv.includes('--portable');
let count = 0;
let failed = 0;
function fail(message) { failed++; console.error('FAIL ' + message); }
for (const entry of fs.readdirSync(path.join(root, 'skills'), { withFileTypes: true })) {
  if (!entry.isDirectory()) { continue; }
  count++;
  const directory = path.join(root, 'skills', entry.name);
  const source = fs.readFileSync(path.join(directory, 'SKILL.md'), 'utf8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) { fail(entry.name + ': missing frontmatter'); continue; }
  const header = match[1];
  const name = header.match(/^name: (.+)$/m)?.[1];
  const description = header.match(/^description: (.+)$/m)?.[1];
  if (name !== entry.name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name || '') || name.length > 64) { fail(entry.name + ': invalid name'); }
  if (!description || description.length > 1024) { fail(entry.name + ': invalid description'); }
  if (/^version:/m.test(header)) { fail(entry.name + ': version belongs under metadata'); }
  const explicit = /^disable-model-invocation: true$/m.test(header);
  if (explicit !== manual.has(entry.name)) { fail(entry.name + ': invocation policy changed'); }
  if (explicit) {
    const adapter = fs.readFileSync(path.join(directory, 'agents/openai.yaml'), 'utf8');
    if (!/allow_implicit_invocation: false/.test(adapter)) { fail(entry.name + ': missing Codex invocation restriction'); }
  }
  if (portable && /^(disable-model-invocation|argument-hint|allowed-tools|user-invocable):/m.test(header)) {
    fail(entry.name + ': destination must support these extensions. Do not strip invocation restrictions.');
  }
  // Templates inside code fences contain placeholder links and are not live references.
  const prose = source.slice(match[0].length).replace(/```[\s\S]*?```/g, '');
  for (const link of prose.matchAll(/\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    const target = link[1].split('#')[0];
    if (!target || /^(?:[a-z]+:|\/|~)/i.test(target)) { continue; }
    if (!fs.existsSync(path.resolve(directory, decodeURIComponent(target)))) { fail(entry.name + ': broken reference ' + target); }
  }
}
console.log('[skills] ' + count + ' entry files checked, ' + manual.size + ' explicit-only policies retained, ' + failed + ' failures');
process.exitCode = failed ? 1 : 0;
