const testCode = `
a!checkboxField(
  choiceLabels: {"Option 1", "Option 2", "Option 3"},
  choiceValues: {1, 2, 3},
  value: local!check2,
  saveInto: local!check2
)
`;

// Test the pattern
const pattern = /a!checkboxField\s*\([^)]*\)/g;
const matches = [...testCode.matchAll(pattern)];

console.log('Found matches:', matches.length);
matches.forEach(match => {
  console.log('Has choiceLabels:', match[0].includes('choiceLabels:'));
  console.log('Has comma:', match[0].includes(','));
  console.log('Has label:', match[0].includes('label:'));
  console.log('Should trigger:', match[0].includes('choiceLabels:') && match[0].includes(',') && !match[0].includes('label:'));
});
