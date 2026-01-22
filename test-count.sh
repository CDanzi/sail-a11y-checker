#!/bin/bash

echo "=== COUNTING EXPECTED ISSUES IN test-interface.sail ==="
echo ""

# Form fields without labels
echo "Form fields (should have labels):"
grep -c "a!textField\|a!paragraphField\|a!integerField\|a!decimalField\|a!dateField\|a!dropdownField" test-interface.sail

# Checkbox/radio without choiceLabels  
echo "Checkbox/Radio fields (should have choiceLabels):"
grep -c "a!checkboxField\|a!radioButtonField" test-interface.sail

# Images without altText
echo "Images (should have altText):"
grep -c "a!imageField" test-interface.sail

# Grids
echo "Grids (should have labels):"
grep -c "a!gridField" test-interface.sail

# Sections/boxes
echo "Sections/Boxes (should have headingTag):"
grep -c "a!sectionLayout\|a!boxLayout" test-interface.sail

# Progress bars
echo "Progress bars (should have labels):"
grep -c "a!progressBarField" test-interface.sail

# File uploads
echo "File uploads (should have labels):"
grep -c "a!fileUploadField" test-interface.sail

# Cards
echo "Cards (total):"
grep -c "a!cardLayout" test-interface.sail

# Prohibited dateTimeField
echo "Prohibited dateTimeField:"
grep -c "a!dateTimeField" test-interface.sail

