#!/usr/bin/env node

const fs = require('fs');
const testCode = fs.readFileSync('test-interface.sail', 'utf8');

console.log('='.repeat(80));
console.log('COMPREHENSIVE SCANNER COMPARISON');
console.log('='.repeat(80));
console.log();

// Define all possible checks with unique identifiers
const allChecks = [
  { id: 'textField-label', name: 'textField missing label', pattern: /a!textField\s*\([^)]*\)/g, check: m => !m.includes('label:') },
  { id: 'paragraphField-label', name: 'paragraphField missing label', pattern: /a!paragraphField\s*\([^)]*\)/g, check: m => !m.includes('label:') },
  { id: 'integerField-label', name: 'integerField missing label', pattern: /a!integerField\s*\([^)]*\)/g, check: m => !m.includes('label:') },
  { id: 'decimalField-label', name: 'decimalField missing label', pattern: /a!decimalField\s*\([^)]*\)/g, check: m => !m.includes('label:') },
  { id: 'dateField-label', name: 'dateField missing label', pattern: /a!dateField\s*\([^)]*\)/g, check: m => !m.includes('label:') },
  { id: 'dropdownField-label', name: 'dropdownField missing label', pattern: /a!dropdownField\s*\([^)]*\)/g, check: m => !m.includes('label:') },
  { id: 'checkboxField-choiceLabels', name: 'checkboxField missing choiceLabels', pattern: /a!checkboxField\s*\([^)]*\)/g, check: m => !m.includes('choiceLabels:') },
  { id: 'radioButtonField-choiceLabels', name: 'radioButtonField missing choiceLabels', pattern: /a!radioButtonField\s*\([^)]*\)/g, check: m => !m.includes('choiceLabels:') },
  { id: 'checkboxField-groupLabel', name: 'checkboxField group missing label', pattern: /a!checkboxField\s*\([^)]*\)/g, check: m => m.includes('choiceLabels:') && m.includes(',') && !m.includes('label:') },
  { id: 'radioButtonField-groupLabel', name: 'radioButtonField group missing label', pattern: /a!radioButtonField\s*\([^)]*\)/g, check: m => m.includes('choiceLabels:') && m.includes(',') && !m.includes('label:') },
  { id: 'imageField-altText', name: 'imageField missing altText', pattern: /a!imageField\s*\([^)]*\)/g, check: m => !m.includes('altText:') },
  { id: 'richTextIcon-altText', name: 'richTextIcon missing altText', pattern: /a!richTextIcon\s*\([^)]*\)/g, check: m => !m.includes('altText:') },
  { id: 'gridField-label', name: 'gridField missing label', pattern: /a!gridField\s*\([^)]*\)/g, check: m => !m.includes('label:') },
  { id: 'gridField-columnHeaders', name: 'grid columns missing headers', pattern: /a!gridField\s*\([^)]*columns\s*:\s*\{[^}]*\}/g, check: m => { const col = m.match(/columns\s*:\s*\{([^}]*)\}/); return col && !col[1].includes('label:'); } },
  { id: 'progressBarField-label', name: 'progressBarField missing label', pattern: /a!progressBarField\s*\([^)]*\)/g, check: m => !m.includes('label:') },
  { id: 'fileUploadField-label', name: 'fileUploadField missing label', pattern: /a!fileUploadField\s*\([^)]*\)/g, check: m => !m.includes('label:') },
  { id: 'sectionLayout-headingTag', name: 'sectionLayout missing headingTag', pattern: /a!sectionLayout\s*\([^)]*\)/g, check: m => m.includes('label:') && !m.includes('headingTag:') },
  { id: 'boxLayout-headingTag', name: 'boxLayout missing headingTag', pattern: /a!boxLayout\s*\([^)]*\)/g, check: m => m.includes('label:') && !m.includes('headingTag:') },
  { id: 'dateTimeField-prohibited', name: 'dateTimeField (prohibited)', pattern: /a!dateTimeField\s*\(/g, check: () => true },
  { id: 'richTextDisplayField-heading', name: 'richTextDisplayField LARGE missing headingTag', pattern: /a!richTextDisplayField\s*\([^)]*value\s*:\s*a!richTextItem\s*\([^)]*size\s*:\s*"LARGE"/g, check: m => !m.includes('headingTag:') },
  { id: 'richTextItem-heading', name: 'richTextItem LARGE (standalone)', pattern: /a!richTextItem\s*\([^)]*size:\s*"LARGE"/g, check: () => true },
  { id: 'collapsibleSection-headingTag', name: 'collapsible section missing headingTag', pattern: /a!(sectionLayout|boxLayout)\s*\([^)]*isCollapsible\s*:\s*true[^)]*\)/g, check: m => !m.includes('headingTag:') },
  { id: 'linkField-label', name: 'linkField missing label', pattern: /a!linkField\s*\([^)]*\)/g, check: m => !m.includes('label:') && !m.includes('accessibilityText:') },
  { id: 'buttonWidget-label', name: 'buttonWidget missing label', pattern: /a!buttonWidget\s*\([^)]*\)/g, check: m => !m.includes('label:') },
  { id: 'pickerField-label', name: 'pickerField missing label', pattern: /a!pickerField\s*\([^)]*\)/g, check: m => !m.includes('label:') },
  { id: 'emptyLabel', name: 'empty label', pattern: /label:\s*""\s*[,)]/g, check: () => true },
  { id: 'cardLink-label', name: 'card link with label', pattern: /a!cardLayout\s*\([^)]*link:[^)]*label:/g, check: () => true },
];

// Run all checks and collect results
const results = new Map();
let totalIssues = 0;

allChecks.forEach(check => {
  const matches = [...testCode.matchAll(check.pattern)];
  const issues = matches.filter(m => check.check(m[0]));
  
  if (issues.length > 0) {
    results.set(check.id, {
      name: check.name,
      count: issues.length,
      lines: issues.map(m => testCode.substring(0, m.index).split('\n').length)
    });
    totalIssues += issues.length;
  }
});

console.log('UNIQUE ISSUES FOUND IN TEST FILE:');
console.log('-'.repeat(80));

results.forEach((result, id) => {
  console.log(`${result.count}x ${result.name} (lines: ${result.lines.join(', ')})`);
});

console.log();
console.log('='.repeat(80));
console.log(`TOTAL UNIQUE ISSUES: ${totalIssues}`);
console.log('='.repeat(80));
console.log();

// Check for potential duplicates by line number
console.log('CHECKING FOR DUPLICATE DETECTIONS:');
console.log('-'.repeat(80));

const lineMap = new Map();
results.forEach((result, id) => {
  result.lines.forEach(line => {
    if (!lineMap.has(line)) {
      lineMap.set(line, []);
    }
    lineMap.get(line).push(result.name);
  });
});

let hasDuplicates = false;
lineMap.forEach((checks, line) => {
  if (checks.length > 1) {
    console.log(`⚠️  Line ${line}: ${checks.length} checks`);
    checks.forEach(check => console.log(`   - ${check}`));
    hasDuplicates = true;
  }
});

if (!hasDuplicates) {
  console.log('✅ No duplicate detections found - each issue is unique');
}

console.log();
console.log('='.repeat(80));
console.log('EXPECTED SCANNER RESULTS:');
console.log('='.repeat(80));
console.log(`Both scanners should find: ${totalIssues} issues`);
console.log('If either scanner finds more, it has duplicate rule matching');
console.log('If either scanner finds less, it\'s missing a check');
console.log();
