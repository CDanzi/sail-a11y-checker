/* 
 * Comprehensive A11y Test Interface
 * This SAIL code intentionally contains accessibility violations
 * to test the SAIL A11y Checker extension
 */
a!localVariables(
  local!text1,
  local!para,
  local!dropdown,
  local!date1,
  local!int,
  local!decimal,
  local!check2,
  local!radio2,
  local!sectionField,
  local!boxField,
  local!files1,
  local!files2,
  local!cardClick,
  local!cardChoice,
  local!datetime,
  local!requiredText,
  local!requiredDrop,
  local!selectedCard: 1,
  a!formLayout(
    titleBar: a!cardLayout(
      padding: "STANDARD",
      showBorder: false,
      contents: {
        a!richTextDisplayField(
          labelPosition: "COLLAPSED",
          value: a!richTextItem(
            text: "Accessibility Test Interface",
            size: "LARGE"
          )
        )
      }
    ),
    backgroundColor: "#FAFAFC",
    contents: {

      /* ===== FORM INPUTS - Missing Labels ===== */
      /* Rule 1: Every input MUST have a label */
      a!textField(
        value: local!text1,
        saveInto: local!text1
      ),

      a!paragraphField(
        value: local!para,
        saveInto: local!para
      ),

      a!dropdownField(
        choiceLabels: {"A", "B"},
        choiceValues: {1, 2},
        placeholder: "Select an option",
        value: local!dropdown,
        saveInto: local!dropdown
      ),

      a!dateField(
        value: local!date1,
        saveInto: local!date1
      ),

      a!integerField(
        value: local!int,
        saveInto: local!int
      ),

      a!floatingPointField(
        value: local!decimal,
        saveInto: local!decimal
      ),

      /* ===== CHECKBOX/RADIO - Missing Group Label ===== */
      /* Rule 2: Multiple checkboxes/radios MUST have group label */
      a!checkboxField(
        choiceLabels: {"Option 1", "Option 2", "Option 3"},
        choiceValues: {1, 2, 3},
        value: local!check2,
        saveInto: local!check2
      ),

      a!radioButtonField(
        choiceLabels: {"Choice A", "Choice B", "Choice C"},
        choiceValues: {1, 2, 3},
        value: local!radio2,
        saveInto: local!radio2
      ),

      /* ===== IMAGES - Missing Alt Text ===== */
      /* Rule 3: Images MUST have altText or accessibilityText */
      a!imageField(
        images: a!documentImage(
          document: 123
        )
      ),

      a!imageField(
        images: a!webImage(
          source: "https://example.com/logo.png"
        )
      ),

      /* ===== GRIDS - Missing Label ===== */
      /* Rule 4: Every grid MUST have a label */
      a!gridField(
        data: {{name: "Item 1"}, {name: "Item 2"}},
        columns: {
          a!gridColumn(
            label: "Name",
            value: fv!row.name
          )
        }
      ),

      /* ===== GRID COLUMNS - Missing Headers ===== */
      /* Rule 5: Grid columns with data MUST have headers */
      a!gridField(
        label: "Grid with Missing Column Headers",
        data: {{col1: "A", col2: "B"}, {col1: "C", col2: "D"}},
        columns: {
          a!gridColumn(
            value: fv!row.col1
          ),
          a!gridColumn(
            value: fv!row.col2
          )
        }
      ),

      /* ===== HEADINGS - Not Using Semantic Headings ===== */
      /* Rule 6: Text headings MUST use a!headingField or labelHeadingTag */
      a!richTextDisplayField(
        value: a!richTextItem(
          text: "This Looks Like a Heading",
          size: "LARGE",
          style: "STRONG"
        )
      ),

      a!richTextDisplayField(
        value: a!richTextItem(
          text: "Another Heading-Like Text",
          size: "LARGE"
        )
      ),

      /* ===== SECTION LAYOUT - Missing labelHeadingTag ===== */
      /* Rule 7: Expandable sections MUST have labelHeadingTag */
      a!sectionLayout(
        label: "Expandable Section Without Heading Tag",
        isCollapsible: true,
        contents: {
          a!textField(
            label: "Field in section",
            value: local!sectionField
          )
        }
      ),

      /* ===== BOX LAYOUT - Missing labelHeadingTag ===== */
      /* Rule 8: Expandable boxes MUST have labelHeadingTag */
      a!boxLayout(
        label: "Expandable Box Without Heading Tag",
        isCollapsible: true,
        contents: {
          a!textField(
            label: "Field in box",
            value: local!boxField
          )
        }
      ),

      /* ===== PROGRESS BAR - Missing Label ===== */
      /* Rule 9: Progress bars MUST have a label */
      a!progressBarField(
        percentage: 75
      ),

      a!progressBarField(
        percentage: 50,
        showWhen: true
      ),

      /* ===== FILE UPLOAD - Missing Label ===== */
      /* Rule 10: File uploads MUST have a label */
      a!fileUploadField(
        value: local!files1,
        saveInto: local!files1
      ),

      a!fileUploadField(
        value: local!files2,
        saveInto: local!files2,
        maxSelections: 5
      ),

      /* ===== CARD LAYOUT - Link with Label Parameter ===== */
      /* Rule 11: Card links MUST NOT have label parameter */
      a!cardLayout(
        contents: {
          a!richTextDisplayField(
            value: "Card with link that has label"
          )
        },
        link: a!dynamicLink(
          label: "Click here",
          saveInto: a!save(local!cardClick, true)
        )
      ),

      /* ===== CARD CHOICE FIELD - Missing Label ===== */
      /* Rule 12: Card choice with multiple cards MUST have label */
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
      
      /* ===== CARD SELECTION - Missing Accessibility Text ===== */
      /* Rule 13: Selected cards using color MUST have accessibilityText: "Selected" */
      a!columnsLayout(
        columns: {
          a!columnLayout(
            contents: {
              a!cardLayout(
                contents: {
                  a!richTextDisplayField(
                    labelPosition: "COLLAPSED",
                    value: "Option A"
                  )
                },
                link: a!dynamicLink(
                  saveInto: a!save(local!selectedCard, 1)
                ),
                style: if(local!selectedCard = 1, "ACCENT", "NONE"),
                marginBelow: "STANDARD"
              )
            }
          ),
          a!columnLayout(
            contents: {
              a!cardLayout(
                contents: {
                  a!richTextDisplayField(
                    labelPosition: "COLLAPSED",
                    value: "Option B"
                  )
                },
                link: a!dynamicLink(
                  saveInto: a!save(local!selectedCard, 2)
                ),
                style: if(local!selectedCard = 2, "ACCENT", "NONE")
              )
            }
          )
        }
      ),
      
      /* ===== DATE & TIME COMPONENT - Not Allowed ===== */
      /* Rule 14: a!dateTimeField MUST NOT be used */
      a!dateTimeField(
        label: "Date and Time (Not Allowed)",
        value: local!datetime,
        saveInto: local!datetime
      ),

      /* ===== VALIDATIONS - Missing Required Parameter ===== */
      /* Rule 15: Required inputs MUST have required: true */
      a!textField(
        label: "Required Field Not Marked",
        value: local!requiredText,
        saveInto: local!requiredText,
        validations: if(
          isnull(local!requiredText),
          "This field is required",
          null
        )
      ),

      a!dropdownField(
        label: "Required Dropdown Not Marked",
        choiceLabels: {"Option 1", "Option 2"},
        choiceValues: {1, 2},
        placeholder: "Choose one",
        value: local!requiredDrop,
        saveInto: local!requiredDrop,
        validations: if(
          isnull(local!requiredDrop),
          "Please select an option",
          null
        )
      )

    },
    buttons: a!buttonLayout(
      primaryButtons: a!buttonWidget(label: "Submit", submit: true)
    )
  )
)