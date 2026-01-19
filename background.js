// Fetch and parse Aurora accessibility checklist using regex (DOMParser not available in service workers)
async function fetchAuroraRules() {
  try {
    const response = await fetch('https://appian-design.github.io/aurora/accessibility/checklist/');
    const html = await response.text();
    
    const rules = [];
    
    // Extract table rows using regex
    const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
    if (!tbodyMatch) {
      console.error('Could not find tbody in HTML');
      return [];
    }
    
    const tbody = tbodyMatch[1];
    const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
    const rows = [...tbody.matchAll(rowRegex)];
    
    rows.forEach(rowMatch => {
      const rowHtml = rowMatch[1];
      const cellRegex = /<td>([\s\S]*?)<\/td>/g;
      const cells = [...rowHtml.matchAll(cellRegex)];
      
      if (cells.length >= 3) {
        const category = cells[0][1].replace(/<[^>]*>/g, '').trim();
        const criteria = cells[1][1].replace(/<[^>]*>/g, '').trim();
        const howToTest = cells[2][1].replace(/<[^>]*>/g, '').trim();
        
        // Extract SAIL Testing instructions
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

// Handle manual refresh requests from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'refreshRules') {
    updateRules().then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }
});