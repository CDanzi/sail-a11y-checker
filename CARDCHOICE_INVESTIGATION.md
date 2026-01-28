# cardChoiceField Investigation Summary

## Issue
Rule 12 test case (line 217 in test-interface.sail) for `cardChoiceField` without label was not being detected by the Aurora parser.

## Root Cause
The Aurora Design System accessibility checklist has TWO separate rules for card-related components:

1. **Card Choice Field / Card Group Layout** (Rule in checklist)
   - Component: `a!cardChoiceField` or `a!cardGroupLayout`
   - Requirement: MUST have a `label` parameter when displaying multiple cards
   - WCAG Level: AA
   - Category: "Card Choice Field" / "Card Group Layout"

2. **Card Layout Selection States** (Rule 12 in Aurora parser)
   - Component: `a!cardLayout`
   - Requirement: Selected cards MUST have `accessibilityText` parameter
   - WCAG Level: A
   - Category: "Cards"

The Aurora parser's Rule 12 was matching the SECOND rule (cardLayout accessibility text), not the FIRST rule (cardChoiceField label).

## Solution
Added `cardChoiceField` label check to **supplemental checks** in `content.js`:

```javascript
// Check for cardChoiceField with multiple cards missing label
lines.forEach((line, idx) => {
  if (line.trim().match(/^a!cardChoiceField\s*\(/)) {
    let hasLabel = false;
    let hasData = false;
    let depth = 0;
    for (let i = idx; i < Math.min(idx + 20, lines.length); i++) {
      const l = lines[i];
      depth += (l.match(/\(/g) || []).length - (l.match(/\)/g) || []).length;
      if (l.includes('label:')) hasLabel = true;
      if (l.includes('data:')) hasData = true;
      if (depth <= 0 && i > idx) break;
    }
    if (hasData && !hasLabel) {
      issues.push({
        rule: 'cardChoiceField missing label',
        message: 'Card choice fields with more than one card MUST have a label.',
        code: line.trim().substring(0, 80),
        line: idx + 1,
        severity: 'warning',
        wcagLevel: 'AA',
        wcagCriteria: '1.3.1'
      });
    }
  }
});
```

## Why Supplemental Check?
- Aurora parser uses text-based matching on rule criteria
- The cardChoiceField rule criteria doesn't have unique keywords that distinguish it from other card rules
- Multi-line SAIL code requires depth tracking to find parameters
- Supplemental checks are designed for these edge cases

## Testing
Verified with test script:
```
Found issues: 1
Line 217: cardChoiceField missing label
  Code: a!cardChoiceField(
```

## Files Modified
- `content.js` - Added cardChoiceField check to `runSupplementalChecks()`
- `ARCHITECTURE.md` - Updated documentation

## Commit
```
commit 24c7366
Add cardChoiceField label check to supplemental checks
```

## Current Supplemental Checks (5 total)
1. imageField/image missing altText
2. fileUploadField missing label
3. section/boxLayout missing headingTag
4. cardChoiceField missing label ← NEW
5. Prohibited dateTimeField

## Deduplication
Issues are deduplicated by line number + rule name, so if Aurora parser ever adds this check, it won't create duplicates.
