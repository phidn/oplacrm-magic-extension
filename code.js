// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      2026-03-26
// @description  try to take over the world!
// @author       You
// @match        http://localhost:6060/*
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
    const key = name || placeholder;

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

    // Email fields
    if (type === 'email' || key.includes('email')) {
      return 'test' + Math.floor(Math.random() * 1000) + '@example.com';
    }

    // Name-related fields
    if (key.includes('fullname') || key.includes('full name') || key.includes('contact full')) {
      return 'Nguyen Van Test';
    }
    if (key.includes('firstname') || key.includes('first name')) {
      return 'Van Test';
    }
    if (key.includes('lastname') || key.includes('last name')) {
      return 'Nguyen';
    }
    if (key.includes('name') && !key.includes('username')) {
      return 'Test Name ' + Math.floor(Math.random() * 100);
    }

    // External ID
    if (key.includes('externalid') || key.includes('external id') || key.includes('external_id')) {
      return 'EXT-' + Math.floor(1000 + Math.random() * 9000);
    }

    // Job title
    if (key.includes('jobtitle') || key.includes('job title') || key.includes('job_title')) {
      return 'Sales Manager';
    }

    // Address
    if (key.includes('address')) {
      return '123 Le Loi, District 1, HCMC';
    }

    // Link/URL fields
    if (key.includes('link') || key.includes('url') || key.includes('website') || type === 'url') {
      return 'https://example.com';
    }

    // Date fields
    if (key.includes('date') || type === 'date') {
      return null; // Skip date pickers — they need special interaction
    }

    // Default: fill with generic text
    if (type === 'text' || type === '') {
      const label = placeholder || name || 'field';
      return 'Test ' + label.charAt(0).toUpperCase() + label.slice(1);
    }

    return null;
  }

  function fillDrawer(drawer) {
    const body = drawer.querySelector('.ant-drawer-body');
    if (!body) return;

    // Fill all inputs
    const inputs = body.querySelectorAll('input');
    inputs.forEach((input) => {
      // Skip inputs that already have meaningful value (not just prefix like +84)
      if (input.value && input.value !== '' && input.type !== 'tel') return;

      const value = generateValue(input);
      if (value !== null) {
        setNativeValue(input, value);
      }
    });

    // Fill all textareas
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
