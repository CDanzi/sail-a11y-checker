// Simulate Aurora rule matching
const testRules = [
  { category: 'form inputs', criteria: 'file upload field must have label', sailTest: 'check label parameter' },
  { category: 'form inputs', criteria: 'dateTimeField must not be used', sailTest: 'check for datetimefield' },
  { category: 'images', criteria: 'images must have altText', sailTest: 'check altText parameter' }
];

testRules.forEach(rule => {
  const { category, criteria, sailTest } = rule;
  
  console.log(`\nRule: ${criteria}`);
  console.log(`  Category: ${category}`);
  
  // File upload check
  if (category === 'form inputs' && criteria.includes('file upload')) {
    console.log('  ✓ Matches file upload check');
  }
  
  // Prohibited component check
  if (criteria.includes('datetimefield') && criteria.includes('must not')) {
    console.log('  ✓ Matches prohibited component check');
  }
  
  // Image check
  if ((category === 'images' || category === 'icons') && criteria.includes('alt')) {
    console.log('  ✓ Matches image/icon check');
  }
});
