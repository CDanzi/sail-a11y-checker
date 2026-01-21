#!/usr/bin/env node

// Test script to compare Aurora parser vs hardcoded checks
const fs = require('fs');

// Read test interface
const testCode = fs.readFileSync('test-interface.sail', 'utf8');

// Mock Aurora rules (simplified for testing)
const mockAuroraRules = [
  {
    category: 'Form Inputs',
    criteria: 'Every input must have a label',
    sailTest: 'Inspect the label parameter for a value, it must not be null.'
  },
  {
    category: 'Form Inputs',
    criteria: 'Checkbox and radio fields must have choice labels',
    sailTest: 'Inspect the choiceLabels parameter'
  },
  {
    category: 'Form Inputs',
    criteria: 'Multiple choice fields need group labels',
    sailTest: 'Check if group label is provided when multiple choices'
  },
  {
    category: 'Images',
    criteria: 'Images must have alt text',
    sailTest: 'Inspect the altText parameter'
  },
  {
    category: 'Icons',
    criteria: 'Icons must have alt text',
    sailTest: 'Inspect the altText parameter'
  },
  {
    category: 'Grids',
    criteria: 'Grids should have labels',
    sailTest: 'Inspect the label parameter on grid'
  },
  {
    category: 'Grids',
    criteria: 'Grid columns should have headers',
    sailTest: 'Inspect column label parameters'
  },
  {
    category: 'Headings',
    criteria: 'Large text should use heading tags',
    sailTest: 'Check for headingTag parameter on large text'
  },
  {
    category: 'Sections',
    criteria: 'Section layouts should use heading tags',
    sailTest: 'Check for headingTag on sections with labels'
  },
  {
    category: 'Progress',
    criteria: 'Progress bars need labels',
    sailTest: 'Inspect label parameter on progress bar'
  },
  {
    category: 'File Upload',
    criteria: 'File uploads need labels',
    sailTest: 'Inspect label parameter on file upload'
  },
  {
    category: 'Cards',
    criteria: 'Selected cards need accessibility text',
    sailTest: 'Check accessibilityText when card has conditional styling'
  },
  {
    category: 'Prohibited',
    criteria: 'dateTimeField must not be used',
    sailTest: 'Component must not be present'
  }
];

// Load the Aurora parser from content.js
const contentJs = fs.readFileSync('content.js', 'utf8');

// Extract AuroraRuleParser class
const parserMatch = contentJs.match(/class AuroraRuleParser \{[\s\S]*?\n\}\n\n\/\/ Listen/);
if (!parserMatch) {
  console.error('Could not find AuroraRuleParser class');
  process.exit(1);
}

// Create parser class
eval(parserMatch[0].replace('// Listen', ''));

// Test Aurora parser
console.log('='.repeat(60));
console.log('TESTING EXPANDED AURORA PARSER');
console.log('='.repeat(60));

const parser = new AuroraRuleParser(mockAuroraRules);
const auroraIssues = parser.generateChecks(testCode);

console.log(`\n✅ Aurora Parser found ${auroraIssues.length} issues:\n`);

// Group by rule type
const auroraByRule = {};
auroraIssues.forEach(issue => {
  const ruleName = issue.rule;
  if (!auroraByRule[ruleName]) auroraByRule[ruleName] = 0;
  auroraByRule[ruleName]++;
});

Object.entries(auroraByRule).sort((a, b) => b[1] - a[1]).forEach(([rule, count]) => {
  console.log(`  ${count}x ${rule}`);
});

// Now test hardcoded version (switch to main branch)
console.log('\n' + '='.repeat(60));
console.log('TESTING HARDCODED PARSER (MAIN BRANCH)');
console.log('='.repeat(60));
console.log('\nSwitching to main branch to test hardcoded parser...\n');

const { execSync } = require('child_process');
try {
  execSync('git stash', { stdio: 'ignore' });
  execSync('git checkout main', { stdio: 'ignore' });
  
  // Load hardcoded version
  const mainContentJs = fs.readFileSync('content.js', 'utf8');
  
  // Extract and run hardcoded checks
  const hardcodedMatch = mainContentJs.match(/function runHardcodedChecks[\s\S]*?return issues;\n\}/);
  
  if (hardcodedMatch) {
    // Create a test environment
    const testEnv = `
      ${hardcodedMatch[0]}
      const lines = testCode.split('\\n');
      const hardcodedIssues = runHardcodedChecks(testCode, lines);
      hardcodedIssues;
    `;
    
    const hardcodedIssues = eval(testEnv);
    
    console.log(`✅ Hardcoded Parser found ${hardcodedIssues.length} issues:\n`);
    
    const hardcodedByRule = {};
    hardcodedIssues.forEach(issue => {
      const ruleName = issue.rule;
      if (!hardcodedByRule[ruleName]) hardcodedByRule[ruleName] = 0;
      hardcodedByRule[ruleName]++;
    });
    
    Object.entries(hardcodedByRule).sort((a, b) => b[1] - a[1]).forEach(([rule, count]) => {
      console.log(`  ${count}x ${rule}`);
    });
    
    // Comparison
    console.log('\n' + '='.repeat(60));
    console.log('COMPARISON');
    console.log('='.repeat(60));
    console.log(`\nAurora Parser:    ${auroraIssues.length} issues`);
    console.log(`Hardcoded Parser: ${hardcodedIssues.length} issues`);
    console.log(`Difference:       ${hardcodedIssues.length - auroraIssues.length} issues`);
    
    const coverage = ((auroraIssues.length / hardcodedIssues.length) * 100).toFixed(1);
    console.log(`Coverage:         ${coverage}%`);
    
  } else {
    console.log('❌ Could not find hardcoded checks in main branch');
  }
  
} catch (error) {
  console.error('Error testing hardcoded version:', error.message);
} finally {
  // Switch back
  execSync('git checkout feature/expanded-aurora-parser', { stdio: 'ignore' });
  try {
    execSync('git stash pop', { stdio: 'ignore' });
  } catch (e) {
    // No stash to pop
  }
}
