# OplaCRM Magic Extension

A Tampermonkey userscript that adds a **Magic** button to every Ant Design drawer in OplaCRM, auto-filling all form fields with realistic test data.

## Features

- Auto-detects any Ant Design drawer that opens
- Injects a **Magic** button in the drawer header
- Fills all supported field types in one click:
  - **Text inputs** - smart values based on field name/placeholder (name, address, job title, etc.)
  - **Email fields** - generates `test123@example.com`
  - **Link/URL fields** - fills with `https://example.com`
  - **Phone fields** - random Vietnamese phone numbers
  - **Number fields** - random numbers
  - **Select dropdowns** - clicks to open, selects the first option
  - **Date pickers** - clicks to open, selects "Today"
  - **Textareas** - fills with test content
- Handles dependent selects (e.g., State/Province enables after Country is selected)
- Skips readonly, disabled, and pre-filled fields

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Create a new userscript
3. Copy the contents of `code.js` into the editor
4. Save and enable the script

## Matched URLs

- `http://localhost:6060/*`
- `https://dev-go.opla-crm.com/*`

## Usage

1. Open any page in OplaCRM
2. Open a drawer (e.g., "Add Partner Contact")
3. Click the **Magic** button in the drawer header
4. All form fields will be auto-filled with test data
