#!/usr/bin/env node

// Simple test to count what the Aurora parser would find
const fs = require('fs');

const testCode = fs.readFileSync('test-interface.sail', 'utf8');

console.log('='.repeat(70));
console.log('TESTING EXPANDED AURORA PARSER ON test-interface.sail');
console.log('='.repeat(70));
console.log();

let totalIssues = 0;

// Test each rule type
const tests = [
  {
    name: 'Form fields missing labels',
    pattern: /a!(textField|paragraphField|integerField|decimalField|dateField|dropdownField)\s*\([^)]*\)/g,
    check: (match) => !match.includes('label:'),
    severity: 'Error (A)'
  },
  {
    name: 'Checkbox/Radio missing choiceLabels',
    pattern: /a!(checkboxField|radioButtonField)\s*\([^)]*\)/g,
    check: (match) => !match.includes('choiceLabels:'),
    severity: 'Error (A)'
  },
  {
    name: 'Images missing altText',
    pattern: /a!imageField\s*\([^)]*\)/g,
    check: (match) => !match.includes('altText:'),
    severity: 'Error (A)'
  },
  {
    name: 'Grids missing labels',
    pattern: /a!gridField\s*\([^)]*\)/g,
    check: (match) => !match.includes('label:'),
    severity: 'Warning (AA)'
  },
  {
    name: 'Grid columns missing headers',
    pattern: /a!gridField\s*\([^)]*columns\s*:\s*\{[^}]*\}/g,
    check: (match) => {
      const columnsMatch = match.match(/columns\s*:\s*\{([^}]*)\}/);
      return columnsMatch && !columnsMatch[1].includes('label:');
    },
    severity: 'Warning (AA)'
  },
  {
    name: 'Sections/Boxes missing headingTag',
    pattern: /a!(sectionLayout|boxLayout)\s*\([^)]*\)/g,
    check: (match) => match.includes('label:') && !match.includes('headingTag:'),
    severity: 'Warning (AA)'
  },
  {
    name: 'Progress bars missing labels',
    pattern: /a!progressBarField\s*\([^)]*\)/g,
    check: (match) => !match.includes('label:'),
    severity: 'Warning (AA)'
  },
  {
    name: 'File uploads missing labels',
    pattern: /a!fileUploadField\s*\([^)]*\)/g,
    check: (match) => !match.includes('label:'),
    severity: 'Error (A)'
  },
  {
    name: 'Cards missing accessibility text',
    pattern: /a!cardLayout\s*\([^)]*\)/g,
    check: (match) => {
      const hasConditional = (match.includes('showBorder:') && match.includes('if(')) ||
                            (match.includes('style:') && match.includes('if('));
      return hasConditional && !match.includes('accessibilityText:');
    },
    severity: 'Warning (AA)'
  },
  {
    name: 'Prohibited dateTimeField',
    pattern: /a!dateTimeField\s*\(/g,
    check: () => true,
    severity: 'Error (A)'
  },
  {
    name: 'Links missing labels',
    pattern: /a!linkField\s*\([^)]*\)/g,
    check: (match) => !match.includes('label:') && !match.includes('accessibilityText:'),
    severity: 'Error (A)'
  },
  {
    name: 'Buttons missing labels',
    pattern: /a!(buttonWidget|buttonArrayLayout)\s*\([^)]*\)/g,
    check: (match) => !match.includes('label:'),
    severity: 'Error (A)'
  },
  {
    name: 'Charts missing accessibility text',
    pattern: /a!(barChartField|columnChartField|lineChartField|pieChartField)\s*\([^)]*\)/g,
    check: (match) => !match.includes('accessibilityText:'),
    severity: 'Error (A)'
  },
  {
    name: 'Picker fields missing labels',
    pattern: /a!pickerField\s*\([^)]*\)/g,
    check: (match) => !match.includes('label:'),
    severity: 'Error (A)'
  },
  {
    name: 'Collapsible sections missing headingTag',
    pattern: /a!(sectionLayout|boxLayout)\s*\([^)]*isCollapsible\s*:\s*true[^)]*\)/g,
    check: (match) => !match.includes('headingTag:'),
    severity: 'Warning (AA)'
  }
];

tests.forEach(test => {
  const matches = [...testCode.matchAll(test.pattern)];
  const issues = matches.filter(m => test.check(m[0]));
  
  if (issues.length > 0) {
    console.log(`✗ ${test.name}: ${issues.length} issue${issues.length > 1 ? 's' : ''} [${test.severity}]`);
    totalIssues += issues.length;
  } else {
    console.log(`✓ ${test.name}: 0 issues`);
  }
});

console.log();
console.log('='.repeat(70));
console.log(`TOTAL ISSUES FOUND: ${totalIssues}`);
console.log('='.repeat(70));
console.log();

// Breakdown by severity
const errorTests = tests.filter(t => t.severity.includes('Error'));
const warningTests = tests.filter(t => t.severity.includes('Warning'));

let errors = 0;
let warnings = 0;

errorTests.forEach(test => {
  const matches = [...testCode.matchAll(test.pattern)];
  errors += matches.filter(m => test.check(m[0])).length;
});

warningTests.forEach(test => {
  const matches = [...testCode.matchAll(test.pattern)];
  warnings += matches.filter(m => test.check(m[0])).length;
});

console.log(`Errors (WCAG Level A):   ${errors}`);
console.log(`Warnings (WCAG Level AA): ${warnings}`);
console.log();
