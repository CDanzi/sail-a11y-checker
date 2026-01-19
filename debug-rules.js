// Run this in the browser console on https://appian-design.github.io/aurora/accessibility/checklist/
// to see the actual table structure

const rows = document.querySelectorAll('tbody tr');
console.log('Total rows found:', rows.length);

if (rows.length > 0) {
  const firstRow = rows[0];
  const cells = firstRow.querySelectorAll('td');
  console.log('Cells in first row:', cells.length);
  
  cells.forEach((cell, index) => {
    console.log(`Cell ${index}:`, cell.textContent.substring(0, 100));
  });
  
  // Check for SAIL Testing text
  const howToTest = cells[2]?.textContent || '';
  console.log('\nFull "How To Test" content (first 500 chars):', howToTest.substring(0, 500));
  console.log('\nContains "SAIL Testing"?', howToTest.includes('SAIL Testing'));
  console.log('Contains **SAIL Testing**?', howToTest.includes('**SAIL Testing**'));
}
