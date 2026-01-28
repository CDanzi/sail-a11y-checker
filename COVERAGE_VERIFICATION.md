# Coverage Verification Report

**Date**: January 28, 2026  
**Test File**: test-interface.sail (15 expected violations)

## Executive Summary

✅ **All 15 rules from test-interface.sail are properly detected**
- Aurora parser: 14/15 rules
- Supplemental checks: 6/15 rules (for multi-line edge cases + cardChoiceField)
- Fallback checks: 15/15 rules (complete standalone coverage)

## Primary Path: Aurora + Supplemental

| Rule | Description | Aurora | Supplemental | Detection Method |
|------|-------------|--------|--------------|------------------|
| 1 | textField missing label | ✅ | — | Form Inputs → createFormInputCheck |
| 2 | checkboxField missing group label | ✅ | — | Form Inputs → createGroupLabelCheck |
| 3 | image missing altText | ✅ | ✅ | Images → createImageAltTextCheck + multi-line |
| 4 | gridField missing label | ✅ | — | Grids → createGridLabelCheck |
| 5 | grid column missing header | ✅ | — | Grids → createGridColumnCheck |
| 6 | text heading not using headingField | ✅ | — | Headings → createHeadingCheck |
| 7 | sectionLayout missing headingTag | ✅ | ✅ | Sections → createSectionHeadingCheck + multi-line |
| 8 | boxLayout missing headingTag | ✅ | ✅ | Sections → createSectionHeadingCheck + multi-line |
| 9 | progressBarField missing label | ✅ | — | Progress → createProgressBarCheck |
| 10 | fileUploadField missing label | ✅ | ✅ | Form Inputs → createFileUploadCheck + multi-line |
| 11 | cardLayout link with label | ✅ | — | Links → createLinkLabelCheck |
| 12 | cardChoiceField missing label | ❌ | ✅ | **Supplemental check only** |
| 13 | cardLayout missing accessibilityText | ✅ | — | Cards → createCardAccessibilityCheck |
| 14 | dateTimeField prohibited | ✅ | ✅ | Form Inputs → createProhibitedComponentCheck + supplemental |
| 15 | required field missing required param | ✅ | — | Validations → createRequiredFieldCheck |

**Coverage**: 15/15 ✅

## Fallback Path: Hardcoded Checks Only

When Aurora Design System guidelines cannot be fetched, the extension falls back to complete hardcoded checks covering all 15 rules.

**Coverage**: 15/15 ✅

## Supplemental Checks (6 total)

These checks run alongside Aurora parser to handle edge cases:

1. **imageField/image missing altText** - Multi-line depth tracking
2. **fileUploadField missing label** - Multi-line depth tracking
3. **section/boxLayout missing headingTag** - Multi-line depth tracking
4. **cardChoiceField missing label** - NOT matched by Aurora parser
5. **dateTimeField prohibited** - Simple single-line check
6. **Multi-line component detection** - Parenthesis depth tracking

## Why Supplemental Checks?

### Multi-line SAIL Code
Real SAIL code is formatted across multiple lines:
```sail
a!imageField(
  images: a!documentImage(
    document: cons!MY_DOC
  )
)
```

Aurora parser uses regex which struggles with multi-line patterns. Supplemental checks use depth tracking to scan ahead until component closes.

### cardChoiceField Gap
Aurora checklist has the rule, but Aurora parser's Rule 12 matches a different card rule (cardLayout accessibility text). The supplemental check fills this gap.

## Deduplication

Issues are deduplicated by: **line number + rule name**

This prevents:
- Aurora + supplemental checks from double-reporting
- Multiple Aurora rules matching same pattern
- Overlapping rule criteria

## Architecture Flow

```
checkA11yIssues(sailCode, auroraRules)
  ↓
IF auroraRules available:
  AuroraRuleParser.generateChecks() → issues (14 rules)
  runSupplementalChecks() → supplementalIssues (6 checks)
  Merge & deduplicate → return (15 rules covered)
ELSE:
  runHardcodedChecks() → return (15 rules covered)
```

## Test Results

### Expected Violations in test-interface.sail

1. Line 44: textField missing label
2. Line 79: checkboxField missing group label
3. Line 95: image missing altText
4. Line 109: gridField missing label
5. Line 121: grid column missing header
6. Line 136: text heading not using headingField
7. Line 153: sectionLayout missing headingTag
8. Line 166: boxLayout missing headingTag
9. Line 179: progressBarField missing label
10. Line 190: fileUploadField missing label
11. Line 203: cardLayout link with label
12. Line 217: cardChoiceField missing label ← **Fixed with supplemental check**
13. Line 233: cardLayout missing accessibilityText
14. Line 273: dateTimeField prohibited
15. Line 281: required field missing required param

### Detection Status

✅ **All 15 violations properly detected by:**
- Aurora parser (14 rules)
- Supplemental checks (6 rules, including cardChoiceField)
- Deduplication prevents double-reporting

✅ **Fallback provides complete coverage when Aurora unavailable**

## Conclusion

The SAIL A11y Checker has **complete coverage** for all accessibility rules in the test file:

- **Primary path**: Aurora parser + supplemental checks = 15/15 ✅
- **Fallback path**: Hardcoded checks = 15/15 ✅
- **Deduplication**: Prevents double-reporting ✅
- **Multi-line handling**: Depth tracking works correctly ✅
- **cardChoiceField gap**: Fixed with supplemental check ✅

The hybrid architecture successfully combines:
1. Dynamic Aurora parser (auto-updates with guidelines)
2. Supplemental checks (handles multi-line edge cases)
3. Complete fallback (works without Aurora)
