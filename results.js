// Get results from storage and display
chrome.storage.local.get(['scanResults'], (data) => {
  const resultsDiv = document.getElementById('results');
  
  if (!data.scanResults) {
    resultsDiv.innerHTML = '<p class="error">No scan results found</p>';
    return;
  }
  
  const { issues, codeLength, lineCount } = data.scanResults;
  
  if (issues.length === 0) {
    resultsDiv.innerHTML = `
      <div class="success">
        <h3>✓ No Issues Found</h3>
        <p>Scanned ${lineCount} lines (${codeLength} characters) of SAIL code.</p>
        <p class="aurora-link">
          <a href="https://appian-design.github.io/aurora/accessibility/checklist/" target="_blank">
            View Aurora A11y Checklist →
          </a>
        </p>
      </div>
    `;
    return;
  }
  
  // Sort issues by line number (ascending)
  const sortedIssues = [...issues].sort((a, b) => {
    const lineA = a.line || 0;
    const lineB = b.line || 0;
    return lineA - lineB;
  });
  
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  
  let html = `
    <div class="summary">
      <h3>Found ${issues.length} Issue${issues.length > 1 ? 's' : ''}</h3>
      <p>${errorCount} error${errorCount !== 1 ? 's' : ''}, ${warningCount} warning${warningCount !== 1 ? 's' : ''}</p>
      <p class="scan-info">Scanned ${lineCount} lines</p>
    </div>
    <div class="issues-list">
  `;
  
  sortedIssues.forEach((issue) => {
    const lineInfo = issue.line ? `<span class="line-number">Line ${issue.line}</span>` : '';
    const wcagInfo = issue.wcagCriteria ? `<span class="wcag-badge">${issue.wcagCriteria}</span>` : '';
    const severityLabel = issue.severity === 'error' ? 'Error' : 'Warning';
    
    html += `
      <div class="issue ${issue.severity}">
        <span class="severity-badge ${issue.severity}">${severityLabel}</span>
        <div class="issue-header">
          ${lineInfo}
        </div>
        <strong class="issue-title">${issue.rule}</strong>
        ${wcagInfo ? `<div class="wcag-info">${wcagInfo} (Level ${issue.wcagLevel})</div>` : ''}
        <p>${issue.message}</p>
        <code>${issue.code}${issue.code.length >= 80 ? '...' : ''}</code>
        <a href="${issue.learnMoreUrl}" target="_blank" class="learn-more">
          Learn more in Aurora Guidelines →
        </a>
      </div>
    `;
  });
  
  html += `</div>
    <div class="footer">
      <a href="https://appian-design.github.io/aurora/accessibility/checklist/" target="_blank" class="aurora-link">
        View Full Aurora A11y Checklist
      </a>
    </div>
  `;
  
  resultsDiv.innerHTML = html;
});
