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
    
    console.log(`🔍 Aurora Parser: Processing ${this.rules.length} rules...`);
    
    this.rules.forEach(rule => {
      const checks = this.parseRuleToChecks(rule);
      checks.forEach(check => {
        const violations = check.execute(sailCode);
        if (violations.length > 0) {
          console.log(`  ✓ Found ${violations.length} issues for: ${rule.category}`);
        }
        issues.push(...violations);
      });
    });
    
    console.log(`🎯 Aurora Parser: Total ${issues.length} issues found`);
    
    return issues;
  }

  parseRuleToChecks(rule) {
    const checks = [];
    const sailTest = rule.sailTest?.toLowerCase() || '';
    const category = rule.category?.toLowerCase() || '';
    
    // Rule 1: Check for label parameter on form inputs
    if (sailTest.includes('inspect the label parameter') || 
        sailTest.includes('label parameter for a value') ||
        sailTest.includes('label must not be null')) {
      checks.push(this.createLabelCheck(rule));
    }
    
    // Rule 2: Check for choice labels on checkbox/radio
    if (sailTest.includes('choicelabels') || sailTest.includes('choice labels')) {
      checks.push(this.createChoiceLabelsCheck(rule));
    }
    
    // Rule 3: Check for group labels on multiple choice fields
    if (category.includes('form') && sailTest.includes('group') && sailTest.includes('label')) {
      checks.push(this.createGroupLabelCheck(rule));
    }
    
    // Rule 4: Check for alt text on images/icons
    if ((sailTest.includes('alttext') || sailTest.includes('alt text')) && 
        (category.includes('icon') || category.includes('image'))) {
      checks.push(this.createAltTextCheck(rule));
    }
    
    // Rule 5: Check for grid labels
    if (category.includes('grid') && sailTest.includes('label') && !sailTest.includes('column')) {
      checks.push(this.createGridLabelCheck(rule));
    }
    
    // Rule 6: Check for grid column headers
    if (category.includes('grid') && (sailTest.includes('column') || sailTest.includes('header'))) {
      checks.push(this.createGridColumnCheck(rule));
    }
    
    // Rule 7: Check for semantic headings
    if (category.includes('heading') || sailTest.includes('heading tag')) {
      checks.push(this.createHeadingCheck(rule));
    }
    
    // Rule 8: Check for section heading tags
    if (category.includes('section') && sailTest.includes('heading')) {
      checks.push(this.createSectionHeadingCheck(rule));
    }
    
    // Rule 9: Check for progress bar labels
    if (sailTest.includes('progress') || category.includes('progress')) {
      checks.push(this.createProgressBarCheck(rule));
    }
    
    // Rule 10: Check for file upload labels
    if (sailTest.includes('file upload') || category.includes('file')) {
      checks.push(this.createFileUploadCheck(rule));
    }
    
    // Rule 11: Check for card accessibility text
    if (category.includes('card') && sailTest.includes('accessibility')) {
      checks.push(this.createCardAccessibilityCheck(rule));
    }
    
    // Rule 12: Check for prohibited components
    if (sailTest.includes('must not') || sailTest.includes('prohibited')) {
      checks.push(this.createProhibitedComponentCheck(rule));
    }
    
    // NEW Rule 13: Check for duplicate control context
    if (sailTest.includes('duplicate') || sailTest.includes('repeated') || 
        (sailTest.includes('accessibilitytext') && sailTest.includes('context'))) {
      checks.push(this.createDuplicateControlCheck(rule));
    }
    
    // NEW Rule 14: Check for required field indicators
    if (sailTest.includes('required') && category.includes('form')) {
      checks.push(this.createRequiredFieldCheck(rule));
    }
    
    // NEW Rule 15: Check for link labels
    if (category.includes('link') && sailTest.includes('label')) {
      checks.push(this.createLinkLabelCheck(rule));
    }
    
    // NEW Rule 16: Check for button labels
    if (category.includes('button') || sailTest.includes('button')) {
      checks.push(this.createButtonLabelCheck(rule));
    }
    
    // NEW Rule 17: Check for chart accessibility
    if (category.includes('chart') || sailTest.includes('chart')) {
      checks.push(this.createChartAccessibilityCheck(rule));
    }
    
    // NEW Rule 18: Check for picker field labels
    if (sailTest.includes('picker') || category.includes('picker')) {
      checks.push(this.createPickerFieldCheck(rule));
    }
    
    // NEW Rule 19: Check for collapsible section headings
    if (sailTest.includes('collapsible') || (category.includes('section') && sailTest.includes('iscollapsible'))) {
      checks.push(this.createCollapsibleSectionCheck(rule));
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

  createGroupLabelCheck(rule) {
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
            // Check if has multiple choices (contains array with commas)
            if (match[0].includes('choiceLabels:') && match[0].includes(',')) {
              if (!match[0].includes('label:')) {
                const line = sailCode.substring(0, match.index).split('\n').length;
                issues.push({
                  rule: `${name} group missing label`,
                  message: rule.criteria,
                  code: match[0].substring(0, 80),
                  line: line,
                  severity: 'error',
                  wcagLevel: 'A',
                  wcagCriteria: '1.3.1',
                  learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
                });
              }
            }
          });
        });
        
        return issues;
      }
    };
  }

  createGridLabelCheck(rule) {
    return {
      execute: (sailCode) => {
        const issues = [];
        const pattern = /a!gridField\s*\([^)]*\)/g;
        const matches = [...sailCode.matchAll(pattern)];
        
        matches.forEach(match => {
          if (!match[0].includes('label:')) {
            const line = sailCode.substring(0, match.index).split('\n').length;
            issues.push({
              rule: 'Grid missing label',
              message: rule.criteria,
              code: match[0].substring(0, 80),
              line: line,
              severity: 'warning',
              wcagLevel: 'AA',
              wcagCriteria: '2.4.6',
              learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
            });
          }
        });
        
        return issues;
      }
    };
  }

  createGridColumnCheck(rule) {
    return {
      execute: (sailCode) => {
        const issues = [];
        const pattern = /a!gridField\s*\([^)]*columns\s*:\s*\{[^}]*\}/g;
        const matches = [...sailCode.matchAll(pattern)];
        
        matches.forEach(match => {
          const columnsMatch = match[0].match(/columns\s*:\s*\{([^}]*)\}/);
          if (columnsMatch && !columnsMatch[1].includes('label:')) {
            const line = sailCode.substring(0, match.index).split('\n').length;
            issues.push({
              rule: 'Grid column missing header',
              message: rule.criteria,
              code: match[0].substring(0, 80),
              line: line,
              severity: 'warning',
              wcagLevel: 'AA',
              wcagCriteria: '1.3.1',
              learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
            });
          }
        });
        
        return issues;
      }
    };
  }

  createHeadingCheck(rule) {
    return {
      execute: (sailCode) => {
        const issues = [];
        // Look for large/bold text that should be headings
        const pattern = /a!richTextDisplayField\s*\([^)]*value\s*:\s*a!richTextItem\s*\([^)]*text\s*:\s*"[^"]*"[^)]*size\s*:\s*"(LARGE|MEDIUM_PLUS)"/g;
        const matches = [...sailCode.matchAll(pattern)];
        
        matches.forEach(match => {
          if (!match[0].includes('headingTag:')) {
            const line = sailCode.substring(0, match.index).split('\n').length;
            issues.push({
              rule: 'Large text missing heading tag',
              message: rule.criteria,
              code: match[0].substring(0, 80),
              line: line,
              severity: 'warning',
              wcagLevel: 'AA',
              wcagCriteria: '1.3.1',
              learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
            });
          }
        });
        
        return issues;
      }
    };
  }

  createSectionHeadingCheck(rule) {
    return {
      execute: (sailCode) => {
        const issues = [];
        const patterns = [
          { name: 'sectionLayout', pattern: /a!sectionLayout\s*\([^)]*\)/g },
          { name: 'boxLayout', pattern: /a!boxLayout\s*\([^)]*\)/g },
        ];
        
        patterns.forEach(({ name, pattern }) => {
          const matches = [...sailCode.matchAll(pattern)];
          matches.forEach(match => {
            if (match[0].includes('label:') && !match[0].includes('headingTag:')) {
              const line = sailCode.substring(0, match.index).split('\n').length;
              issues.push({
                rule: `${name} missing heading tag`,
                message: rule.criteria,
                code: match[0].substring(0, 80),
                line: line,
                severity: 'warning',
                wcagLevel: 'AA',
                wcagCriteria: '1.3.1',
                learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
              });
            }
          });
        });
        
        return issues;
      }
    };
  }

  createProgressBarCheck(rule) {
    return {
      execute: (sailCode) => {
        const issues = [];
        const pattern = /a!progressBarField\s*\([^)]*\)/g;
        const matches = [...sailCode.matchAll(pattern)];
        
        matches.forEach(match => {
          if (!match[0].includes('label:')) {
            const line = sailCode.substring(0, match.index).split('\n').length;
            issues.push({
              rule: 'Progress bar missing label',
              message: rule.criteria,
              code: match[0].substring(0, 80),
              line: line,
              severity: 'warning',
              wcagLevel: 'AA',
              wcagCriteria: '2.4.6',
              learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
            });
          }
        });
        
        return issues;
      }
    };
  }

  createFileUploadCheck(rule) {
    return {
      execute: (sailCode) => {
        const issues = [];
        const pattern = /a!fileUploadField\s*\([^)]*\)/g;
        const matches = [...sailCode.matchAll(pattern)];
        
        matches.forEach(match => {
          if (!match[0].includes('label:')) {
            const line = sailCode.substring(0, match.index).split('\n').length;
            issues.push({
              rule: 'File upload missing label',
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
        
        return issues;
      }
    };
  }

  createCardAccessibilityCheck(rule) {
    return {
      execute: (sailCode) => {
        const issues = [];
        const pattern = /a!cardLayout\s*\([^)]*\)/g;
        const matches = [...sailCode.matchAll(pattern)];
        
        matches.forEach(match => {
          // Check if card uses conditional styling (likely for selection)
          if ((match[0].includes('showBorder:') && match[0].includes('if(')) ||
              (match[0].includes('style:') && match[0].includes('if('))) {
            if (!match[0].includes('accessibilityText:')) {
              const line = sailCode.substring(0, match.index).split('\n').length;
              issues.push({
                rule: 'Selected card missing accessibility text',
                message: rule.criteria,
                code: match[0].substring(0, 80),
                line: line,
                severity: 'warning',
                wcagLevel: 'AA',
                wcagCriteria: '4.1.2',
                learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
              });
            }
          }
        });
        
        return issues;
      }
    };
  }

  createProhibitedComponentCheck(rule) {
    return {
      execute: (sailCode) => {
        const issues = [];
        // Check for prohibited dateTimeField
        const pattern = /a!dateTimeField\s*\(/g;
        const matches = [...sailCode.matchAll(pattern)];
        
        matches.forEach(match => {
          const line = sailCode.substring(0, match.index).split('\n').length;
          issues.push({
            rule: 'Prohibited component: dateTimeField',
            message: rule.criteria || 'dateTimeField is not accessible and should not be used',
            code: match[0].substring(0, 80),
            line: line,
            severity: 'error',
            wcagLevel: 'A',
            wcagCriteria: '4.1.2',
            learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
          });
        });
        
        return issues;
      }
    };
  }

  createDuplicateControlCheck(rule) {
    return {
      execute: (sailCode) => {
        const issues = [];
        const formPattern = /a!(textField|integerField|decimalField|dropdownField)\s*\([^)]*\)/g;
        const matches = [...sailCode.matchAll(formPattern)];
        
        // Group by label to find duplicates
        const labelGroups = {};
        matches.forEach(match => {
          const labelMatch = match[0].match(/label\s*:\s*"([^"]*)"/);
          if (labelMatch) {
            const label = labelMatch[1];
            if (!labelGroups[label]) labelGroups[label] = [];
            labelGroups[label].push(match);
          }
        });
        
        // Check duplicates for accessibilityText
        Object.entries(labelGroups).forEach(([label, group]) => {
          if (group.length > 1) {
            group.forEach(match => {
              if (!match[0].includes('accessibilityText:')) {
                const line = sailCode.substring(0, match.index).split('\n').length;
                issues.push({
                  rule: 'Duplicate control missing accessibility text',
                  message: rule.criteria,
                  code: match[0].substring(0, 80),
                  line: line,
                  severity: 'error',
                  wcagLevel: 'A',
                  wcagCriteria: '2.4.6',
                  learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
                });
              }
            });
          }
        });
        
        return issues;
      }
    };
  }

  createRequiredFieldCheck(rule) {
    return {
      execute: (sailCode) => {
        const issues = [];
        const formPatterns = [
          { name: 'textField', pattern: /a!textField\s*\([^)]*\)/g },
          { name: 'dropdownField', pattern: /a!dropdownField\s*\([^)]*\)/g },
        ];
        
        formPatterns.forEach(({ name, pattern }) => {
          const matches = [...sailCode.matchAll(pattern)];
          matches.forEach(match => {
            if (match[0].includes('required:') && !match[0].includes('required: true') && 
                !match[0].includes('required: false')) {
              const line = sailCode.substring(0, match.index).split('\n').length;
              issues.push({
                rule: `${name} missing required parameter`,
                message: rule.criteria,
                code: match[0].substring(0, 80),
                line: line,
                severity: 'warning',
                wcagLevel: 'AA',
                wcagCriteria: '3.3.2',
                learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
              });
            }
          });
        });
        
        return issues;
      }
    };
  }

  createLinkLabelCheck(rule) {
    return {
      execute: (sailCode) => {
        const issues = [];
        const pattern = /a!linkField\s*\([^)]*\)/g;
        const matches = [...sailCode.matchAll(pattern)];
        
        matches.forEach(match => {
          if (!match[0].includes('label:') && !match[0].includes('accessibilityText:')) {
            const line = sailCode.substring(0, match.index).split('\n').length;
            issues.push({
              rule: 'Link missing label',
              message: rule.criteria,
              code: match[0].substring(0, 80),
              line: line,
              severity: 'error',
              wcagLevel: 'A',
              wcagCriteria: '2.4.4, 4.1.2',
              learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
            });
          }
        });
        
        return issues;
      }
    };
  }

  createButtonLabelCheck(rule) {
    return {
      execute: (sailCode) => {
        const issues = [];
        const patterns = [
          { name: 'buttonWidget', pattern: /a!buttonWidget\s*\([^)]*\)/g },
          { name: 'buttonArrayLayout', pattern: /a!buttonArrayLayout\s*\([^)]*\)/g },
        ];
        
        patterns.forEach(({ name, pattern }) => {
          const matches = [...sailCode.matchAll(pattern)];
          matches.forEach(match => {
            if (!match[0].includes('label:')) {
              const line = sailCode.substring(0, match.index).split('\n').length;
              issues.push({
                rule: `${name} missing label`,
                message: rule.criteria,
                code: match[0].substring(0, 80),
                line: line,
                severity: 'error',
                wcagLevel: 'A',
                wcagCriteria: '4.1.2',
                learnMoreUrl: 'https://appian-design.github.io/aurora/accessibility/checklist/'
              });
            }
          });
        });
        
        return issues;
      }
    };
  }

  createChartAccessibilityCheck(rule) {
    return {
      execute: (sailCode) => {
        const issues = [];
        const patterns = [
          { name: 'barChartField', pattern: /a!barChartField\s*\([^)]*\)/g },
          { name: 'columnChartField', pattern: /a!columnChartField\s*\([^)]*\)/g },
          { name: 'lineChartField', pattern: /a!lineChartField\s*\([^)]*\)/g },
          { name: 'pieChartField', pattern: /a!pieChartField\s*\([^)]*\)/g },
        ];
        
        patterns.forEach(({ name, pattern }) => {
          const matches = [...sailCode.matchAll(pattern)];
          matches.forEach(match => {
            if (!match[0].includes('accessibilityText:')) {
              const line = sailCode.substring(0, match.index).split('\n').length;
              issues.push({
                rule: `${name} missing accessibility text`,
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

  createPickerFieldCheck(rule) {
    return {
      execute: (sailCode) => {
        const issues = [];
        const pattern = /a!pickerField\s*\([^)]*\)/g;
        const matches = [...sailCode.matchAll(pattern)];
        
        matches.forEach(match => {
          if (!match[0].includes('label:')) {
            const line = sailCode.substring(0, match.index).split('\n').length;
            issues.push({
              rule: 'Picker field missing label',
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
        
        return issues;
      }
    };
  }

  createCollapsibleSectionCheck(rule) {
    return {
      execute: (sailCode) => {
        const issues = [];
        const patterns = [
          { name: 'sectionLayout', pattern: /a!sectionLayout\s*\([^)]*isCollapsible\s*:\s*true[^)]*\)/g },
          { name: 'boxLayout', pattern: /a!boxLayout\s*\([^)]*isCollapsible\s*:\s*true[^)]*\)/g },
        ];
        
        patterns.forEach(({ name, pattern }) => {
          const matches = [...sailCode.matchAll(pattern)];
          matches.forEach(match => {
            if (!match[0].includes('headingTag:')) {
              const line = sailCode.substring(0, match.index).split('\n').length;
              issues.push({
                rule: `Collapsible ${name} missing heading tag`,
                message: rule.criteria,
                code: match[0].substring(0, 80),
                line: line,
                severity: 'warning',
                wcagLevel: 'AA',
                wcagCriteria: '1.3.1',
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