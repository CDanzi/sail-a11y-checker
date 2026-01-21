#!/usr/bin/env node

// Compare what each parser finds
const fs = require('fs');
const testCode = fs.readFileSync('test-interface.sail', 'utf8');

console.log('='.repeat(70));
console.log('DETAILED COMPARISON: Aurora Parser vs Hardcoded Parser');
console.log('='.repeat(70));
console.log();

// Rules that hardcoded parser checks but Aurora might miss
const hardcodedOnlyRules = [
  {
    name: 'Text Should Use Semantic Heading (richTextItem with LARGE size)',
    pattern: /a!richTextItem\s*\([^)]*size:\s*"LARGE"[^)]*\)/g,
    check: (m) => !m.includes('headingTag')
  },
  {
    name: 'Card Link Should Not Have Label',
    pattern: /a!cardLayout\s*\([^)]*link:[^)]*label:/g,
    check: () => true
  },
  {
    name: 'Empty Label (label: "")',
    pattern: /label:\s*""\s*[,)]/g,
    check: () => true
  },
  {
    name: 'richTextDisplayField with LARGE (not just richTextItem)',
    pattern: /a!richTextDisplayField\s*\([^)]*value\s*:\s*a!richTextItem\s*\([^)]*size\s*:\s*"LARGE"/g,
    check: (m) => !m.includes('headingTag')
  }
];

console.log('Checking for rules that might be missing from Aurora parser:');
console.log('-'.repeat(70));

let totalMissing = 0;

hardcodedOnlyRules.forEach(rule => {
  const matches = [...testCode.matchAll(rule.pattern)];
  const issues = matches.filter(m => rule.check(m[0]));
  
  if (issues.length > 0) {
    console.log(`✗ ${rule.name}: ${issues.length} issue(s)`);
    totalMissing += issues.length;
    // Show first match as example
    if (issues[0]) {
      console.log(`  Example: ${issues[0][0].substring(0, 60)}...`);
    }
  } else {
    console.log(`✓ ${rule.name}: 0 issues`);
  }
});

console.log();
console.log('='.repeat(70));
console.log(`POTENTIAL GAP: ${totalMissing} issues`);
console.log('='.repeat(70));
console.log();

if (totalMissing > 0) {
  console.log('These rules may need to be added to Aurora parser:');
  hardcodedOnlyRules.forEach((rule, i) => {
    const matches = [...testCode.matchAll(rule.pattern)];
    const issues = matches.filter(m => rule.check(m[0]));
    if (issues.length > 0) {
      console.log(`  ${i + 1}. ${rule.name}`);
    }
  });
}

console.log();
console.log('Expected difference: 24 (hardcoded) - 19 (Aurora) = 5 issues');
console.log(`Actual gap found: ${totalMissing} issues`);
console.log();
