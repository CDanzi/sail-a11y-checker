// Function to extract SAIL code from Interface Designer
async function extractSAILCode() {
  console.log('🔍 Attempting to extract SAIL code...');
  
  const codeMirrorElement = document.querySelector('.CodeMirror');
  
  if (codeMirrorElement) {
    // Try CodeMirror API first
    if (codeMirrorElement.CodeMirror) {
      const code = codeMirrorElement.CodeMirror.getValue();
      if (code && code.trim().length > 0) {
        console.log('✓ Found via CodeMirror API:', code.length, 'chars');
        return code;
      }
    }
    
    // Programmatically select all content
    console.log('Programmatically selecting all content...');
    codeMirrorElement.focus();
    
    // Execute select all command
    if (codeMirrorElement.CodeMirror) {
      codeMirrorElement.CodeMirror.execCommand('selectAll');
      
      // Wait a moment for selection
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const selection = window.getSelection();
      if (selection && selection.toString().length > 100) {
        const code = selection.toString();
        console.log('✓ Got code via programmatic selection:', code.length, 'chars');
        // Clear selection
        selection.removeAllRanges();
        return code;
      }
    }
    
    // Fallback: trigger keyboard event
    const selectAllEvent = new KeyboardEvent('keydown', {
      key: 'a',
      code: 'KeyA',
      ctrlKey: !navigator.platform.includes('Mac'),
      metaKey: navigator.platform.includes('Mac'),
      bubbles: true
    });
    codeMirrorElement.dispatchEvent(selectAllEvent);
    
    // Wait for selection
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const selection = window.getSelection();
    if (selection && selection.toString().length > 100) {
      const code = selection.toString();
      console.log('✓ Got code via keyboard selection:', code.length, 'chars');
      selection.removeAllRanges();
      return code;
    }
  }
  
  // Fallback: get visible lines
  const lineElements = document.querySelectorAll('.CodeMirror-line');
  if (lineElements.length > 0) {
    const code = Array.from(lineElements).map(line => line.textContent).join('\n');
    const lineCount = code.split('\n').length;
    
    console.log('⚠️ Using visible lines only:', lineCount, 'lines,', code.length, 'chars');
    if (code && code.trim().length > 100) {
      return code;
    }
  }
  
  console.error('❌ Failed to extract SAIL code');
  return '';
}

// Enhanced A11y rules with Aurora context
function checkA11yIssues(sailCode, auroraRules = []) {
  let issues = [];
  const lines = sailCode.split('\n');
  let usedFallbackRules = false;
  
  // Try to use Aurora rules first
  if (auroraRules && auroraRules.length > 0) {
    console.log(`✅ Using ${auroraRules.length} Aurora rules for dynamic checking`);
    try {
      // Load and use Aurora rule parser
      const parser = new AuroraRuleParser(auroraRules);
      issues = parser.generateChecks(sailCode);
      console.log(`Found ${issues.length} issues using Aurora rules`);
      return { issues, usedFallbackRules: false };
    } catch (error) {
      console.error('❌ Error using Aurora rules, falling back to hardcoded:', error);
      usedFallbackRules = true;
    }
  } else {
    console.log('⚠️ No Aurora rules available, using fallback checks');
    usedFallbackRules = true;
  }
  
  // Fallback to hardcoded rules
  console.log('Using hardcoded fallback rules');
  issues = runHardcodedChecks(sailCode, lines);
  
  return { issues, usedFallbackRules };
}

// Hardcoded fallback checks (original logic)
function runHardcodedChecks(sailCode, lines) {
  const issues = [];
  
  const findLineNumber = (charIndex) => {
    let charCount = 0;
    for (let i = 0; i < lines.length; i++) {
      charCount += lines[i].length + 1;
      if (charCount > charIndex) {
        return i + 1;
      }
    }
    return lines.length;
  };
  
  // Helper function to extract component calls with nested parentheses
  function findComponents(code, componentName) {
    const matches = [];
    const regex = new RegExp(`a!${componentName}\\s*\\(`, 'g');
    let match;
    let iterations = 0;
    const maxIterations = 1000; // Safety limit
    
    while ((match = regex.exec(code)) !== null) {
      if (iterations++ > maxIterations) {
        console.warn(`Max iterations reached for ${componentName}`);
        break;
      }
      
      const startIndex = match.index;
      let depth = 0;
      let endIndex = match.index + match[0].length;
      
      for (let i = endIndex; i < code.length; i++) {
        if (code[i] === '(') depth++;
        if (code[i] === ')') {
          if (depth === 0) {
            endIndex = i + 1;
            break;
          }
          depth--;
        }
      }
      
      matches.push({
        text: code.substring(startIndex, endIndex),
        index: startIndex
      });
    }
    
    return matches;
  }

  // Use Aurora rules if available, otherwise fallback to hardcoded
  if (auroraRules && auroraRules.length > 0) {
    console.log(`Using ${auroraRules.length} rules from Aurora checklist`);
    
    // Map Aurora rules to component checks
    let rulesProcessed = 0;
    auroraRules.forEach(rule => {
      rulesProcessed++;
      if (rulesProcessed % 10 === 0) {
        console.log(`Processed ${rulesProcessed}/${auroraRules.length} rules`);
      }
      const sailTest = rule.sailTest.toLowerCase();
      const category = rule.category;
      
      // Form Inputs - Label parameter (WCAG Level A)
      if (category === 'Form Inputs' && sailTest.includes('label') && sailTest.includes('parameter') && !sailTest.includes('choicelabels')) {
        ['textField', 'dropdownField', 'dateField', 'integerField', 'decimalField', 'paragraphField', 'floatingPointField', 'checkboxField', 'radioButtonField'].forEach(comp => {
          const components = findComponents(sailCode, comp);
          components.forEach(({ text, index }) => {
            if (!text.includes('label:')) {
              issues.push({
                rule: `${comp} Missing Label`,
                message: rule.criteria,
                code: text.substring(0, 80),
                line: findLineNumber(index),
                severity: 'error',
                wcagLevel: 'A',
                auroraCategory: category,
                sailTest: rule.sailTest,
                learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
              });
            }
          });
        });
      }
      
      // Checkbox/Radio - choiceLabels (WCAG Level A)
      if (category === 'Form Inputs' && sailTest.includes('choicelabels')) {
        ['checkboxField', 'radioButtonField'].forEach(comp => {
          const components = findComponents(sailCode, comp);
          components.forEach(({ text, index }) => {
            if (!text.includes('choiceLabels:')) {
              issues.push({
                rule: `${comp} Missing Choice Labels`,
                message: rule.criteria,
                code: text.substring(0, 80),
                line: findLineNumber(index),
                severity: 'error',
                wcagLevel: 'A',
                auroraCategory: category,
                sailTest: rule.sailTest,
                learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
              });
            }
          });
        });
      }
      
      // Checkbox/Radio - Group label when multiple (WCAG Level A)
      if (category === 'Form Inputs' && (sailTest.includes('more than one checkbox') || (sailTest.includes('more than one') && sailTest.includes('radio button')))) {
        ['checkboxField', 'radioButtonField'].forEach(comp => {
          const components = findComponents(sailCode, comp);
          components.forEach(({ text, index }) => {
            // Check if has multiple choices (contains comma in choiceLabels array)
            if (text.includes('choiceLabels:') && text.match(/choiceLabels:\s*\{[^}]*,[^}]*\}/) && !text.includes('label:')) {
              issues.push({
                rule: `${comp} Group Missing Label`,
                message: rule.criteria,
                code: text.substring(0, 80),
                line: findLineNumber(index),
                severity: 'error',
                wcagLevel: 'A',
                auroraCategory: category,
                sailTest: rule.sailTest,
                learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
              });
            }
          });
        });
      }
      
      // Images - altText (WCAG Level A)
      if (category === 'Icon' && sailTest.includes('alttext')) {
        const components = findComponents(sailCode, 'imageField');
        if (components.length > 0) {
          components.forEach(({ text, index }) => {
            if (!text.includes('altText:') && !text.includes('accessibilityText:')) {
              issues.push({
                rule: 'Image Missing Alt Text',
                message: rule.criteria,
                code: text.substring(0, 80),
                line: findLineNumber(index),
                severity: 'error',
                wcagLevel: 'A',
                auroraCategory: category,
                sailTest: rule.sailTest,
                learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
              });
            }
          });
        }
      }
      
      // Grids - Label (WCAG Level A)
      if (category === 'Grids' && sailTest.includes('grid must have a label')) {
        const components = findComponents(sailCode, 'gridField');
        components.forEach(({ text, index }) => {
          if (!text.includes('label:')) {
            issues.push({
              rule: 'Grid Missing Label',
              message: rule.criteria,
              code: text.substring(0, 80),
              line: findLineNumber(index),
              severity: 'error',
              wcagLevel: 'A',
              auroraCategory: category,
              sailTest: rule.sailTest,
              learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
            });
          }
        });
      }
      
      // Grids - Column headers (WCAG Level AA)
      if (category === 'Grids' && sailTest.includes('column') && sailTest.includes('header')) {
        const components = findComponents(sailCode, 'gridColumn');
        components.forEach(({ text, index }) => {
          if (!text.includes('label:')) {
            issues.push({
              rule: 'Grid Column Missing Header',
              message: rule.criteria,
              code: text.substring(0, 80),
              line: findLineNumber(index),
              severity: 'warning',
              wcagLevel: 'AA',
              auroraCategory: category,
              sailTest: rule.sailTest,
              learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
            });
          }
        });
      }
      
      // Headings - Must use semantic headings (WCAG Level AA)
      if (category === 'Headings' && sailTest.includes('headingfield')) {
        // Check for large/bold text that should be headings
        const regex = /a!richTextItem\s*\([^)]*size:\s*"LARGE"[^)]*\)/g;
        let match;
        while ((match = regex.exec(sailCode)) !== null) {
          issues.push({
            rule: 'Text Should Use Semantic Heading',
            message: rule.criteria,
            code: match[0].substring(0, 80),
            line: findLineNumber(match.index),
            severity: 'warning',
            wcagLevel: 'AA',
            auroraCategory: category,
            sailTest: rule.sailTest,
            learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
          });
        }
      }
      
      // Section/Box Layout - labelHeadingTag for expandable (WCAG Level A)
      if ((category === 'Section Layout' || category === 'Box Layout') && sailTest.includes('labelheadingtag')) {
        const comp = category === 'Section Layout' ? 'sectionLayout' : 'boxLayout';
        const components = findComponents(sailCode, comp);
        components.forEach(({ text, index }) => {
          if (text.includes('isCollapsible: true') && !text.includes('labelHeadingTag:')) {
            issues.push({
              rule: `${comp} Missing Heading Tag`,
              message: rule.criteria,
              code: text.substring(0, 80),
              line: findLineNumber(index),
              severity: 'error',
              wcagLevel: 'A',
              auroraCategory: category,
              sailTest: rule.sailTest,
              learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
            });
          }
        });
      }
      
      // Progress Bar - Label (WCAG Level A)
      if (category === 'Progress Bar' && sailTest.includes('label')) {
        const components = findComponents(sailCode, 'progressBarField');
        components.forEach(({ text, index }) => {
          if (!text.includes('label:')) {
            issues.push({
              rule: 'Progress Bar Missing Label',
              message: rule.criteria,
              code: text.substring(0, 80),
              line: findLineNumber(index),
              severity: 'error',
              wcagLevel: 'A',
              auroraCategory: category,
              sailTest: rule.sailTest,
              learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
            });
          }
        });
      }
      
      // File Upload - Label (WCAG Level A)
      if (category === 'File Upload' && sailTest.includes('label')) {
        const components = findComponents(sailCode, 'fileUploadField');
        components.forEach(({ text, index }) => {
          if (!text.includes('label:')) {
            issues.push({
              rule: 'File Upload Missing Label',
              message: rule.criteria,
              code: text.substring(0, 80),
              line: findLineNumber(index),
              severity: 'error',
              wcagLevel: 'A',
              auroraCategory: category,
              sailTest: rule.sailTest,
              learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
            });
          }
        });
      }
      
      // Card Layout - Link with label parameter (WCAG Level A)
      if (category === 'Cards' && sailTest.includes('label') && sailTest.includes('must not')) {
        const regex = /a!cardLayout\s*\([^)]*link:[^)]*label:/g;
        let match;
        while ((match = regex.exec(sailCode)) !== null) {
          issues.push({
            rule: 'Card Link Should Not Have Label',
            message: rule.criteria,
            code: match[0].substring(0, 80),
            line: findLineNumber(match.index),
            severity: 'error',
            wcagLevel: 'A',
            auroraCategory: category,
            sailTest: rule.sailTest,
            learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
          });
        }
      }
      
      // Card Choice/Group - Label for multiple cards (WCAG Level AA)
      if ((category === 'Card Choice Field' || category === 'Card Group Layout') && sailTest.includes('more than one card')) {
        const comp = category === 'Card Choice Field' ? 'cardChoiceField' : 'cardGroupLayout';
        const regex = new RegExp(`a!${comp}\\s*\\([^)]*\\)`, 'g');
        let match;
        while ((match = regex.exec(sailCode)) !== null) {
          if (!match[0].includes('label:')) {
            issues.push({
              rule: `${comp} Missing Label`,
              message: rule.criteria,
              code: match[0].substring(0, 80),
              line: findLineNumber(match.index),
              severity: 'warning',
              wcagLevel: 'AA',
              auroraCategory: category,
              sailTest: rule.sailTest,
              learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
            });
          }
        }
      }
      
      // Card Selection - Selected cards must have accessibility text (WCAG Level A)
      if (category === 'Cards' && sailTest.includes('selected') && sailTest.includes('accessibilitytext')) {
        const cardTypes = ['cardLayout', 'cardChoiceField'];
        cardTypes.forEach(comp => {
          const components = findComponents(sailCode, comp);
          components.forEach(({ text, index }) => {
            // Check if card uses conditional styling for selection
            const hasConditionalStyle = text.match(/style:\s*if\s*\(/);
            const hasConditionalColor = text.match(/backgroundColor:\s*if\s*\(/) || text.match(/if\s*\([^)]*,\s*["']#[0-9a-fA-F]{6}["']/);
            
            if ((hasConditionalStyle || hasConditionalColor) && !text.includes('accessibilityText:')) {
              issues.push({
                rule: 'Selected Card Missing Accessibility Text',
                message: rule.criteria,
                code: text.substring(0, 80),
                line: findLineNumber(index),
                severity: 'error',
                wcagLevel: 'A',
                auroraCategory: category,
                sailTest: rule.sailTest,
                learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
              });
            }
          });
        });
      }
      
      // Date & Time Component - Must not be used (WCAG Level A)
      if (category === 'Date & Time Component') {
        const components = findComponents(sailCode, 'dateTimeField');
        components.forEach(({ text, index }) => {
          issues.push({
            rule: 'Date & Time Component Not Allowed',
            message: rule.criteria,
            code: text.substring(0, 80),
            line: findLineNumber(index),
            severity: 'error',
            wcagLevel: 'A',
            auroraCategory: category,
            sailTest: rule.sailTest,
            learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
          });
        });
      }
      
      // Validations - Required parameter (WCAG Level AA)
      if (category === 'Validations' && sailTest.includes('required') && sailTest.includes('parameter') && sailTest.includes('must be set to true')) {
        const inputTypes = ['textField', 'dropdownField', 'checkboxField', 'radioButtonField', 'dateField'];
        inputTypes.forEach(comp => {
          const components = findComponents(sailCode, comp);
          components.forEach(({ text, index }) => {
            if (text.includes('validations:') && !text.includes('required: true')) {
              issues.push({
                rule: `${comp} Missing Required Parameter`,
                message: rule.criteria,
                code: text.substring(0, 80),
                line: findLineNumber(index),
                severity: 'warning',
                wcagLevel: 'AA',
                auroraCategory: category,
                sailTest: rule.sailTest,
                learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
              });
            }
          });
        });
      }
    });
    
    // Deduplicate issues - keep only one issue per line/component
    const seen = new Set();
    issues = issues.filter(issue => {
      const key = `${issue.line}-${issue.rule.split(' ')[0]}`; // line + component type
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  } else {
    // Fallback to hardcoded rules
    console.log('Using fallback hardcoded rules');
    usedFallbackRules = true;
    const checks = [
      { 
        regex: /a!imageField\s*\([^)]*\)/g, 
        test: (m) => !m.includes('altText:') && !m.includes('accessibilityText:'), 
        rule: 'Image Missing Alt Text',
        severity: 'error',
        wcagLevel: 'A'
      },
      { 
        regex: /a!linkField\s*\([^)]*\)/g, 
        test: (m) => !m.includes('label:') && !m.includes('accessibilityText:'), 
        rule: 'Link Missing Label',
        severity: 'error',
        wcagLevel: 'A'
      },
      { 
        regex: /a!buttonWidget\s*\([^)]*\)/g, 
        test: (m) => !m.includes('label:') && !m.includes('accessibilityText:'), 
        rule: 'Button Missing Label',
        severity: 'error',
        wcagLevel: 'A'
      },
      { 
        regex: /a!textField\s*\([^)]*\)/g, 
        test: (m) => !m.includes('label:'), 
        rule: 'Input Missing Label',
        severity: 'error',
        wcagLevel: 'A'
      },
      { 
        regex: /a!dropdownField\s*\([^)]*\)/g, 
        test: (m) => !m.includes('label:'), 
        rule: 'Input Missing Label',
        severity: 'error',
        wcagLevel: 'A'
      },
      { 
        regex: /a!checkboxField\s*\([^)]*\)/g, 
        test: (m) => !m.includes('label:'), 
        rule: 'Input Missing Label',
        severity: 'error',
        wcagLevel: 'A'
      },
      { 
        regex: /a!radioButtonField\s*\([^)]*\)/g, 
        test: (m) => !m.includes('label:'), 
        rule: 'Input Missing Label',
        severity: 'error',
        wcagLevel: 'A'
      },
      { 
        regex: /a!iconIndicator\s*\([^)]*\)/g, 
        test: (m) => !m.includes('accessibilityText:') && !m.includes('caption:'), 
        rule: 'Icon Missing Accessibility Text',
        severity: 'warning',
        wcagLevel: 'AA'
      },
      {
        regex: /a!(columnChartField|barChartField|lineChartField|pieChartField|areaChartField)\s*\([^)]*\)/g,
        test: (m) => !m.includes('accessibilityText:'),
        rule: 'Chart Missing Accessibility Text',
        severity: 'warning',
        wcagLevel: 'AA'
      },
      {
        regex: /label:\s*""\s*[,)]/g,
        test: () => true,
        rule: 'Empty Label',
        severity: 'error',
        wcagLevel: 'A'
      },
      {
        regex: /a!(cardLayout|cardChoiceField)\s*\([^)]*style:\s*if\s*\([^)]*\)/g,
        test: (m) => !m.includes('accessibilityText:'),
        rule: 'Selected Card Missing Accessibility Text',
        severity: 'error',
        wcagLevel: 'A'
      }
    ];
    
    checks.forEach(check => {
      check.regex.lastIndex = 0;
      let match;
      while ((match = check.regex.exec(sailCode)) !== null) {
        if (check.test(match[0])) {
          const lineNum = findLineNumber(match.index);
          
          issues.push({ 
            rule: check.rule,
            message: 'Accessibility issue detected',
            code: match[0].substring(0, 80),
            line: lineNum,
            severity: check.severity,
            wcagLevel: check.wcagLevel,
            learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
          });
        }
      }
    });
  }
  
  return issues;
}

// Aurora Rule Parser class (inline for extension compatibility)
class AuroraRuleParser {
  constructor(auroraRules) {
    this.rules = auroraRules || [];
  }

  generateChecks(sailCode) {
    const issues = [];
    
    this.rules.forEach(rule => {
      const checks = this.parseRuleToChecks(rule);
      checks.forEach(check => {
        const violations = check.execute(sailCode);
        issues.push(...violations);
      });
    });
    
    return issues;
  }

  parseRuleToChecks(rule) {
    const checks = [];
    const sailTest = rule.sailTest?.toLowerCase() || '';
    
    // Rule: Check for label parameter
    if (sailTest.includes('inspect the label parameter') || 
        sailTest.includes('label parameter for a value') ||
        sailTest.includes('label must not be null')) {
      checks.push(this.createLabelCheck(rule));
    }
    
    // Rule: Check for choice labels
    if (sailTest.includes('choicelabels') || sailTest.includes('choice labels')) {
      checks.push(this.createChoiceLabelsCheck(rule));
    }
    
    // Rule: Check for alt text on images/icons
    if ((sailTest.includes('alttext') || sailTest.includes('alt text')) && 
        (rule.category.includes('Icon') || rule.category.includes('Image'))) {
      checks.push(this.createAltTextCheck(rule));
    }
    
    return checks;
  }

  createLabelCheck(rule) {
    return {
      execute: (sailCode) => {
        const issues = [];
        const formPatterns = [
          { name: 'textField', pattern: /a!textField\s*\([^)]*\)/g },
          { name: 'integerField', pattern: /a!integerField\s*\([^)]*\)/g },
          { name: 'decimalField', pattern: /a!decimalField\s*\([^)]*\)/g },
          { name: 'dateField', pattern: /a!dateField\s*\([^)]*\)/g },
          { name: 'dropdownField', pattern: /a!dropdownField\s*\([^)]*\)/g },
          { name: 'paragraphField', pattern: /a!paragraphField\s*\([^)]*\)/g },
        ];
        
        formPatterns.forEach(({ name, pattern }) => {
          const matches = [...sailCode.matchAll(pattern)];
          matches.forEach(match => {
            if (!match[0].includes('label:')) {
              const line = sailCode.substring(0, match.index).split('\n').length;
              issues.push({
                rule: `Missing label on ${name}`,
                message: rule.criteria,
                code: match[0].substring(0, 80),
                line: line,
                severity: 'error',
                wcagLevel: 'A',
                wcagCriteria: '1.3.1, 4.1.2',
                learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
              });
            }
          });
        });
        
        return issues;
      }
    };
  }

  createChoiceLabelsCheck(rule) {
    return {
      execute: (sailCode) => {
        const issues = [];
        const patterns = [
          { name: 'checkboxField', pattern: /a!checkboxField\s*\([^)]*\)/g },
          { name: 'radioButtonField', pattern: /a!radioButtonField\s*\([^)]*\)/g },
        ];
        
        patterns.forEach(({ name, pattern }) => {
          const matches = [...sailCode.matchAll(pattern)];
          matches.forEach(match => {
            if (!match[0].includes('choiceLabels:')) {
              const line = sailCode.substring(0, match.index).split('\n').length;
              issues.push({
                rule: `Missing choice labels on ${name}`,
                message: rule.criteria,
                code: match[0].substring(0, 80),
                line: line,
                severity: 'error',
                wcagLevel: 'A',
                wcagCriteria: '1.3.1, 4.1.2',
                learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
              });
            }
          });
        });
        
        return issues;
      }
    };
  }

  createAltTextCheck(rule) {
    return {
      execute: (sailCode) => {
        const issues = [];
        const patterns = [
          { name: 'image', pattern: /a!image\s*\([^)]*\)/g },
          { name: 'richTextIcon', pattern: /a!richTextIcon\s*\([^)]*\)/g },
        ];
        
        patterns.forEach(({ name, pattern }) => {
          const matches = [...sailCode.matchAll(pattern)];
          matches.forEach(match => {
            if (!match[0].includes('altText:')) {
              const line = sailCode.substring(0, match.index).split('\n').length;
              issues.push({
                rule: `Missing alt text on ${name}`,
                message: rule.criteria,
                code: match[0].substring(0, 80),
                line: line,
                severity: 'error',
                wcagLevel: 'A',
                wcagCriteria: '1.1.1',
                learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
              });
            }
          });
        });
        
        return issues;
      }
    };
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Received message:', request);
  
  // Handle ping to check if content script is loaded
  if (request.action === 'ping') {
    sendResponse({ status: 'ready' });
    return true;
  }
  
  if (request.action === 'scanSAIL') {
    // Add delay to ensure CodeMirror is fully initialized
    setTimeout(async () => {
      try {
        const sailCode = await extractSAILCode();
        
        if (!sailCode || sailCode.trim().length === 0) {
          console.error('❌ No SAIL code found');
          sendResponse({ 
            success: false, 
            error: 'Could not find SAIL code. Make sure you are in Interface Designer with code visible on the Expression Mode tab',
            debug: {
              codeMirrorElements: document.querySelectorAll('.CodeMirror').length,
              hasWindow: !!window.CodeMirror,
              url: window.location.href
            }
          });
          return;
        }
        
        console.log('✓ SAIL code extracted, scanning for issues...');
        const result = checkA11yIssues(sailCode, request.rules);
        console.log('✓ Scan complete, found', result.issues.length, 'issues');
        
        sendResponse({ 
          success: true, 
          issues: result.issues,
          codeLength: sailCode.length,
          lineCount: sailCode.split('\n').length,
          usedFallbackRules: result.usedFallbackRules
        });
      } catch (error) {
        console.error('❌ Error during scan:', error);
        sendResponse({
          success: false,
          error: `Scan error: ${error.message}`,
          debug: { stack: error.stack }
        });
      }
    }, 1000);
    
    return true; // Keep channel open for async response
  }
  
  return true;
});

// Log when content script loads
console.log('✅ SAIL A11y Checker content script loaded');
console.log('Current URL:', window.location.href);
console.log('CodeMirror elements found:', document.querySelectorAll('.CodeMirror').length);