// Fetch and parse Aurora accessibility checklist
async function fetchAuroraRules() {
  try {
    const response = await fetch('https://appian-design.github.io/aurora/accessibility/checklist/');
    const html = await response.text();
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const rules = [];
    // Find all tables and get the one with "Success Criteria" header
    const tables = doc.querySelectorAll('table');
    let checklistTable = null;
    
    for (const table of tables) {
      const headers = table.querySelectorAll('th');
      for (const header of headers) {
        if (header.textContent.includes('Success Criteria')) {
          checklistTable = table;
          break;
        }
      }
      if (checklistTable) break;
    }
    
    if (!checklistTable) {
      console.error('Could not find accessibility checklist table');
      return [];
    }
    
    const rows = checklistTable.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 3) {
        const category = cells[0].textContent.trim();
        const criteria = cells[1].textContent.trim();
        const howToTest = cells[2].textContent.trim();
        
        // Extract SAIL Testing instructions (looks for "SAIL Testing:" in any format)
        const sailMatch = howToTest.match(/SAIL Testing[:\s]+(.+?)(?=Screen Reader Testing|Tool Testing|Visual|Keyboard Testing|Manual DOM|$)/si);
        if (sailMatch && category && criteria) {
          rules.push({
            category,
            criteria,
            sailTest: sailMatch[1].trim()
          });
        }
      }
    });
    
    return rules;
  } catch (error) {
    console.error('Failed to fetch Aurora rules:', error);
    return [];
  }
}

// Store rules in chrome.storage
async function updateRules() {
  const rules = await fetchAuroraRules();
  if (rules.length > 0) {
    chrome.storage.local.set({ auroraRules: rules, lastUpdated: Date.now() });
    console.log(`Stored ${rules.length} rules from Aurora checklist`);
  }
}

// Run on install/update
chrome.runtime.onInstalled.addListener(() => {
  updateRules();
});

// Refresh rules daily
chrome.alarms.create('updateRules', { periodInMinutes: 1440 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateRules') {
    updateRules();
  }
});
