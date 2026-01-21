#!/usr/bin/env node

const fs = require('fs');
const testCode = fs.readFileSync('test-interface.sail', 'utf8');

console.log('Finding the 2-issue gap between parsers...\n');

// All possible checks from hardcoded parser
const allChecks = [
  { name: 'textField missing label', pattern: /a!textField\s*\([^)]*\)/g, check: m => !m.includes('label:') },
  { name: 'paragraphField missing label', pattern: /a!paragraphField\s*\([^)]*\)/g, check: m => !m.includes('label:') },
  { name: 'integerField missing label', pattern: /a!integerField\s*\([^)]*\)/g, check: m => !m.includes('label:') },
  { name: 'decimalField missing label', pattern: /a!decimalField\s*\([^)]*\)/g, check: m => !m.includes('label:') },
  { name: 'dateField missing label', pattern: /a!dateField\s*\([^)]*\)/g, check: m => !m.includes('label:') },
  { name: 'dropdownField missing label', pattern: /a!dropdownField\s*\([^)]*\)/g, check: m => !m.includes('label:') },
  { name: 'checkboxField missing choiceLabels', pattern: /a!checkboxField\s*\([^)]*\)/g, check: m => !m.includes('choiceLabels:') },
  { name: 'radioButtonField missing choiceLabels', pattern: /a!radioButtonField\s*\([^)]*\)/g, check: m => !m.includes('choiceLabels:') },
  { name: 'imageField missing altText', pattern: /a!imageField\s*\([^)]*\)/g, check: m => !m.includes('altText:') },
  { name: 'richTextIcon missing altText', pattern: /a!richTextIcon\s*\([^)]*\)/g, check: m => !m.includes('altText:') },
  { name: 'gridField missing label', pattern: /a!gridField\s*\([^)]*\)/g, check: m => !m.includes('label:') },
  { name: 'progressBarField missing label', pattern: /a!progressBarField\s*\([^)]*\)/g, check: m => !m.includes('label:') },
  { name: 'fileUploadField missing label', pattern: /a!fileUploadField\s*\([^)]*\)/g, check: m => !m.includes('label:') },
  { name: 'sectionLayout missing headingTag', pattern: /a!sectionLayout\s*\([^)]*\)/g, check: m => m.includes('label:') && !m.includes('headingTag:') },
  { name: 'boxLayout missing headingTag', pattern: /a!boxLayout\s*\([^)]*\)/g, check: m => m.includes('label:') && !m.includes('headingTag:') },
  { name: 'dateTimeField (prohibited)', pattern: /a!dateTimeField\s*\(/g, check: () => true },
  { name: 'richTextDisplayField LARGE missing headingTag', pattern: /a!richTextDisplayField\s*\([^)]*value\s*:\s*a!richTextItem\s*\([^)]*size\s*:\s*"LARGE"/g, check: m => !m.includes('headingTag:') },
  { name: 'richTextItem LARGE (standalone)', pattern: /a!richTextItem\s*\([^)]*size:\s*"LARGE"/g, check: () => true },
  { name: 'linkField missing label', pattern: /a!linkField\s*\([^)]*\)/g, check: m => !m.includes('label:') && !m.includes('accessibilityText:') },
  { name: 'buttonWidget missing label', pattern: /a!buttonWidget\s*\([^)]*\)/g, check: m => !m.includes('label:') },
  { name: 'pickerField missing label', pattern: /a!pickerField\s*\([^)]*\)/g, check: m => !m.includes('label:') },
  { name: 'Empty label', pattern: /label:\s*""\s*[,)]/g, check: () => true },
  { name: 'Card link with label', pattern: /a!cardLayout\s*\([^)]*link:[^)]*label:/g, check: () => true },
  { name: 'Collapsible section missing headingTag', pattern: /a!(sectionLayout|boxLayout)\s*\([^)]*isCollapsible\s*:\s*true[^)]*\)/g, check: m => !m.includes('headingTag:') },
];

let total = 0;
allChecks.forEach(check => {
  const matches = [...testCode.matchAll(check.pattern)];
  const issues = matches.filter(m => check.check(m[0]));
  if (issues.length > 0) {
    console.log(`${issues.length}x ${check.name}`);
    total += issues.length;
  }
});

console.log(`\nTotal: ${total} issues`);
