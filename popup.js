// Track the results window
let resultsWindowId = null;

async function ensureContentScript(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    return true;
  } catch (error) {
    console.log('Content script not loaded, injecting...');
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
      await new Promise(resolve => setTimeout(resolve, 100));
      return true;
    } catch (injectionError) {
      console.error('Failed to inject content script:', injectionError);
      return false;
    }
  }
}

async function runScan() {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '<div class="loading"><img src="icons/loading.gif" alt="Loading" style="width: 24px; height: 24px; margin-right: 8px;"><span>Scanning SAIL code...</span></div>';
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url.includes('appian')) {
    resultsDiv.innerHTML = `
      <p class="error">
        ⚠️ This doesn't appear to be an Appian page.<br>
        <small>Current URL: ${tab.url.substring(0, 80)}...</small><br><br>
        Please navigate to an Appian Interface Designer page.
      </p>
    `;
    return;
  }
  
  const scriptLoaded = await ensureContentScript(tab.id);
  
  if (!scriptLoaded) {
    resultsDiv.innerHTML = `
      <p class="error">
        ❌ Failed to load the scanner on this page.<br>
        <small>This may be due to page permissions or security settings.</small><br><br>
        Try:<br>
        • Refreshing the Appian page<br>
        • Reopening the extension<br>
        • Checking that you're on an Appian domain
      </p>
    `;
    return;
  }
  
  // Load rules from storage
  const { auroraRules } = await chrome.storage.local.get('auroraRules');
  
  chrome.tabs.sendMessage(tab.id, { action: 'scanSAIL', rules: auroraRules }, (response) => {
    if (chrome.runtime.lastError) {
      resultsDiv.innerHTML = `
        <p class="error">
          ❌ Connection Error<br>
          <small>${chrome.runtime.lastError.message}</small><br><br>
          Try refreshing the Appian page and clicking scan again.
        </p>
      `;
      return;
    }
    
    if (!response || !response.success) {
      let errorMsg = response?.error || 'Error scanning code';
      
      if (response?.debug) {
        errorMsg += `<br><br><details style="font-size: 11px; margin-top: 8px;">`;
        errorMsg += `<summary style="cursor: pointer;">Debug Info</summary>`;
        errorMsg += `<div style="margin-top: 8px; padding: 8px; background: rgba(0,0,0,0.05); border-radius: 4px;">`;
        errorMsg += `CodeMirror elements: ${response.debug.codeMirrorElements}<br>`;
        errorMsg += `URL: ${response.debug.url}</div></details>`;
      }
      
      resultsDiv.innerHTML = `<p class="error">${errorMsg}</p>`;
      return;
    }
    
    const { issues, codeLength, lineCount, usedFallbackRules } = response;
    
    // Store results with tab info
    chrome.storage.local.set({ 
      scanResults: { issues, codeLength, lineCount, usedFallbackRules },
      scannedTabUrl: tab.url
    });
    
    const issueCount = issues.length;
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    
    let fallbackNotice = '';
    if (usedFallbackRules) {
      fallbackNotice = `<p class="scan-info" style="color: #ff9800; font-size: 11px; margin-top: 8px; padding: 8px; background: rgba(255, 152, 0, 0.1); border-radius: 4px;">⚠️ Using fallback rules - Aurora Design System guidance could not be loaded</p>`;
    }
    
    resultsDiv.innerHTML = `
      <div class="summary">
        <h3>Scan Complete</h3>
        <div class="summary-stats">
          <div class="stat-item ${errorCount > 0 ? 'has-errors' : ''}">
            <div class="stat-content">
              <span class="stat-value">${errorCount}</span>
              <span class="stat-label">error${errorCount !== 1 ? 's' : ''}</span>
            </div>
            <img src="icons/error-icon.svg" alt="Error" class="stat-icon" style="filter: invert(27%) sepia(93%) saturate(4447%) hue-rotate(352deg) brightness(95%) contrast(92%);">
          </div>
          <div class="stat-item ${warningCount > 0 ? 'has-warnings' : ''}">
            <div class="stat-content">
              <span class="stat-value">${warningCount}</span>
              <span class="stat-label">warning${warningCount !== 1 ? 's' : ''}</span>
            </div>
            <img src="icons/warning-icon.svg" alt="Warning" class="stat-icon" style="filter: invert(48%) sepia(79%) saturate(2476%) hue-rotate(6deg) brightness(98%) contrast(97%);">
          </div>
        </div>
        <p class="scan-info">Scanned ${lineCount} lines of SAIL code</p>
        ${fallbackNotice}
        <div class="rescan-reminder">
          <h4>Refresh Selection to Re-Scan</h4>
          <p>Select all SAIL code again in the expression editor to ensure the scanner reads every line, then run the extension again.</p>
        </div>
      </div>
    `;
    
    // Close existing results window if open
    if (resultsWindowId) {
      try {
        await chrome.windows.remove(resultsWindowId);
      } catch (e) {
        // Window already closed
      }
      resultsWindowId = null;
    }
    
    // Open results in a new window
    const resultsWindow = await chrome.windows.create({
      url: chrome.runtime.getURL('results.html'),
      type: 'popup',
      width: 500,
      height: 600,
      left: 100,
      top: 100
    });
    
    resultsWindowId = resultsWindow.id;
    
    // Clear tracking when window is closed
    chrome.windows.onRemoved.addListener((windowId) => {
      if (windowId === resultsWindowId) {
        resultsWindowId = null;
      }
    });
  });
}

function showInstructions() {
  const resultsDiv = document.getElementById('results');
  
  resultsDiv.innerHTML = `
    <div class="instructions">
      <h2>Select Code to Scan</h2>
      <p>Select all SAIL code in the expression editor to include it in the scan.</p>
      
      <button id="startScan">Start Accessibility Scan</button>
      
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e0e0e0; text-align: center;">
        <button id="refreshRules" style="background: transparent; color: #1976d2; border: none; font-size: 12px; padding: 4px 8px; cursor: pointer; text-decoration: underline;">
          Refresh Aurora Rules
        </button>
        <p style="font-size: 10px; color: #666; margin-top: 4px;">Fetch latest accessibility checklist from Aurora Design System</p>
      </div>
    </div>
  `;
  
  document.getElementById('startScan').addEventListener('click', runScan);
  document.getElementById('refreshRules').addEventListener('click', refreshAuroraRules);
}

async function refreshAuroraRules() {
  const button = document.getElementById('refreshRules');
  const originalText = button.innerHTML;
  button.disabled = true;
  button.innerHTML = 'Refreshing...';
  
  try {
    await chrome.runtime.sendMessage({ action: 'refreshRules' });
    button.innerHTML = 'Updated!';
    setTimeout(() => {
      button.innerHTML = originalText;
      button.disabled = false;
    }, 2000);
  } catch (error) {
    button.innerHTML = 'Failed';
    setTimeout(() => {
      button.innerHTML = originalText;
      button.disabled = false;
    }, 2000);
  }
}

// Show instructions when popup opens
document.addEventListener('DOMContentLoaded', showInstructions);