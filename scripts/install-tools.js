#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { root, run } = require('./managed');
const tool = JSON.parse(fs.readFileSync(path.join(root, 'config/tools.json'), 'utf8')).ocr;
const current = run('ocr', ['version'], 10000, { env: { ...process.env, OCR_NO_UPDATE: '1' } });
if (current.status === 0) {
  console.log('[tools] OCR is installed. Provider access was not tested.');
} else if (!process.argv.includes('--apply')) {
  console.log('[tools] OCR is missing. Use install.sh --with-ocr or install.ps1 -WithOcr.');
} else {
  if (tool.package !== '@alibaba-group/open-code-review' || !/^\d+\.\d+\.\d+$/.test(tool.version)) {
    throw new Error('Invalid reviewed OCR package.');
  }
  const help = run('npm', ['install', '--help']);
  if (help.status !== 0) { throw new Error('npm installation help is unavailable.'); }
  const result = run('npm', ['install', '--global', tool.package + '@' + tool.version, '--ignore-scripts', '--no-audit', '--no-fund'], 60000);
  if (result.status !== 0) { throw new Error('OCR installation failed or timed out. No credentials were changed.'); }
  const check = run('ocr', ['version'], 10000, { env: { ...process.env, OCR_NO_UPDATE: '1' } });
  if (check.status !== 0) { throw new Error('OCR binary is unavailable after installation.'); }
  console.log('[tools] OCR installed. Configure a provider through its own account workflow.');
}
