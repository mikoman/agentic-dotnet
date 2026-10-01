#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { root } = require('./managed');
const policy = fs.readFileSync(path.join(root, 'skills/code-review/references/review-policy.md'), 'utf8');
const target = path.join(root, 'adapters/code-review/rule.json');
const text = JSON.stringify({ rules: [{ path: '**/*', rule: policy, merge_system_rule: true }] }, null, 2) + '\n';
fs.mkdirSync(path.dirname(target), { recursive: true });
if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== text) { fs.writeFileSync(target, text); }
