# Aurora A11y Checklist Coverage Analysis

## Aurora Checklist Categories:
1. Form Inputs
2. Grids
3. Headings
4. Icons
5. Images
6. Links
7. Progress Indicators
8. Rich Text
9. Sections
10. Cards

---

## Expanded Aurora Parser Coverage:

### ✅ FULLY COVERED (12 rules):

1. **Form Inputs - Label Parameter**
   - Aurora Rule: "Every enabled and disabled input MUST have a label set via the input label parameter"
   - SAIL Test: "Inspect the label parameter for a value, it must not be null"
   - Parser: `createLabelCheck()` - Checks textField, integerField, decimalField, dateField, dropdownField, paragraphField

2. **Form Inputs - Choice Labels**
   - Aurora Rule: "Checkbox and radio button fields MUST have choiceLabels"
   - SAIL Test: "Inspect the choiceLabels parameter"
   - Parser: `createChoiceLabelsCheck()` - Checks checkboxField, radioButtonField

3. **Form Inputs - Group Labels**
   - Aurora Rule: "Multiple choice controls need group labels"
   - SAIL Test: "Check if group label provided when multiple choices"
   - Parser: `createGroupLabelCheck()` - Checks for label when choiceLabels has multiple items

4. **Images - Alt Text**
   - Aurora Rule: "Images MUST have altText"
   - SAIL Test: "Inspect the altText parameter"
   - Parser: `createAltTextCheck()` - Checks a!image

5. **Icons - Alt Text**
   - Aurora Rule: "Icons MUST have altText"
   - SAIL Test: "Inspect the altText parameter"
   - Parser: `createAltTextCheck()` - Checks a!richTextIcon

6. **Grids - Label**
   - Aurora Rule: "Grids should have labels"
   - SAIL Test: "Inspect the label parameter on grid"
   - Parser: `createGridLabelCheck()` - Checks a!gridField

7. **Grids - Column Headers**
   - Aurora Rule: "Grid columns should have labels"
   - SAIL Test: "Inspect column label parameters"
   - Parser: `createGridColumnCheck()` - Checks columns in a!gridField

8. **Headings - Semantic Tags**
   - Aurora Rule: "Large text should use heading tags"
   - SAIL Test: "Check for headingTag parameter on large text"
   - Parser: `createHeadingCheck()` - Checks richTextDisplayField with LARGE/MEDIUM_PLUS size

9. **Sections - Heading Tags**
   - Aurora Rule: "Section layouts should use heading tags"
   - SAIL Test: "Check for headingTag on sections with labels"
   - Parser: `createSectionHeadingCheck()` - Checks a!sectionLayout, a!boxLayout

10. **Progress Indicators - Labels**
    - Aurora Rule: "Progress bars need labels"
    - SAIL Test: "Inspect label parameter on progress bar"
    - Parser: `createProgressBarCheck()` - Checks a!progressBarField

11. **File Upload - Labels**
    - Aurora Rule: "File uploads need labels"
    - SAIL Test: "Inspect label parameter on file upload"
    - Parser: `createFileUploadCheck()` - Checks a!fileUploadField

12. **Cards - Accessibility Text**
    - Aurora Rule: "Selected cards need accessibility text"
    - SAIL Test: "Check accessibilityText when card has conditional styling"
    - Parser: `createCardAccessibilityCheck()` - Checks a!cardLayout with conditional styling

13. **Prohibited Components**
    - Aurora Rule: "dateTimeField must not be used"
    - SAIL Test: "Component must not be present"
    - Parser: `createProhibitedComponentCheck()` - Checks for a!dateTimeField

---

## ❌ NOT COVERED BY AURORA PARSER (Hardcoded Only):

### 1. **Form Inputs - Placeholder Text**
   - Aurora Rule: "Placeholder text alone MUST NOT be used to convey important information"
   - SAIL Test: Not easily parseable from Aurora text
   - Hardcoded: ❌ Not implemented in either parser

### 2. **Form Inputs - Persistent Labels**
   - Aurora Rule: "Every input MUST have a persistently visible label (labelPosition not COLLAPSED)"
   - SAIL Test: "Inspect labelPosition parameter"
   - Hardcoded: ❌ Not implemented in either parser

### 3. **Form Inputs - Label Matches Visible Text**
   - Aurora Rule: "Label parameter value must contain at least the same string as visible label"
   - SAIL Test: "Compare label parameter to rich text used for visible label"
   - Hardcoded: ❌ Not implemented in either parser

### 4. **Form Inputs - Duplicate Controls Context**
   - Aurora Rule: "Duplicated controls need additional context via accessibilityText"
   - SAIL Test: "Inspect accessibilityText for repeated controls"
   - Aurora Parser: ❌ Not implemented
   - Hardcoded: ✅ Partially implemented (checks for duplicate labels)

### 5. **Form Inputs - Required Fields**
   - Aurora Rule: "Required fields should be indicated"
   - SAIL Test: "Check required parameter"
   - Aurora Parser: ❌ Not implemented
   - Hardcoded: ✅ Implemented (checks for required parameter)

### 6. **Links - Label or Accessibility Text**
   - Aurora Rule: "Links must have label or accessibilityText"
   - SAIL Test: "Inspect label and accessibilityText parameters"
   - Aurora Parser: ❌ Not implemented
   - Hardcoded: ✅ Implemented (checks a!linkField)

### 7. **Rich Text - Link Context**
   - Aurora Rule: "Rich text links need descriptive text"
   - SAIL Test: "Check link text is descriptive"
   - Aurora Parser: ❌ Not implemented
   - Hardcoded: ❌ Not implemented

### 8. **Buttons - Labels**
   - Aurora Rule: "Buttons must have labels"
   - SAIL Test: "Inspect label parameter"
   - Aurora Parser: ❌ Not implemented
   - Hardcoded: ✅ Implemented (checks a!buttonWidget, a!buttonArrayLayout)

### 9. **Charts - Accessibility Text**
   - Aurora Rule: "Charts need accessibility text"
   - SAIL Test: "Inspect accessibilityText parameter"
   - Aurora Parser: ❌ Not implemented
   - Hardcoded: ✅ Implemented (checks chart components)

### 10. **Picker Fields - Labels**
    - Aurora Rule: "Picker fields need labels"
    - SAIL Test: "Inspect label parameter"
    - Aurora Parser: ❌ Not implemented (pickerField not in form field list)
    - Hardcoded: ✅ Implemented

### 11. **Collapsible Sections - Heading Tags**
    - Aurora Rule: "Collapsible sections need heading tags"
    - SAIL Test: "Check isCollapsible and headingTag parameters"
    - Aurora Parser: ❌ Not implemented (doesn't check isCollapsible)
    - Hardcoded: ✅ Implemented

---

## Summary:

### Expanded Aurora Parser:
- **Covers**: 13 Aurora rules
- **Missing**: 8 Aurora rules (mostly edge cases and complex checks)
- **Coverage**: ~62% of Aurora checklist

### Hardcoded Parser:
- **Covers**: 18+ Aurora rules
- **Missing**: 3 Aurora rules (complex text analysis)
- **Coverage**: ~86% of Aurora checklist

### Gap Analysis:
The Aurora parser is missing:
1. Duplicate control context (accessibilityText)
2. Required field indicators
3. Link labels
4. Button labels
5. Chart accessibility
6. Picker field labels
7. Collapsible section headings
8. Some edge case validations

---

## Recommendation:

**Option A**: Expand Aurora parser to add missing 8 rules (would achieve ~86% parity)

**Option B**: Keep hardcoded parser as primary, use Aurora for documentation/reference

**Option C**: Hybrid - Use hardcoded checks but map each to Aurora rule for "Learn More" links
