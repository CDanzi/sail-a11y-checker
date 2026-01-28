# SAIL A11y Checker - Architecture

## Scanning Flow

### 1. Aurora Rules Fetch (background.js)
- Fetches Aurora Design System accessibility checklist daily
- Stores rules in chrome.storage.local
- Manual refresh available via popup button

### 2. Main Scanning Logic (content.js)

#### Primary Path: Aurora Rules Available
```
checkA11yIssues(sailCode, auroraRules)
  ↓
AuroraRuleParser.generateChecks(sailCode)
  ↓ (generates dynamic checks from Aurora rules)
Issues found
  ↓
runSupplementalChecks(sailCode, lines)
  ↓ (adds hardcoded checks for multi-line edge cases)
  - imageField/image missing altText
  - fileUploadField missing label
  - section/boxLayout missing headingTag
  - cardChoiceField missing label
  - Prohibited dateTimeField
  ↓
Merge & deduplicate
  ↓
Return { issues, usedFallbackRules: false }
```

#### Fallback Path: Aurora Rules Unavailable
```
checkA11yIssues(sailCode, [])
  ↓
runHardcodedChecks(sailCode, lines)
  ↓ (uses complete hardcoded rule set)
Return { issues, usedFallbackRules: true }
```

## Why Hybrid Approach?

### Aurora Parser Strengths
- Automatically updates when Aurora guidelines change
- Covers 20+ rule types dynamically
- No code changes needed for new Aurora rules

### Supplemental Checks Needed For
- **Multi-line components**: SAIL code is typically formatted across multiple lines
- **Complex nesting**: Components with deep parameter structures
- **Edge cases**: Patterns that are hard to match with Aurora's text-based criteria

### Examples of Multi-line Issues
```sail
// Aurora parser struggles with this:
a!imageField(
  images: a!documentImage(
    document: cons!MY_DOC
  )
)

// Supplemental check handles it with depth tracking:
- Finds component start line
- Tracks parenthesis depth
- Scans ahead until component closes
- Checks for required parameters
```

## File Structure

### Core Extension Files
- `manifest.json` - Extension configuration
- `popup.html/js` - Extension popup UI
- `results.html/js` - Detailed results page
- `content.js` - Main scanning logic (Aurora parser + supplemental checks)
- `background.js` - Aurora rules fetcher
- `styles.css` - UI styling

### Test Files
- `test-interface.sail` - Test file with 23 accessibility violations
- `test-interface-complete.sail` - Comprehensive test cases

### Documentation
- `README.md` - User guide
- `WCAG_SEVERITY_MAPPING.md` - Rule severity classifications
- `ARCHITECTURE.md` - This file

## Key Classes

### AuroraRuleParser (content.js)
Parses Aurora rules and generates dynamic checks:
- `parseRuleToChecks(rule)` - Matches rule to check type
- `createXXXCheck(rule)` - Generates specific check functions
- `generateChecks(sailCode)` - Runs all checks and returns issues

### Check Types (20+ rules)
1. Form input labels
2. Choice labels (checkbox/radio)
3. Group labels
4. Image/icon alt text
5. Grid labels
6. Grid column headers
7. Semantic headings
8. Section heading tags
9. Progress bar labels
10. File upload labels
11. Card accessibility
12. Prohibited components
13. Duplicate control context
14. Required fields
15. Link labels
16. Button labels
17. Chart accessibility
18. Picker field labels
19. Collapsible sections
20. Rich text headings

## Deduplication Strategy

Issues are deduplicated by:
- Line number
- Rule name

This prevents:
- Aurora + supplemental checks from reporting same issue
- Multiple Aurora rules matching same pattern
- Overlapping rule criteria

## Future Enhancements

1. **Smarter multi-line parsing**: Use AST parser instead of regex
2. **Custom rule configuration**: Allow users to disable specific checks
3. **Batch scanning**: Scan multiple interfaces at once
4. **Export reports**: Generate PDF/CSV reports
5. **CI/CD integration**: Run as part of build pipeline
