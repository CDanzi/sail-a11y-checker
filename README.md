# SAIL A11y Checker

A Chrome extension that scans Appian SAIL code for accessibility issues based on the Aurora Design System guidelines and WCAG standards.

## Features

- 🔍 Scans SAIL code directly in the Appian Interface Designer
- ✅ Checks against Aurora Design System accessibility checklist
- 🎯 WCAG-based severity levels (Level A errors, Level AA warnings)
- 📊 Detailed issue reports with line numbers and code snippets
- 🔄 Automatic daily updates of Aurora accessibility rules

## Installation

### Option 1: Install from Chrome Web Store
*Not currently available*

### Option 2: Install in Opera (For Testing)

Since the extension requires InfoSec approval before Chrome Web Store publication, you can test it in Opera browser:

1. **Download Opera Browser**
   - Download from [opera.com](https://www.opera.com/) if you don't have it installed

2. **Download the Extension**
   - Clone this repository or download as ZIP:
     ```bash
     git clone https://github.com/CDanzi/sail-a11y-checker.git
     ```
   - If downloaded as ZIP, extract the files to a folder

3. **Open Opera Extensions Page**
   - Open Opera and navigate to `opera://extensions/`
   - Or click the Opera menu → Extensions → Extensions

4. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

5. **Load the Extension**
   - Click "Load unpacked"
   - Select the folder containing the extension files (where `manifest.json` is located)
   - The extension should now appear in your extensions list

6. **Pin the Extension (Optional)**
   - Click the extensions icon in Opera's toolbar
   - Find "Appian A11y Checker" and click the pin icon
   - The extension icon will now appear in your toolbar

### Option 3: Install as Unpacked Extension in Chrome (Developer Mode)

### Option 3: Install as Unpacked Extension in Chrome (Developer Mode)

For Chrome users with appropriate permissions:

1. **Download the Extension**
   - Clone this repository or download as ZIP:
     ```bash
     git clone https://github.com/CDanzi/sail-a11y-checker.git
     ```
   - If downloaded as ZIP, extract the files to a folder

2. **Open Chrome Extensions Page**
   - Open Chrome and navigate to `chrome://extensions/`
   - Or click the three-dot menu → Extensions → Manage Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the folder containing the extension files (where `manifest.json` is located)
   - The extension should now appear in your extensions list

5. **Pin the Extension (Optional)**
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "Appian A11y Checker" and click the pin icon
   - The extension icon will now appear in your toolbar

## How to Use

### Running Your First Scan

1. **Open Appian Interface Designer**
   - Navigate to any Appian interface in the expression editor

2. **Select All SAIL Code**
   - Click in the code editor
   - Press `Cmd+A` (Mac) or `Ctrl+A` (Windows/Linux) to select all code
   - This ensures the scanner can read every line of your interface

3. **Run the Extension**
   - Click the Appian A11y Checker icon in your Chrome toolbar
   - Click "Start Accessibility Scan"

4. **Review Results**
   - The extension will display:
     - Number of errors (WCAG Level A - must fix)
     - Number of warnings (WCAG Level AA - should fix)
     - Detailed list of issues with line numbers and code snippets
     - Links to Aurora Design System documentation

### Re-scanning After Changes

1. Select all SAIL code again (`Cmd+A` or `Ctrl+A`)
2. Click the extension icon and run the scan again
3. The scanner will detect your latest changes

> **Why select all code?** The Appian Interface Designer only loads visible lines into memory. Selecting all code forces the editor to load every line, ensuring a complete scan.

## Understanding Results

### Severity Levels

**🔴 Errors (WCAG Level A)**
- Critical issues that make content completely inaccessible
- Must be fixed to meet minimum accessibility standards
- Examples: Missing labels on form inputs, missing alt text on images

**⚠️ Warnings (WCAG Level AA)**
- Issues that make content harder to use but not completely inaccessible
- Should be fixed for better accessibility
- Examples: Missing grid column headers, not using semantic headings

### Issue Details

Each issue includes:
- **Rule Name**: What accessibility requirement was violated
- **Message**: Description of the issue from Aurora guidelines
- **Code Snippet**: The problematic SAIL code
- **Line Number**: Where the issue occurs in your interface
- **WCAG Level**: Severity classification (A or AA)
- **Learn More**: Link to Aurora Design System documentation

## Checked Accessibility Rules

The extension checks for 15+ accessibility issues including:

- Missing labels on form inputs (textField, dropdownField, etc.)
- Missing choice labels on checkboxes and radio buttons
- Missing group labels for multiple choices
- Missing alt text on images
- Missing labels on grids and grid columns
- Not using semantic headings
- Missing heading tags on collapsible sections
- Missing labels on progress bars and file uploads
- Card selection states without accessibility text
- Prohibited components (dateTimeField)
- And more...

See [WCAG_SEVERITY_MAPPING.md](WCAG_SEVERITY_MAPPING.md) for the complete list.

## Refreshing Aurora Rules

The extension automatically fetches the latest Aurora Design System accessibility checklist daily. To manually refresh:

1. Open the extension popup
2. Click "Refresh Aurora Rules" at the bottom
3. Wait for confirmation that rules have been updated

## Troubleshooting

### Extension Not Detecting Code

**Problem**: Extension shows "No SAIL code detected"

**Solutions**:
- Make sure you're on an Appian interface page (URL contains "appian")
- Select all code in the editor (`Cmd+A` or `Ctrl+A`)
- Refresh the Appian page and try again
- Check that you're in the expression editor, not the UI view

### Fallback Rules Warning

**Problem**: Extension shows "Using fallback rules - Aurora Design System guidance could not be loaded"

**Solutions**:
- Click "Refresh Aurora Rules" to manually fetch the latest rules
- Check your internet connection
- The extension will still work using built-in accessibility best practices

### Extension Not Loading

**Problem**: Extension doesn't appear or won't load

**Solutions**:
- Verify Developer Mode is enabled in `chrome://extensions/`
- Check that all extension files are present in the folder
- Try removing and re-adding the extension
- Check Chrome console for errors (right-click extension → Inspect popup)

## Development

### Testing the Extension

Use the included test files to verify the extension is working:

- `test-interface.sail` - Basic test cases
- `test-interface-complete.sail` - Comprehensive test with 15+ violations

Copy the contents into an Appian interface and run the scanner to see detected issues.

### Project Structure

```
sail-a11y-checker/
├── manifest.json           # Extension configuration
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic
├── content.js             # Main scanning logic
├── background.js          # Background service worker
├── styles.css             # Popup and results styling
├── results.html           # Detailed results page
├── results.js             # Results page logic
├── icons/                 # Extension icons
├── test-interface.sail    # Basic test file
└── test-interface-complete.sail  # Comprehensive test file
```

## Resources

- [Aurora Design System Accessibility Checklist](https://appian-design.github.io/aurora/accessibility/checklist/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Appian Documentation](https://docs.appian.com/)

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- Open an issue on [GitHub](https://github.com/CDanzi/sail-a11y-checker/issues)
- Check the [Aurora Design System documentation](https://appian-design.github.io/aurora/)

---

**Note**: This extension is not officially affiliated with Appian Corporation. It's a community tool to help developers build more accessible Appian interfaces.
