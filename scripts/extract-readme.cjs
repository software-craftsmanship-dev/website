#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const rootReadme = path.resolve(__dirname, '..', 'README.md');
const outFile = path.resolve(__dirname, '..', 'src', 'data', 'readmeSections.json');

function extractSections(md) {
  // Split by H2 headings (## ) while keeping them.
  const lines = md.split(/\r?\n/);
  let current = null;
  const sections = {};

  for (const line of lines) {
    const h2 = /^##\s+(.*)/.exec(line);
    if (h2) {
      current = h2[1].trim().toLowerCase();
      sections[current] = [];
      continue;
    }
    if (!current) continue;
    sections[current].push(line);
  }

  // Join and trim each
  Object.keys(sections).forEach(key => {
    const raw = sections[key].join('\n').trim();
    sections[key] = {
      markdown: raw
    };
  });
  return sections;
}

function run() {
  if (!fs.existsSync(rootReadme)) {
    console.error('README.md not found at', rootReadme);
    process.exit(1);
  }
  const md = fs.readFileSync(rootReadme, 'utf8');
  const sections = extractSections(md);
  fs.mkdirSync(path.dirname(outFile), {recursive: true});
  fs.writeFileSync(outFile, JSON.stringify(sections, null, 2), 'utf8');
  console.log('Extracted sections:', Object.keys(sections));
}

run();
