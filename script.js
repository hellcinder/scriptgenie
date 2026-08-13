// Script Genie - Professional Screenplay Editor
// Complete working version with all methods implemented

const ScriptGenie = {
    // Application state
    currentTheme: 'light',
    presets: ['INT. HOUSE - DAY', 'EXT. STREET - NIGHT', 'JOHN', 'MARY', 'FADE IN:', 'FADE OUT:', 'CUT TO:'],
    characters: new Set(),
    locations: new Set(),
    timerInterval: null,
    timerSeconds: 0,
    timerRunning: false,

    // Autocomplete state
    autoCompleteOpen: false,
    autoCompleteIndex: -1,
    autoCompleteLineStart: 0,
    autoCompleteItems: [],

    // Initialize the application
    init() {
        console.log('ScriptGenie initializing...');
        
        // Wait for DOM to be fully ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }
    },

    setupApp() {
        console.log('Setting up ScriptGenie app...');
        
        // Load saved data
        this.loadTheme();
        this.loadPresets();
        this.loadScript();
        this.updatePreview();
        
        // Set up all event listeners
        this.initializeEventListeners();
        
        // Focus on editor
        const editor = document.getElementById('scriptEditor');
        if (editor) {
            editor.focus();
            console.log('Editor focused');
        }
        
        // Auto-save every 30 seconds
        setInterval(() => this.saveScript(), 30000);
        
        console.log('ScriptGenie initialized successfully!');
    },

    // Set up all event listeners
    initializeEventListeners() {
        console.log('Setting up event listeners...');

        // Header buttons
        const themeBtn = document.getElementById('themeToggle');
        const exportBtn = document.getElementById('exportBtn');
        const timerBtn = document.getElementById('timerBtn');

        if (themeBtn) {
            themeBtn.addEventListener('click', (e) => {
                console.log('Theme button clicked');
                this.toggleTheme();
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', (e) => {
                console.log('Export button clicked');
                this.exportToPDF();
            });
        }

        if (timerBtn) {
            timerBtn.addEventListener('click', (e) => {
                console.log('Timer button clicked');
                this.showTimer();
            });
        }

        // Quick action buttons
        const actionBtns = document.querySelectorAll('.action-btn');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const elementType = e.target.getAttribute('data-element');
                console.log('Action button clicked:', elementType);
                this.insertElement(elementType);
            });
        });

        // Add preset button
        const addPresetBtn = document.getElementById('addPresetBtn');
        if (addPresetBtn) {
            addPresetBtn.addEventListener('click', (e) => {
                console.log('Add preset button clicked');
                this.addPreset();
            });
        }

        // Timer controls
        const startTimerBtn = document.getElementById('startTimerBtn');
        const pauseTimerBtn = document.getElementById('pauseTimerBtn');
        const resetTimerBtn = document.getElementById('resetTimerBtn');
        const closeTimerBtn = document.getElementById('closeTimerBtn');

        if (startTimerBtn) startTimerBtn.addEventListener('click', () => this.startTimer());
        if (pauseTimerBtn) pauseTimerBtn.addEventListener('click', () => this.pauseTimer());
        if (resetTimerBtn) resetTimerBtn.addEventListener('click', () => this.resetTimer());
        if (closeTimerBtn) closeTimerBtn.addEventListener('click', () => this.closeTimer());

        // Preset list event delegation
        const presetsList = document.getElementById('presetsList');
        if (presetsList) {
            presetsList.addEventListener('click', (e) => {
                if (e.target.classList.contains('preset-delete')) {
                    e.stopPropagation();
                    const preset = e.target.getAttribute('data-delete');
                    this.deletePreset(preset);
                } else if (e.target.classList.contains('preset-item') || e.target.closest('.preset-item')) {
                    const presetItem = e.target.classList.contains('preset-item') ? e.target : e.target.closest('.preset-item');
                    const preset = presetItem.getAttribute('data-preset');
                    if (preset) this.insertPreset(preset);
                }
            });
        }

        // Editor and form events
        const scriptTitle = document.getElementById('scriptTitle');
        const authorName = document.getElementById('authorName');
        const contactInfo = document.getElementById('contactInfo');
        const scriptEditor = document.getElementById('scriptEditor');
        const timerMinutes = document.getElementById('timerMinutes');

        if (scriptTitle) scriptTitle.addEventListener('input', () => this.updatePreview());
        if (authorName) authorName.addEventListener('input', () => this.updatePreview());
        if (contactInfo) contactInfo.addEventListener('input', () => this.updatePreview());
        
        if (scriptEditor) {
            scriptEditor.addEventListener('input', () => {
                this.updatePreview();
                clearTimeout(window.autoSaveTimeout);
                window.autoSaveTimeout = setTimeout(() => this.saveScript(), 2000);
            });
            
            scriptEditor.addEventListener('keydown', (e) => this.handleKeyDown(e));
            scriptEditor.addEventListener('keyup', (e) => this.handleAutoComplete(e));
            // The popup is positioned against the caret, so any scroll invalidates it.
            scriptEditor.addEventListener('scroll', () => this.hideAutoComplete());
            scriptEditor.addEventListener('blur', () => this.hideAutoComplete());
        }

        window.addEventListener('resize', () => this.hideAutoComplete());
        window.addEventListener('scroll', () => this.hideAutoComplete(), true);

        if (timerMinutes) {
            timerMinutes.addEventListener('input', () => {
                if (!this.timerRunning) {
                    this.resetTimer();
                }
            });
        }

        // Global event listeners
        window.addEventListener('beforeunload', () => this.saveScript());

        // Click outside to hide autocomplete
        document.addEventListener('click', (event) => {
            if (!event.target.closest('#autocompletePopup') && !event.target.closest('#scriptEditor')) {
                this.hideAutoComplete();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                this.saveScript();
                this.showSaveConfirmation();
            }
            
            if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
                event.preventDefault();
                this.exportToPDF();
            }
            
            if ((event.ctrlKey || event.metaKey) && event.key === 't') {
                event.preventDefault();
                this.toggleTheme();
            }
        });

        console.log('Event listeners set up successfully!');
    },

    // Theme management
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', this.currentTheme);
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
        }
        this.writeStorage('scriptGenie_theme', this.currentTheme);
        console.log('Theme toggled to:', this.currentTheme);
    },

    loadTheme() {
        const savedTheme = localStorage.getItem('scriptGenie_theme');
        if (savedTheme) {
            this.currentTheme = savedTheme;
            document.body.setAttribute('data-theme', this.currentTheme);
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
            }
        }
    },

    // Fountain parser
    parseFountain(text) {
        const lines = text.split('\n');
        const parsed = [];

        // Rebuild the autocomplete vocabulary from scratch on every parse, otherwise
        // half-typed names ("JO", "JOH") accumulate forever and pollute suggestions.
        this.characters = new Set();
        this.locations = new Set();

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            let type = 'action';

            // Skip empty lines but track them
            if (trimmed === '') {
                parsed.push({ type: 'empty', content: '' });
                continue;
            }

            // In Fountain a blank line always closes a dialogue block, so only the
            // element immediately above this one can continue it.
            const previous = parsed[parsed.length - 1];
            const previousType = previous ? previous.type : 'empty';
            const inDialogueBlock = previousType === 'character' ||
                                    previousType === 'parenthetical' ||
                                    previousType === 'dialogue';

            if (this.isSceneHeading(trimmed)) {
                type = 'scene-heading';

                // Extract location for autocomplete
                const locationMatch = trimmed.match(/^(?:INT\.\/EXT\.|I\/E\.|INT\.|EXT\.|EST\.)\s+([^-]+)/i);
                if (locationMatch) {
                    this.locations.add(locationMatch[1].trim().toUpperCase());
                }
            }
            else if (this.isTransition(trimmed)) {
                type = 'transition';
            }
            else if (this.isParenthetical(trimmed)) {
                type = 'parenthetical';
            }
            else if (this.isCharacterName(line, lines, i)) {
                type = 'character';
                this.characters.add(this.characterName(trimmed));
            }
            else if (inDialogueBlock) {
                type = 'dialogue';
            }

            parsed.push({ type, content: line });
        }

        return parsed;
    },

    // "FADE IN:" and "FADE OUT:" are kept here (rather than with transitions) so they
    // render flush left, the way they appear on the page.
    isSceneHeading(trimmed) {
        return /^(?:INT\.\/EXT\.|I\/E\.|INT\.|EXT\.|EST\.|FADE IN:|FADE OUT:)/i.test(trimmed);
    },

    isTransition(trimmed) {
        if (/^(?:CUT TO:|DISSOLVE TO:|FADE TO:|SMASH CUT TO:|MATCH CUT TO:|JUMP CUT TO:|MATCH CUT:|JUMP CUT:|SMASH CUT:|CUT TO BLACK:|FADE TO BLACK:)$/i.test(trimmed)) {
            return true;
        }
        // Generic uppercase transitions, e.g. "SLOWLY DISSOLVE TO:"
        return /^[A-Z][A-Z0-9\s'&-]*\bTO:$/.test(trimmed);
    },

    isParenthetical(trimmed) {
        return /^\([^)]*\)$/.test(trimmed);
    },

    // Strip a trailing cue extension: "JOHN (V.O.)" -> "JOHN"
    characterName(trimmed) {
        return trimmed
            .replace(/^@/, '')
            .replace(/\s*\([^)]*\)\s*$/, '')
            .trim()
            .toUpperCase();
    },

    // Detect a Fountain character cue.
    isCharacterName(line, lines, index) {
        let trimmed = line.trim();

        // Must not be empty
        if (!trimmed) return false;

        // A cue must be preceded by a blank line, and followed by dialogue or a
        // parenthetical. Without these, ordinary action lines get mistaken for cues.
        if (index > 0 && lines[index - 1].trim() !== '') return false;
        if (index + 1 >= lines.length || lines[index + 1].trim() === '') return false;

        // "@" forces a cue, which is how Fountain writes names that aren't uppercase
        // ("@McAvoy"). A forced cue skips the heuristics below.
        const forced = trimmed.startsWith('@');
        if (forced) trimmed = trimmed.slice(1).trim();

        // Must not be too long (character names shouldn't be full sentences)
        if (!trimmed || trimmed.length > 50) return false;

        // Extensions like (V.O.), (O.S.) and (CONT'D) belong to the cue, not the name,
        // so every test below runs against the name with the extension removed.
        const nameOnly = trimmed.replace(/\s*\([^)]*\)\s*$/, '').trim();
        if (!nameOnly) return false;

        if (forced) return true;

        // Sentence punctuation never appears in a cue.
        if (/[!?,;:]/.test(nameOnly)) return false;

        // Periods are acceptable only inside abbreviations ("MRS. SMITH", "J.R."),
        // never as the full stop that ends a line of action.
        const periodsAreAbbreviations = nameOnly.split(/\s+/).every(
            token => !token.includes('.') || /^(?:[A-Z]{1,4}\.)+$/i.test(token)
        );
        if (!periodsAreAbbreviations) return false;

        // Fountain requires cues to be uppercase; use "@" for anything else.
        if (nameOnly !== nameOnly.toUpperCase()) return false;

        // Must read like a name, not a sentence.
        if (!/[A-Z]/.test(nameOnly)) return false;
        if (!/^[A-Z0-9\s'’.#&-]+$/.test(nameOnly)) return false;
        if (nameOnly.split(/\s+/).length > 4) return false;

        return true;
    },

    // Format parsed script for preview
    formatScript(parsed) {
        return parsed.map(element => {
            const { type, content } = element;
            
            switch (type) {
                case 'empty':
                    return '<div class="empty-line">&nbsp;</div>';
                case 'scene-heading':
                    return `<div class="scene-heading">${this.escapeHtml(content)}</div>`;
                case 'character':
                    return `<div class="character-name">${this.escapeHtml(content)}</div>`;
                case 'dialogue':
                    return `<div class="dialogue">${this.escapeHtml(content)}</div>`;
                case 'parenthetical':
                    return `<div class="parenthetical">${this.escapeHtml(content)}</div>`;
                case 'transition':
                    return `<div class="transition">${this.escapeHtml(content)}</div>`;
                case 'action':
                default:
                    return `<div class="action">${this.escapeHtml(content)}</div>`;
            }
        }).join('');
    },

    // Helper function to escape HTML. Quotes are escaped too, so the result is safe
    // inside an attribute value as well as in text.
    escapeHtml(text) {
        return String(text == null ? '' : text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    // Update preview
    updatePreview() {
        const editor = document.getElementById('scriptEditor');
        const preview = document.getElementById('scriptPreview');
        const title = document.getElementById('scriptTitle');
        const author = document.getElementById('authorName');
        const contact = document.getElementById('contactInfo');
        
        if (!editor || !preview || !title || !author || !contact) {
            return;
        }
        
        const previewTitle = document.getElementById('previewTitle');
        const previewAuthor = document.getElementById('previewAuthor');
        
        if (previewTitle) {
            previewTitle.textContent = title.value || 'YOUR SCRIPT TITLE';
        }
        
        // Everything below goes through innerHTML, so escape before interpolating.
        let authorInfo = 'Written by<br>';
        authorInfo += this.escapeHtml(author.value || 'Your Name') + '<br>';
        if (contact.value) {
            authorInfo += this.escapeHtml(contact.value).replace(/\n/g, '<br>');
        }

        if (previewAuthor) {
            previewAuthor.innerHTML = authorInfo;
        }

        const safeTitle = this.escapeHtml(title.value || 'YOUR SCRIPT TITLE');
        const titlePage = `
                    <div class="title-page">
                        <div class="title">${safeTitle}</div>
                        <div class="author-info">
                            ${authorInfo}
                        </div>
                    </div>`;

        if (editor.value && editor.value.trim()) {
            const parsed = this.parseFountain(editor.value);
            const formatted = this.formatScript(parsed);

            preview.innerHTML = `
                <div class="script-content">${titlePage}
                    <div style="page-break-before: always; padding-top: 1in;">
                        ${formatted}
                    </div>
                </div>
            `;
        } else {
            preview.innerHTML = `
                <div class="script-content">${titlePage}
                </div>
            `;
        }
    },

    // Quick insert functions
    TEMPLATES: {
        character: { body: 'CHARACTER NAME\nDialogue goes here.\n', select: 'CHARACTER NAME', blankLineBefore: true },
        scene: { body: 'INT. LOCATION - DAY\n\nAction description here.\n', select: 'LOCATION', blankLineBefore: true },
        transition: { body: 'CUT TO:\n', select: 'CUT TO:', blankLineBefore: true },
        parenthetical: { body: '(beat)\n', select: 'beat', blankLineBefore: false }
    },

    insertElement(type) {
        console.log('Inserting element:', type);
        const editor = document.getElementById('scriptEditor');
        const template = this.TEMPLATES[type];
        if (!editor || !template) return;

        const cursorPos = editor.selectionStart;
        const before = editor.value.substring(0, cursorPos);

        // Add only the separator that's actually missing, instead of always two
        // newlines, which used to leave a growing gap of blank lines.
        let prefix = '';
        if (before !== '') {
            if (template.blankLineBefore) {
                if (!/\n[ \t]*\n$/.test(before)) prefix = /\n$/.test(before) ? '\n' : '\n\n';
            } else if (!/\n$/.test(before)) {
                prefix = '\n';
            }
        }

        const insertText = prefix + template.body;
        editor.value = before + insertText + editor.value.substring(cursorPos);

        // Select the placeholder so typing replaces it straight away.
        const placeholderOffset = template.select ? insertText.indexOf(template.select) : -1;
        if (placeholderOffset !== -1) {
            editor.selectionStart = cursorPos + placeholderOffset;
            editor.selectionEnd = cursorPos + placeholderOffset + template.select.length;
        } else {
            editor.selectionStart = editor.selectionEnd = cursorPos + insertText.length;
        }

        editor.focus();
        this.updatePreview();
        this.saveScript();
    },

    // Keys that drive the popup rather than the text, so they must not re-filter it.
    AUTOCOMPLETE_NAV_KEYS: ['ArrowUp', 'ArrowDown', 'Enter', 'Tab', 'Escape'],

    // Auto-completion
    handleAutoComplete(event) {
        if (this.AUTOCOMPLETE_NAV_KEYS.includes(event.key)) return;

        const editor = document.getElementById('scriptEditor');
        if (!editor) return;

        if (event.ctrlKey || event.altKey || event.metaKey) {
            this.hideAutoComplete();
            return;
        }

        const cursorPos = editor.selectionStart;
        const text = editor.value;
        const lineStart = text.lastIndexOf('\n', cursorPos - 1) + 1;
        const lineEnd = text.indexOf('\n', cursorPos);
        const currentLine = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);
        const fragment = currentLine.trim();

        // Two characters is enough context to be useful without firing on every letter.
        if (fragment.length < 2) {
            this.hideAutoComplete();
            return;
        }

        const needle = fragment.toLowerCase();
        const seen = new Set();
        const suggestions = [...this.characters, ...this.locations, ...this.presets]
            .filter(item => {
                if (typeof item !== 'string' || !item) return false;
                const key = item.toUpperCase();
                if (seen.has(key)) return false;
                seen.add(key);
                const lower = item.toLowerCase();
                // Prefix match only, and never suggest what's already typed.
                return lower.startsWith(needle) && lower !== needle;
            })
            .slice(0, 8);

        if (suggestions.length > 0) {
            this.showAutoComplete(suggestions, editor, lineStart);
        } else {
            this.hideAutoComplete();
        }
    },

    showAutoComplete(suggestions, editor, lineStart) {
        const popup = document.getElementById('autocompletePopup');
        if (!popup) return;

        popup.textContent = '';

        suggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = suggestion;
            item.dataset.suggestion = suggestion;
            // mousedown (not click) so the editor never loses focus mid-selection.
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.insertSuggestion(suggestion, lineStart);
            });
            item.addEventListener('mouseenter', () => this.setActiveSuggestion(index));
            popup.appendChild(item);
        });

        this.autoCompleteItems = suggestions;
        this.autoCompleteLineStart = lineStart;
        this.autoCompleteOpen = true;

        popup.style.visibility = 'hidden';
        popup.style.display = 'block';
        this.setActiveSuggestion(0);
        this.positionAutoComplete(popup, editor);
        popup.style.visibility = 'visible';
    },

    // Place the popup under the caret instead of at a fixed offset from the editor.
    positionAutoComplete(popup, editor) {
        const caret = this.getCaretCoordinates(editor);
        const popupRect = popup.getBoundingClientRect();
        const margin = 8;

        let left = caret.left;
        let top = caret.top;

        if (left + popupRect.width > window.innerWidth - margin) {
            left = Math.max(margin, window.innerWidth - popupRect.width - margin);
        }
        // Flip above the caret when there isn't room below.
        if (top + popupRect.height > window.innerHeight - margin) {
            const above = caret.top - caret.lineHeight - popupRect.height;
            top = above >= margin ? above : Math.max(margin, window.innerHeight - popupRect.height - margin);
        }

        popup.style.left = Math.round(left) + 'px';
        popup.style.top = Math.round(top) + 'px';
    },

    // The editor is monospace, so the caret can be derived from row/column without
    // building a mirror element.
    getCaretCoordinates(editor) {
        const style = window.getComputedStyle(editor);
        const fontSize = parseFloat(style.fontSize) || 16;
        const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.5;
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const paddingTop = parseFloat(style.paddingTop) || 0;
        const font = style.font || `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const charWidth = this.measureCharWidth(font) || fontSize * 0.6;

        const upToCaret = editor.value.substring(0, editor.selectionStart).split('\n');
        const row = upToCaret.length - 1;
        const column = upToCaret[row].length;

        const rect = editor.getBoundingClientRect();
        return {
            left: rect.left + paddingLeft + (column * charWidth) - editor.scrollLeft,
            top: rect.top + paddingTop + ((row + 1) * lineHeight) - editor.scrollTop,
            lineHeight
        };
    },

    measureCharWidth(font) {
        if (this._charWidthFont === font && this._charWidth) return this._charWidth;
        try {
            this._measureCanvas = this._measureCanvas || document.createElement('canvas');
            const ctx = this._measureCanvas.getContext('2d');
            ctx.font = font;
            const width = ctx.measureText('M').width;
            if (width > 0) {
                this._charWidthFont = font;
                this._charWidth = width;
                return width;
            }
        } catch (e) {
            console.warn('Could not measure character width:', e);
        }
        return 0;
    },

    setActiveSuggestion(index) {
        const popup = document.getElementById('autocompletePopup');
        if (!popup) return;
        const items = popup.querySelectorAll('.autocomplete-item');
        if (!items.length) return;

        this.autoCompleteIndex = (index + items.length) % items.length;
        items.forEach((item, i) => item.classList.toggle('selected', i === this.autoCompleteIndex));
        const active = items[this.autoCompleteIndex];
        if (active && active.scrollIntoView) {
            active.scrollIntoView({ block: 'nearest' });
        }
    },

    moveActiveSuggestion(delta) {
        this.setActiveSuggestion(this.autoCompleteIndex + delta);
    },

    acceptActiveSuggestion() {
        const suggestion = this.autoCompleteItems[this.autoCompleteIndex];
        if (suggestion === undefined) return false;
        this.insertSuggestion(suggestion, this.autoCompleteLineStart);
        return true;
    },

    hideAutoComplete() {
        const popup = document.getElementById('autocompletePopup');
        if (popup) {
            popup.style.display = 'none';
            popup.textContent = '';
        }
        this.autoCompleteOpen = false;
        this.autoCompleteIndex = -1;
        this.autoCompleteItems = [];
    },

    insertSuggestion(suggestion, lineStart) {
        const editor = document.getElementById('scriptEditor');
        if (!editor) return;

        const text = editor.value;
        const cursorPos = editor.selectionStart;
        const lineEnd = text.indexOf('\n', cursorPos);

        const newText = text.substring(0, lineStart) + suggestion + text.substring(lineEnd === -1 ? text.length : lineEnd);
        editor.value = newText;
        editor.selectionStart = editor.selectionEnd = lineStart + suggestion.length;

        this.hideAutoComplete();
        this.updatePreview();
        this.saveScript();
        editor.focus();
    },

    // Key handling
    handleKeyDown(event) {
        // While the popup is open it owns the navigation keys.
        if (this.autoCompleteOpen && this.autoCompleteItems.length) {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                this.moveActiveSuggestion(1);
                return;
            }
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                this.moveActiveSuggestion(-1);
                return;
            }
            if (event.key === 'Enter' || event.key === 'Tab') {
                event.preventDefault();
                this.acceptActiveSuggestion();
                return;
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                this.hideAutoComplete();
                return;
            }
        }

        if (event.key === 'Escape') {
            this.hideAutoComplete();
            return;
        }

        if (event.key === 'Tab') {
            event.preventDefault();
            const editor = document.getElementById('scriptEditor');
            if (!editor) return;

            const start = editor.selectionStart;
            const end = editor.selectionEnd;

            editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
            editor.selectionStart = editor.selectionEnd = start + 4;
            this.updatePreview();
        }
    },

    // Preset management
    addPreset() {
        const input = document.getElementById('newPreset');
        if (!input) return;
        
        const preset = input.value.trim().toUpperCase();
        if (preset && !this.presets.includes(preset)) {
            this.presets.push(preset);
            this.updatePresetsList();
            input.value = '';
            this.savePresets();
        }
        input.focus();
    },

    deletePreset(preset) {
        this.presets = this.presets.filter(p => p !== preset);
        this.updatePresetsList();
        this.savePresets();
    },

    insertPreset(preset) {
        const editor = document.getElementById('scriptEditor');
        if (!editor) return;
        
        const cursorPos = editor.selectionStart;
        const newText = editor.value.substring(0, cursorPos) + preset + editor.value.substring(cursorPos);
        editor.value = newText;
        editor.selectionStart = editor.selectionEnd = cursorPos + preset.length;
        editor.focus();
        this.updatePreview();
    },

    // Built with DOM calls rather than an HTML string: preset names are user input and
    // a name containing a quote used to break out of the data-preset attribute.
    updatePresetsList() {
        const list = document.getElementById('presetsList');
        if (!list) return;

        list.textContent = '';

        this.presets.forEach(preset => {
            const item = document.createElement('div');
            item.className = 'preset-item';
            item.dataset.preset = preset;
            item.title = 'Insert ' + preset;

            const label = document.createElement('span');
            label.className = 'preset-label';
            label.textContent = preset;

            const remove = document.createElement('span');
            remove.className = 'preset-delete';
            remove.dataset.delete = preset;
            remove.textContent = '×';
            remove.title = 'Delete ' + preset;

            item.appendChild(label);
            item.appendChild(remove);
            list.appendChild(item);
        });
    },

    savePresets() {
        this.writeStorage('scriptGenie_presets', JSON.stringify(this.presets));
    },

    loadPresets() {
        const saved = localStorage.getItem('scriptGenie_presets');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    this.presets = parsed.filter(p => typeof p === 'string' && p.trim() !== '');
                }
            } catch (e) {
                console.error('Error loading presets:', e);
            }
        }
        this.updatePresetsList();
    },

    // Timer functions
    showTimer() {
        const modal = document.getElementById('timerModal');
        if (modal) {
            modal.style.display = 'flex';
            this.resetTimer();
        }
    },

    closeTimer() {
        const modal = document.getElementById('timerModal');
        if (modal) modal.style.display = 'none';
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.timerRunning = false;
    },

    startTimer() {
        const minutesInput = document.getElementById('timerMinutes');
        const minutes = parseInt(minutesInput?.value) || 25;
        this.timerSeconds = minutes * 60;
        this.timerRunning = true;
        
        const startBtn = document.getElementById('startTimerBtn');
        const pauseBtn = document.getElementById('pauseTimerBtn');
        if (startBtn) startBtn.style.display = 'none';
        if (pauseBtn) pauseBtn.style.display = 'inline-block';
        
        this.timerInterval = setInterval(() => {
            this.timerSeconds--;
            this.updateTimerDisplay();
            
            if (this.timerSeconds <= 0) {
                this.timerComplete();
            }
        }, 1000);
    },

    pauseTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.timerRunning = false;
        
        const startBtn = document.getElementById('startTimerBtn');
        const pauseBtn = document.getElementById('pauseTimerBtn');
        if (startBtn) {
            startBtn.style.display = 'inline-block';
            startBtn.textContent = 'Resume';
        }
        if (pauseBtn) pauseBtn.style.display = 'none';
    },

    resetTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.timerRunning = false;
        
        const minutesInput = document.getElementById('timerMinutes');
        const minutes = parseInt(minutesInput?.value) || 25;
        this.timerSeconds = minutes * 60;
        this.updateTimerDisplay();
        
        const startBtn = document.getElementById('startTimerBtn');
        const pauseBtn = document.getElementById('pauseTimerBtn');
        if (startBtn) {
            startBtn.style.display = 'inline-block';
            startBtn.textContent = 'Start';
        }
        if (pauseBtn) pauseBtn.style.display = 'none';
    },

    updateTimerDisplay() {
        const minutes = Math.floor(this.timerSeconds / 60);
        const seconds = this.timerSeconds % 60;
        const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        const displayElement = document.getElementById('timerDisplay');
        if (displayElement) displayElement.textContent = display;
    },

    timerComplete() {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.timerRunning = false;
        
        this.playAlarmSound();
        
        const displayElement = document.getElementById('timerDisplay');
        if (displayElement) {
            displayElement.textContent = 'TIME\'S UP!';
            displayElement.style.color = 'var(--danger-color)';
        }
        
        const startBtn = document.getElementById('startTimerBtn');
        const pauseBtn = document.getElementById('pauseTimerBtn');
        if (startBtn) {
            startBtn.style.display = 'inline-block';
            startBtn.textContent = 'Start';
        }
        if (pauseBtn) pauseBtn.style.display = 'none';
        
        setTimeout(() => {
            if (displayElement) displayElement.style.color = 'var(--accent-color)';
            this.resetTimer();
        }, 3000);
    },

    playAlarmSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 1);
            
            setTimeout(() => {
                const oscillator2 = audioContext.createOscillator();
                const gainNode2 = audioContext.createGain();
                
                oscillator2.connect(gainNode2);
                gainNode2.connect(audioContext.destination);
                
                oscillator2.frequency.setValueAtTime(1000, audioContext.currentTime);
                gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
                
                oscillator2.start();
                oscillator2.stop(audioContext.currentTime + 1);
            }, 200);
        } catch (error) {
            console.log('Audio not supported or blocked');
        }
    },

    // Export to PDF
    exportToPDF() {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            this.showStatus('⚠️ Allow pop-ups to export');
            console.warn('Export blocked: the browser prevented the print window from opening.');
            return;
        }

        const title = document.getElementById('scriptTitle')?.value || 'Untitled Script';
        const content = document.getElementById('scriptPreview')?.innerHTML || '';

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${this.escapeHtml(title)}</title>
                <style>
                    body {
                        font-family: 'Courier New', 'Liberation Mono', 'Nimbus Mono L', Monaco, 'Lucida Console', monospace;
                        font-size: 12pt;
                        line-height: 1.5;
                        margin: 0;
                        padding: 0;
                        background: white;
                        color: black;
                    }
                    
                    @page {
                        margin: 1in 1in 1in 1.5in;
                    }
                    
                    .title-page {
                        text-align: center;
                        margin-top: 3.5in;
                        page-break-after: always;
                    }
                    
                    .title {
                        font-weight: bold;
                        font-size: 14pt;
                        text-transform: uppercase;
                        margin-bottom: 2rem;
                    }
                    
                    .scene-heading {
                        font-weight: bold;
                        text-transform: uppercase;
                        margin: 1rem 0 0.5rem 0;
                        page-break-after: avoid;
                    }
                    
                    .character-name {
                        font-weight: bold;
                        text-transform: uppercase;
                        margin: 1rem 0 0.25rem 0;
                        text-align: center;
                        page-break-after: avoid;
                    }
                    
                    .dialogue {
                        margin: 0.25rem auto 1rem auto;
                        max-width: 35em;
                        text-align: left;
                        page-break-inside: avoid;
                    }
                    
                    .parenthetical {
                        margin: 0.25rem auto;
                        max-width: 30em;
                        text-align: center;
                        font-style: italic;
                    }
                    
                    .transition {
                        font-weight: bold;
                        text-transform: uppercase;
                        text-align: right;
                        margin: 1rem 0;
                        page-break-before: avoid;
                    }
                    
                    .action {
                        margin: 0.5rem 0;
                    }
                    
                    .empty-line {
                        height: 1.5em;
                    }
                </style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `;
        
        printWindow.document.write(printContent);
        printWindow.document.close();

        // A document built with document.write may already be complete by now, in which
        // case onload never fires and the print dialog would never open.
        const triggerPrint = () => {
            try {
                printWindow.focus();
                printWindow.print();
            } catch (e) {
                console.warn('Could not open the print dialog:', e);
            }
        };

        if (printWindow.document.readyState === 'complete') {
            setTimeout(triggerPrint, 300);
        } else {
            printWindow.onload = () => setTimeout(triggerPrint, 300);
        }
    },

    // Save/Load functionality
    saveScript() {
        const titleField = document.getElementById('scriptTitle');
        const authorField = document.getElementById('authorName');
        const contactField = document.getElementById('contactInfo');
        const editorField = document.getElementById('scriptEditor');
        
        if (titleField && authorField && contactField && editorField) {
            const scriptData = {
                title: titleField.value,
                author: authorField.value,
                contact: contactField.value,
                content: editorField.value,
                timestamp: new Date().toISOString()
            };
            
            this.writeStorage('scriptGenie_autosave', JSON.stringify(scriptData));
        }
    },

    // localStorage throws when it is full or disabled (Safari private browsing), and an
    // unhandled throw here would break autosave and the beforeunload handler.
    writeStorage(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.warn('Could not write to local storage:', e);
            return false;
        }
    },

    loadScript() {
        const saved = localStorage.getItem('scriptGenie_autosave');
        if (saved) {
            try {
                const scriptData = JSON.parse(saved);
                const titleField = document.getElementById('scriptTitle');
                const authorField = document.getElementById('authorName');
                const contactField = document.getElementById('contactInfo');
                const editorField = document.getElementById('scriptEditor');
                
                if (titleField) titleField.value = scriptData.title || '';
                if (authorField) authorField.value = scriptData.author || '';
                if (contactField) contactField.value = scriptData.contact || '';
                if (editorField) editorField.value = scriptData.content || '';
                
                this.updatePreview();
            } catch (e) {
                console.error('Error loading script:', e);
            }
        }
    },

    // Show save confirmation
    showSaveConfirmation() {
        this.showStatus('💾 Saved!');
    },

    // Briefly replace the editor pane header with a status message.
    showStatus(message, duration = 1000) {
        const header = document.querySelector('.editor-pane .pane-header');
        if (!header) return;

        if (this._statusTimeout) {
            clearTimeout(this._statusTimeout);
        } else {
            this._statusOriginalText = header.textContent;
        }

        header.textContent = message;
        this._statusTimeout = setTimeout(() => {
            header.textContent = this._statusOriginalText;
            this._statusTimeout = null;
        }, duration);
    }
};

// Initialize when script loads
ScriptGenie.init();
