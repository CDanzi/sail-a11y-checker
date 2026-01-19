# WCAG Severity Mapping

This extension categorizes accessibility issues based on WCAG (Web Content Accessibility Guidelines) conformance levels.

## Severity Levels

### Error (WCAG Level A) - Critical Issues
These issues make content completely inaccessible to users with disabilities. **Must be fixed** to meet minimum accessibility standards.

- **Form Input Missing Label** - textField, dropdownField, dateField, integerField, decimalField, paragraphField, floatingPointField, checkboxField, radioButtonField
- **Missing Choice Labels** - checkboxField, radioButtonField without choiceLabels
- **Group Missing Label** - Multiple checkboxes or radio buttons without a group label
- **Image Missing Alt Text** - imageField without altText or accessibilityText
- **Grid Missing Label** - gridField without label
- **Section/Box Layout Missing Heading Tag** - Collapsible sections without labelHeadingTag
- **Progress Bar Missing Label** - progressBarField without label
- **File Upload Missing Label** - fileUploadField without label
- **Card Link Should Not Have Label** - cardLayout link with label parameter (creates duplicate announcements)
- **Selected Card Missing Accessibility Text** - Cards using color/styling to indicate selection without accessibilityText: "Selected"
- **Date & Time Component Not Allowed** - dateTimeField usage (not accessible)
- **Link Missing Label** - linkField without label or accessibilityText
- **Button Missing Label** - buttonWidget without label or accessibilityText
- **Empty Label** - Any component with label: ""

### Warning (WCAG Level AA) - Usability Issues
These issues make content harder to use but not completely inaccessible. **Should be fixed** for better accessibility.

- **Grid Column Missing Header** - gridColumn without label
- **Text Should Use Semantic Heading** - Large/bold text that should use headingField
- **Card Choice/Group Missing Label** - Multiple cards without a group label
- **Validation Missing Required Parameter** - Form fields with validations but no required: true
- **Icon Missing Accessibility Text** - iconIndicator without accessibilityText or caption
- **Chart Missing Accessibility Text** - Chart components without accessibilityText

## WCAG Conformance Levels

- **Level A**: Minimum level of conformance. Issues at this level create complete barriers to access.
- **Level AA**: Mid-range level of conformance. Issues at this level create significant barriers but may have workarounds.
- **Level AAA**: Highest level of conformance (not currently used in this extension).

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Aurora Design System Accessibility Checklist](https://appian-design.github.io/aurora/accessibility/checklist/)
