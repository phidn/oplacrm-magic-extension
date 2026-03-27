// ==UserScript==
// @name         OplaGO autofill drawer
// @namespace    http://tampermonkey.net/
// @version      2026-03-26
// @description  try to take over the world!
// @author       You
// @match        http://localhost:6060/*
// @match        https://dev-go.opla-crm.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=undefined.localhost
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  function setNativeValue(el, value) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;
    nativeInputValueSetter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function setNativeTextareaValue(el, value) {
    const nativeTextareaSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    ).set;
    nativeTextareaSetter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Generate fake data based on input name/placeholder/type
  function generateValue(input) {
    const name = (input.name || '').toLowerCase();
    const placeholder = (input.placeholder || '').toLowerCase();
    const type = (input.type || 'text').toLowerCase();
    // Check both name and placeholder for keyword matching
    const combined = (name + ' ' + placeholder).toLowerCase();

    // Skip readonly, disabled, hidden, file inputs
    if (input.readOnly || input.disabled || type === 'hidden' || type === 'file') {
      return null;
    }

    // Skip ant-select search inputs (combobox role)
    if (input.role === 'combobox') {
      return null;
    }

    // Phone/tel fields
    if (type === 'tel') {
      return '+84 9' + Math.floor(10000000 + Math.random() * 90000000);
    }

    // Number/spinbutton fields
    if (type === 'number' || input.role === 'spinbutton') {
      return String(Math.floor(1 + Math.random() * 100));
    }

    // Email fields — check both name and placeholder
    if (type === 'email' || combined.includes('email')) {
      return 'test' + Math.floor(Math.random() * 1000) + '@example.com';
    }

    // Link/URL fields — check both name and placeholder
    if (combined.includes('link') || combined.includes('url') || combined.includes('website') || type === 'url') {
      return 'https://example.com';
    }

    // Name-related fields
    if (combined.includes('fullname') || combined.includes('full name') || combined.includes('contact full')) {
      return 'Nguyen Van Test';
    }
    if (combined.includes('firstname') || combined.includes('first name')) {
      return 'Van Test';
    }
    if (combined.includes('lastname') || combined.includes('last name')) {
      return 'Nguyen';
    }
    if (combined.includes('name') && !combined.includes('username')) {
      return 'Test Name ' + Math.floor(Math.random() * 100);
    }

    // External ID
    if (combined.includes('externalid') || combined.includes('external id') || combined.includes('external_id')) {
      return 'EXT-' + Math.floor(1000 + Math.random() * 9000);
    }

    // Job title
    if (combined.includes('jobtitle') || combined.includes('job title') || combined.includes('job_title')) {
      return 'Sales Manager';
    }

    // Address
    if (combined.includes('address')) {
      return '123 Le Loi, District 1, HCMC';
    }

    // Date fields
    if (combined.includes('date') || type === 'date') {
      return null; // Skip date pickers — they need special interaction
    }

    // Default: fill with generic text
    if (type === 'text' || type === '') {
      const label = placeholder || name || 'field';
      return 'Test ' + label.charAt(0).toUpperCase() + label.slice(1);
    }

    return null;
  }

  // Click an ant-picker to open calendar, then click "Today" button
  function fillDatePicker(pickerWrapper) {
    return new Promise((resolve) => {
      const input = pickerWrapper.querySelector('input');
      if (!input) return resolve();

      // Skip if already has a value
      if (input.value && input.value !== '') return resolve();

      // Click the input to open the date picker popup
      input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      input.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      input.click();

      setTimeout(() => {
        // Find the open date picker dropdown (rendered as portal in body)
        const dropdowns = document.querySelectorAll(
          '.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)'
        );
        const dropdown = dropdowns[dropdowns.length - 1];

        if (dropdown) {
          // Try clicking "Today" button first
          const todayBtn = dropdown.querySelector('.ant-picker-now-btn');
          if (todayBtn) {
            todayBtn.click();
          } else {
            // Fallback: click the today cell
            const todayCell = dropdown.querySelector('.ant-picker-cell-today .ant-picker-cell-inner');
            if (todayCell) {
              todayCell.click();
            }
          }
        }
        resolve();
      }, 300);
    });
  }

  // Click an ant-select to open dropdown, then click the first option
  function fillSelect(selectWrapper) {
    return new Promise((resolve) => {
      // Click the selector to open the dropdown
      const selector = selectWrapper.querySelector('.ant-select-selector');
      if (!selector) return resolve();

      selector.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      // Wait for dropdown to appear, then click the first item
      setTimeout(() => {
        // Ant Design renders dropdowns in a portal at document.body level
        // Find the dropdown that just opened (last one in DOM)
        const dropdowns = document.querySelectorAll(
          '.ant-select-dropdown:not(.ant-select-dropdown-hidden)'
        );
        const dropdown = dropdowns[dropdowns.length - 1];

        if (dropdown) {
          const firstOption = dropdown.querySelector(
            '.ant-select-item-option:not(.ant-select-item-option-disabled)'
          );
          if (firstOption) {
            firstOption.click();
          }
        }
        resolve();
      }, 300);
    });
  }

  // Simulate a real user click with full event sequence
  function simulateRealClick(el) {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const opts = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y };

    el.dispatchEvent(new PointerEvent('pointerdown', opts));
    el.dispatchEvent(new MouseEvent('mousedown', opts));
    el.dispatchEvent(new PointerEvent('pointerup', opts));
    el.dispatchEvent(new MouseEvent('mouseup', opts));
    el.dispatchEvent(new MouseEvent('click', opts));
  }

  // Walk up React fiber tree from a DOM element to find a card component's
  // click callback (onClickAccountCard, onClickContactCard, etc.) and its item prop.
  function findCardCallback(domElement) {
    const fiberKey = Object.keys(domElement).find(k =>
      k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')
    );
    if (!fiberKey) return null;

    let fiber = domElement[fiberKey];
    let depth = 0;
    while (fiber && depth < 50) {
      const props = fiber.memoizedProps;
      if (props && props.item) {
        const callback =
          props.onClickAccountCard ||
          props.onClickContactCard ||
          props.onClickOpportunityCard ||
          props.onClickProductCard ||
          props.onClickOrderCard;
        if (callback) {
          return { callback, item: props.item };
        }
      }
      fiber = fiber.return;
      depth++;
    }
    return null;
  }

  // Click a lookup/relation field (readonly input) to open selection drawer,
  // wait for the list to load, then select the first item via React fiber.
  function fillLookupField(readonlyInput) {
    return new Promise((resolve) => {
      const drawersBefore = document.querySelectorAll('.ant-drawer-open').length;
      console.log('Lookup: drawers before click:', drawersBefore);

      simulateRealClick(readonlyInput);

      let attempts = 0;
      const maxAttempts = 25;

      const trySelectItem = () => {
        attempts++;

        const allDrawers = document.querySelectorAll('.ant-drawer-open');
        console.log('Lookup: attempt', attempts, 'drawers now:', allDrawers.length);

        if (allDrawers.length <= drawersBefore) {
          if (attempts < maxAttempts) {
            setTimeout(trySelectItem, 400);
          } else {
            console.log('Lookup: no new drawer opened, skipping');
            resolve();
          }
          return;
        }

        const selectionDrawer = allDrawers[allDrawers.length - 1];
        const drawerBody = selectionDrawer.querySelector('.ant-drawer-body');
        if (!drawerBody) {
          if (attempts < maxAttempts) setTimeout(trySelectItem, 400);
          else resolve();
          return;
        }

        // Check if still loading
        const isLoading = drawerBody.querySelector('.ant-spin-spinning');
        if (isLoading && attempts < maxAttempts) {
          console.log('Lookup: still loading...');
          setTimeout(trySelectItem, 400);
          return;
        }

        // Find the first card in the list
        const card = drawerBody.querySelector('.ant-card');
        if (!card) {
          if (attempts < maxAttempts) {
            console.log('Lookup: no cards yet, retrying...');
            setTimeout(trySelectItem, 400);
          } else {
            console.log('Lookup: no items found, closing drawer');
            const closeBtn = selectionDrawer.querySelector('.ant-drawer-close');
            if (closeBtn) simulateRealClick(closeBtn);
            resolve();
          }
          return;
        }

        // Remember the selection drawer count before calling callback
        const drawersBeforeSelect = document.querySelectorAll('.ant-drawer-open').length;

        // Use React fiber to find the card's click callback and item data
        const result = findCardCallback(card);
        if (result) {
          console.log('Lookup: calling React callback for item:', result.item?.fullName || result.item?.shortName || result.item?.name || result.item?.id);
          result.callback(result.item);
        } else {
          console.log('Lookup: no React callback found, trying DOM click');
          simulateRealClick(card);
        }

        // Wait, then check if selection drawer is still open (multi-select needs Save button)
        setTimeout(() => {
          const drawersAfterSelect = document.querySelectorAll('.ant-drawer-open').length;

          // If drawer closed (single select like Account), we're done
          if (drawersAfterSelect < drawersBeforeSelect) {
            console.log('Lookup: drawer closed after selection (single select)');
            resolve();
            return;
          }

          // Drawer still open = multi-select (Contact). Click Save on the SELECTION drawer only.
          const footer = selectionDrawer.querySelector('.ant-drawer-footer');
          if (footer) {
            const saveBtn = footer.querySelector('button.ant-btn-primary:not([disabled])');
            if (saveBtn) {
              console.log('Lookup: clicking Save button on selection drawer');
              simulateRealClick(saveBtn);
            }
          }
          resolve();
        }, 500);
      };

      setTimeout(trySelectItem, 800);
    });
  }

  async function fillDrawer(drawer) {
    const body = drawer.querySelector('.ant-drawer-body');
    if (!body) return;

    // 0. Fill lookup/relation fields first (Account, Contact, Opportunity, Product, etc.)
    //    Two types of lookup fields:
    //    a) <Input readOnly onClick={handleInputClick}> — Account, Opportunity (single select)
    //    b) <Select mode="multiple" open={false} onClick={handleInputClick}> — Contact (multi-select)
    //    Order matters: Account first (input[readonly]), then Contact (ant-select-multiple).

    // 0a. Single-select lookup fields (readonly inputs)
    const lookupInputs = body.querySelectorAll('input[readonly]');
    for (const input of lookupInputs) {
      if (input.value && input.value.trim() !== '') continue;
      if (input.closest('.ant-select')) continue;
      if (input.offsetParent === null) continue;

      await fillLookupField(input);
      await new Promise((r) => setTimeout(r, 500));
    }

    // 0b. Multi-select lookup fields (Select with mode="multiple" that opens a drawer)
    //     These are Contact fields: ant-select-multiple with onClick that opens a drawer.
    const multiSelects = body.querySelectorAll('.ant-select-multiple:not(.ant-select-disabled)');
    for (const select of multiSelects) {
      // Skip if already has values selected
      const hasValues = select.querySelector('.ant-select-selection-item');
      if (hasValues) continue;
      if (select.offsetParent === null) continue;

      // Click the selector to trigger handleInputClick → opens drawer
      const selector = select.querySelector('.ant-select-selector');
      if (!selector) continue;

      console.log('Lookup multi: clicking ant-select-multiple selector');
      await fillLookupField(selector);
      await new Promise((r) => setTimeout(r, 500));
    }

    // 1. Fill all ant-select dropdowns (click to open, pick first item)
    const selects = body.querySelectorAll(
      '.ant-select:not(.ant-select-disabled):not(.ant-select-open):not(.ant-select-multiple)'
    );
    for (const select of selects) {
      // Skip selects that already have a value selected
      const hasValue = select.querySelector('.ant-select-selection-item');
      if (hasValue) continue;

      // Skip phone country code selects (they already have a default)
      const searchInput = select.querySelector('input[aria-label="Phone number country"]');
      if (searchInput) continue;

      await fillSelect(select);
      // Small delay between selects to avoid overlapping dropdowns
      await new Promise((r) => setTimeout(r, 200));
    }

    // 1b. Wait for dependent selects to become enabled (e.g., State/Province after Country)
    await new Promise((r) => setTimeout(r, 500));
    const newSelects = body.querySelectorAll(
      '.ant-select:not(.ant-select-disabled):not(.ant-select-open):not(.ant-select-multiple)'
    );
    for (const select of newSelects) {
      const hasValue = select.querySelector('.ant-select-selection-item');
      if (hasValue) continue;
      const searchInput = select.querySelector('input[aria-label="Phone number country"]');
      if (searchInput) continue;
      await fillSelect(select);
      await new Promise((r) => setTimeout(r, 200));
    }

    // 2. Fill all date pickers (click to open, then click "Today")
    const datePickers = body.querySelectorAll('.ant-picker:not(.ant-picker-disabled)');
    for (const picker of datePickers) {
      await fillDatePicker(picker);
      await new Promise((r) => setTimeout(r, 200));
    }

    // 3. Fill all text/tel/number inputs
    const inputs = body.querySelectorAll('input');
    inputs.forEach((input) => {
      // Skip readonly inputs (lookup fields already handled)
      if (input.readOnly) return;
      // Skip inputs that already have meaningful value (not just prefix like +84)
      if (input.value && input.value !== '' && input.type !== 'tel') return;

      const value = generateValue(input);
      if (value !== null) {
        setNativeValue(input, value);
      }
    });

    // 4. Fill all textareas
    const textareas = body.querySelectorAll('textarea');
    textareas.forEach((textarea) => {
      if (textarea.value && textarea.value !== '') return;
      if (textarea.readOnly || textarea.disabled) return;
      const placeholder = textarea.placeholder || 'content';
      setNativeTextareaValue(textarea, 'Test ' + placeholder);
    });

    console.log('Magic fill completed for drawer!');
  }

  // Watch for any drawer to appear, then inject the magic button
  const observer = new MutationObserver(() => {
    // Find all open ant-design drawers
    const drawers = document.querySelectorAll('.ant-drawer-content');

    drawers.forEach((drawer) => {
      // Skip if button already added
      if (drawer.querySelector('.magic-fill-btn')) return;

      const header = drawer.querySelector('.ant-drawer-header');
      if (!header) return;

      const btn = document.createElement('button');
      btn.className = 'magic-fill-btn';
      btn.textContent = 'Magic';
      btn.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 6px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        margin-left: 12px;
      `;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fillDrawer(drawer);
      });

      const title = header.querySelector('.ant-drawer-title');
      if (title) {
        title.style.display = 'flex';
        title.style.alignItems = 'center';
        title.appendChild(btn);
      } else {
        header.appendChild(btn);
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
