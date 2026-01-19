/* 
 * Comprehensive A11y Test Interface
 * This SAIL code intentionally contains accessibility violations
 * to test the Appian A11y Checker extension
 */

{
  a!formLayout(
    label: "Accessibility Test Interface",
    contents: {
      
      /* FORM INPUTS - Missing Labels */
      a!textField(
        value: local!name,
        saveInto: local!name
      ),
      
      a!dropdownField(
        choiceLabels: {"Option 1", "Option 2"},
        choiceValues: {1, 2},
        value: local!choice,
        saveInto: local!choice
      ),
      
      a!dateField(
        value: local!date,
        saveInto: local!date
      ),
      
      a!checkboxField(
        choiceLabels: {"Choice 1", "Choice 2"},
        choiceValues: {1, 2},
        value: local!checks,
        saveInto: local!checks
      ),
      
      a!radioButtonField(
        choiceLabels: {"Radio 1", "Radio 2"},
        choiceValues: {1, 2},
        value: local!radio,
        saveInto: local!radio
      ),
      
      /* IMAGES - Missing Alt Text */
      a!imageField(
        images: a!documentImage(
          document: 123
        )
      ),
      
      a!imageField(
        images: a!webImage(
          source: "https://example.com/image.png"
        )
      ),
      
      /* GRIDS - Missing Label */
      a!gridField(
        data: local!data,
        columns: {
          a!gridColumn(
            value: fv!row.name
          )
        }
      ),
      
      /* HEADINGS - Not using semantic headings */
      a!richTextDisplayField(
        value: a!richTextItem(
          text: "This Should Be a Heading",
          size: "LARGE",
          style: "STRONG"
        )
      ),
      
      /* BUTTONS - Missing accessibility text for icon-only */
      a!buttonArrayLayout(
        buttons: {
          a!buttonWidget(
            icon: "search",
            saveInto: a!save(local!search, true)
          )
        }
      ),
      
      /* LINKS - Missing label */
      a!linkField(
        links: a!dynamicLink(
          saveInto: a!save(local!clicked, true)
        )
      ),
      
      /* SECTION LAYOUT - Expandable without heading tag */
      a!sectionLayout(
        label: "Expandable Section",
        isCollapsible: true,
        contents: {
          a!textField(
            label: "Field in section",
            value: local!field
          )
        }
      ),
      
      /* BOX LAYOUT - Expandable without heading tag */
      a!boxLayout(
        label: "Expandable Box",
        isCollapsible: true,
        contents: {
          a!textField(
            label: "Field in box",
            value: local!boxField
          )
        }
      ),
      
      /* PROGRESS BAR - Missing label */
      a!progressBarField(
        percentage: 50
      ),
      
      /* FILE UPLOAD - Missing label */
      a!fileUploadField(
        value: local!files,
        saveInto: local!files
      ),
      
      /* CARD LAYOUT - Link with label parameter */
      a!cardLayout(
        contents: {
          a!richTextDisplayField(
            value: "Card Content"
          )
        },
        link: a!dynamicLink(
          label: "Click here",
          saveInto: a!save(local!cardClick, true)
        )
      ),
      
      /* RICH TEXT LINK - Embedded without differentiation */
      a!richTextDisplayField(
        value: {
          "This is some text with a ",
          a!richTextItem(
            text: "link",
            link: a!dynamicLink(
              saveInto: a!save(local!link, true)
            ),
            linkStyle: "STANDALONE"
          ),
          " that doesn't stand out."
        }
      ),
      
      /* VALIDATIONS - Missing required parameter */
      a!textField(
        label: "Required Field (not marked)",
        value: local!requiredField,
        saveInto: local!requiredField,
        validations: if(
          isnull(local!requiredField),
          "This field is required",
          null
        )
      ),
      
      /* INSTRUCTIONS - Not using instructions parameter */
      a!textField(
        label: "Phone Number",
        value: local!phone,
        saveInto: local!phone
      ),
      a!richTextDisplayField(
        value: a!richTextItem(
          text: "Format: (555) 555-5555",
          size: "SMALL",
          style: "EMPHASIS"
        )
      ),
      
      /* GRID - Missing column headers */
      a!gridField(
        label: "Data Grid",
        data: local!gridData,
        columns: {
          a!gridColumn(
            value: fv!row.col1
          ),
          a!gridColumn(
            value: fv!row.col2
          )
        }
      ),
      
      /* ICON - Standalone without alt text */
      a!richTextDisplayField(
        value: a!richTextIcon(
          icon: "exclamation-triangle"
        )
      ),
      
      /* CARD CHOICE FIELD - Multiple cards without group label */
      a!cardChoiceField(
        data: {
          {id: 1, name: "Card 1"},
          {id: 2, name: "Card 2"},
          {id: 3, name: "Card 3"}
        },
        cardTemplate: a!cardTemplateTile(
          id: fv!data.id,
          primaryText: fv!data.name
        ),
        value: local!cardChoice,
        saveInto: local!cardChoice
      ),
      
      /* DUPLICATED CONTROLS - Same name without context */
      a!textField(
        label: "Amount",
        value: local!amount1,
        saveInto: local!amount1
      ),
      a!textField(
        label: "Amount",
        value: local!amount2,
        saveInto: local!amount2
      ),
      
      /* CHECKBOX/RADIO - Multiple without group label */
      a!checkboxField(
        choiceLabels: {"Option A", "Option B", "Option C"},
        choiceValues: {1, 2, 3},
        value: local!multiCheck,
        saveInto: local!multiCheck
      ),
      
      /* DATE & TIME COMPONENT - Should not be used */
      a!dateTimeField(
        label: "Date and Time",
        value: local!datetime,
        saveInto: local!datetime
      )
      
    },
    buttons: a!buttonLayout(
      primaryButtons: a!buttonWidget(
        label: "Submit",
        submit: true
      )
    )
  )
}
