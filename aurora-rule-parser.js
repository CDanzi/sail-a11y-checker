// Aurora Rule Parser - Converts Aurora SAIL testing instructions into executable checks

class AuroraRuleParser {
  constructor(auroraRules) {
    this.rules = auroraRules || [];
    this.componentPatterns = this.buildComponentPatterns();
  }

  buildComponentPatterns() {
    return {
      // Form inputs
      textField: /a!textField\s*\(/,
      paragraphField: /a!paragraphField\s*\(/,
      integerField: /a!integerField\s*\(/,
      decimalField: /a!decimalField\s*\(/,
      dateField: /a!dateField\s*\(/,
      dateTimeField: /a!dateTimeField\s*\(/,
      dropdownField: /a!dropdownField\s*\(/,
      checkboxField: /a!checkboxField\s*\(/,
      radioButtonField: /a!radioButtonField\s*\(/,
      fileUploadField: /a!fileUploadField\s*\(/,
      pickerField: /a!pickerField\s*\(/,
      
      // Other components
      gridField: /a!gridField\s*\(/,
      image: /a!image\s*\(/,
      richTextIcon: /a!richTextIcon\s*\(/,
      cardLayout: /a!cardLayout\s*\(/,
      sectionLayout: /a!sectionLayout\s*\(/,
      columnsLayout: /a!columnsLayout\s*\(/,
    };
  }

  // Parse Aurora rules and generate checks
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
        sailTest.includes('label parameter for a value')) {
      checks.push(this.createLabelCheck(rule));
    }
    
    // Rule: Check for accessibility text
    if (sailTest.includes('accessibilitytext') || 
        sailTest.includes('accessibility text')) {
      checks.push(this.createAccessibilityTextCheck(rule));
    }
    
    // Rule: Check for alt text on images/icons
    if (sailTest.includes('alttext') || sailTest.includes('alt text')) {
      checks.push(this.createAltTextCheck(rule));
    }
    
    // Rule: Check for choice labels
    if (sailTest.includes('choicelabels') || sailTest.includes('choice labels')) {
      checks.push(this.createChoiceLabelsCheck(rule));
    }
    
    // Rule: Check for grid columns
    if (sailTest.includes('columns') && rule.category.includes('Grid')) {
      checks.push(this.createGridColumnsCheck(rule));
    }
    
    return checks;
  }

  createLabelCheck(rule) {
    return {
      rule: rule.criteria,
      category: rule.category,
      wcagLevel: 'A',
      execute: (sailCode) => {
        const issues = [];
        const formComponents = [
          'textField', 'paragraphField', 'integerField', 'decimalField',
          'dateField', 'dropdownField', 'checkboxField', 'radioButtonField',
          'fileUploadField', 'pickerField'
        ];
        
        formComponents.forEach(component => {
          const pattern = this.componentPatterns[component];
          if (!pattern) return;
          
          const matches = this.findComponentMatches(sailCode, pattern);
          matches.forEach(match => {
            if (!this.hasParameter(match.code, 'label')) {
              issues.push({
                rule: `Missing label on ${component}`,
                message: rule.criteria,
                code: match.code,
                line: match.line,
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

  createAccessibilityTextCheck(rule) {
    return {
      rule: rule.criteria,
      category: rule.category,
      wcagLevel: 'A',
      execute: (sailCode) => {
        const issues = [];
        // Check for components that should have accessibilityText when duplicated
        const pattern = /a!(?:textField|integerField|decimalField)\s*\([^)]*\)/g;
        const matches = [...sailCode.matchAll(pattern)];
        
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
              if (!match[0].includes('accessibilityText')) {
                const line = sailCode.substring(0, match.index).split('\n').length;
                issues.push({
                  rule: 'Duplicate controls need accessibility text',
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

  createAltTextCheck(rule) {
    return {
      rule: rule.criteria,
      category: rule.category,
      wcagLevel: 'A',
      execute: (sailCode) => {
        const issues = [];
        const imagePattern = /a!image\s*\([^)]*\)/g;
        const iconPattern = /a!richTextIcon\s*\([^)]*\)/g;
        
        [...sailCode.matchAll(imagePattern), ...sailCode.matchAll(iconPattern)].forEach(match => {
          if (!match[0].includes('altText')) {
            const line = sailCode.substring(0, match.index).split('\n').length;
            issues.push({
              rule: 'Missing alt text on image/icon',
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
        
        return issues;
      }
    };
  }

  createChoiceLabelsCheck(rule) {
    return {
      rule: rule.criteria,
      category: rule.category,
      wcagLevel: 'A',
      execute: (sailCode) => {
        const issues = [];
        const checkboxPattern = /a!checkboxField\s*\([^)]*\)/g;
        const radioPattern = /a!radioButtonField\s*\([^)]*\)/g;
        
        [...sailCode.matchAll(checkboxPattern), ...sailCode.matchAll(radioPattern)].forEach(match => {
          if (!match[0].includes('choiceLabels')) {
            const line = sailCode.substring(0, match.index).split('\n').length;
            issues.push({
              rule: 'Missing choice labels',
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

  createGridColumnsCheck(rule) {
    return {
      rule: rule.criteria,
      category: rule.category,
      wcagLevel: 'AA',
      execute: (sailCode) => {
        const issues = [];
        const gridPattern = /a!gridField\s*\([^)]*columns\s*:\s*\{[^}]*\}/g;
        
        [...sailCode.matchAll(gridPattern)].forEach(match => {
          const columnsMatch = match[0].match(/columns\s*:\s*\{([^}]*)\}/);
          if (columnsMatch && !columnsMatch[1].includes('label:')) {
            const line = sailCode.substring(0, match.index).split('\n').length;
            issues.push({
              rule: 'Grid columns missing labels',
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

  // Helper methods
  findComponentMatches(sailCode, pattern) {
    const matches = [];
    const lines = sailCode.split('\n');
    
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        matches.push({
          code: line.trim().substring(0, 80),
          line: index + 1
        });
      }
    });
    
    return matches;
  }

  hasParameter(code, paramName) {
    const pattern = new RegExp(`${paramName}\\s*:`);
    return pattern.test(code);
  }
}

// Export for use in content.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuroraRuleParser;
}
