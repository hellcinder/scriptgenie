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
        }

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
        localStorage.setItem('scriptGenie_theme', this.currentTheme);
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
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            let type = 'action';
            
            // Skip empty lines but track them
            if (line.trim() === '') {
                parsed.push({ type: 'empty', content: '' });
                continue;
            }
            
            // Scene headings
            if (/^(INT\.|EXT\.|INT\.\/EXT\.|FADE IN:|FADE OUT:)/i.test(line.trim())) {
                type = 'scene-heading';
                
                // Extract location for autocomplete
                const locationMatch = line.match(/(INT\.|EXT\.|INT\.\/EXT\.)\s+([^-]+)/i);
                if (locationMatch) {
                    this.locations.add(locationMatch[2].trim());
                }
            }
            // Transitions
            else if (/^[A-Z][A-Z\s]*:$/.test(line.trim()) || 
                     /^(CUT TO:|DISSOLVE TO:|FADE TO:|MATCH CUT:|JUMP CUT:|SMASH CUT:)/i.test(line.trim())) {
                type = 'transition';
            }
            // Character names - more flexible detection
            else if (this.isCharacterName(line, lines, i)) {
                type = 'character';
                // Add to characters set (convert to uppercase for consistency)
                const cleanName = line.trim().replace(/\([^)]*\)/, '').trim().toUpperCase();
                this.characters.add(cleanName);
            }
            // Parentheticals
            else if (/^\s*\([^)]+\)\s*$/.test(line.trim())) {
                type = 'parenthetical';
            }
            // Dialogue
            else if (i > 0) {
                let prevIndex = i - 1;
                while (prevIndex >= 0 && parsed[prevIndex] && parsed[prevIndex].type === 'empty') {
                    prevIndex--;
                }
                
                if (prevIndex >= 0 && parsed[prevIndex] && 
                    (parsed[prevIndex].type === 'character' || parsed[prevIndex].type === 'parenthetical')) {
                    type = 'dialogue';
                }
                else if (prevIndex >= 0 && parsed[prevIndex] && 
                         parsed[prevIndex].type === 'dialogue' && 
                         !this.isCharacterName(line, lines, i) &&
                         !(/^[A-Z][A-Z\s]*:?$/.test(line.trim()))) {
                    type = 'dialogue';
                }
            }
            
            parsed.push({ type, content: line });
        }
        
        return parsed;
    },

    // Helper function to detect character names more intelligently
    isCharacterName(line, lines, index) {
        const trimmed = line.trim();
        
        // Must not be empty
        if (!trimmed) return false;
        
        // Must not be too long (character names shouldn't be full sentences)
        if (trimmed.length > 50) return false;
        
        // Must not contain periods (except in extensions like "V.O." or "O.S.")
        if (trimmed.includes('.') && !trimmed.match(/\b(V\.O\.|O\.S\.|CONT\.D)\b/i)) return false;
        
        // Must not end with colon unless it's a known transition
        if (trimmed.endsWith(':') && !(/^(CUT TO:|DISSOLVE TO:|FADE TO:|MATCH CUT:|JUMP CUT:|SMASH CUT:)$/i.test(trimmed))) return false;
        
        // Check if next non-empty line exists and could be dialogue
        let nextLineIndex = index + 1;
        while (nextLineIndex < lines.length && lines[nextLineIndex].trim() === '') {
            nextLineIndex++;
        }
        
        if (nextLineIndex >= lines.length) return false;
        
        const nextLine = lines[nextLineIndex].trim();
        
        // Next line should not be another potential character name (all caps) unless it starts with parentheses
        if (nextLine.startsWith('(')) return true;
        
        // If next line is all caps and looks like another character name, this probably isn't a character
        if (/^[A-Z][A-Z\s]*(\([^)]*\))?$/.test(nextLine) && nextLine.length < 50) {
            return false;
        }
        
        // Character names can be:
        // 1. All uppercase: "JOHN", "MARY SMITH" 
        // 2. Title case: "John", "Mary Smith"
        // 3. Mixed case but starting with capital: "McDonnell", "O'Brien"
        // 4. Can have extensions: "JOHN (V.O.)", "Mary (O.S.)"
        
        // Remove any parenthetical extensions for testing
        const nameOnly = trimmed.replace(/\s*\([^)]*\)$/, '');
        
        // Check if it looks like a name (starts with capital, contains only letters, spaces, apostrophes, periods for initials)
        if (/^[A-Z][a-zA-Z\s'.-]*$/.test(nameOnly)) {
            // Additional checks:
            // - Not too many words (names shouldn't be full sentences)
            const wordCount = nameOnly.split(/\s+/).length;
            if (wordCount <= 4) { // Allow up to 4 words for names like "Mary Jane Watson Smith"
                return true;
            }
        }
        
        // Fallback: if it's all caps and reasonable length, probably a character
        if (/^[A-Z][A-Z\s]*(\([^)]*\))?$/.test(trimmed) && trimmed.length <= 30) {
            return true;
        }
        
        return false;
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

    // Helper function to escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
        
        let authorInfo = 'Written by<br>';
        authorInfo += (author.value || 'Your Name') + '<br>';
        if (contact.value) {
            authorInfo += contact.value.replace(/\n/g, '<br>');
        }
        
        if (previewAuthor) {
            previewAuthor.innerHTML = authorInfo;
        }
        
        if (editor.value && editor.value.trim()) {
            const parsed = this.parseFountain(editor.value);
            const formatted = this.formatScript(parsed);
            
            const titlePageHtml = `
                <div class="script-content">
                    <div class="title-page">
                        <div class="title">${title.value || 'YOUR SCRIPT TITLE'}</div>
                        <div class="author-info">
                            ${authorInfo}
                        </div>
                    </div>
                    <div style="page-break-before: always; padding-top: 1in;">
                        ${formatted}
                    </div>
                </div>
            `;
            
            preview.innerHTML = titlePageHtml;
        } else {
            const defaultHtml = `
                <div class="script-content">
                    <div class="title-page">
                        <div class="title">${title.value || 'YOUR SCRIPT TITLE'}</div>
                        <div class="author-info">
                            ${authorInfo}
                        </div>
                    </div>
                </div>
            `;
            
            preview.innerHTML = defaultHtml;
        }
    },

    // Quick insert functions
    insertElement(type) {
        console.log('Inserting element:', type);
        const editor = document.getElementById('scriptEditor');
        if (!editor) return;
        
        const cursorPos = editor.selectionStart;
        let insertText = '';
        let cursorOffset = 0;
        
        switch (type) {
            case 'character':
                insertText = '\n\nCHARACTER NAME\nDialogue goes here.\n';
                cursorOffset = 2;
                break;
            case 'scene':
                insertText = '\n\nINT. LOCATION - DAY\n\nAction description here.\n';
                cursorOffset = 2;
                break;
            case 'transition':
                insertText = '\n\nCUT TO:\n';
                cursorOffset = 2;
                break;
            case 'parenthetical':
                insertText = '\n(beat)\n';
                cursorOffset = 1;
                break;
        }
        
        const newText = editor.value.substring(0, cursorPos) + insertText + editor.value.substring(cursorPos);
        editor.value = newText;
        editor.selectionStart = editor.selectionEnd = cursorPos + cursorOffset;
        editor.focus();
        this.updatePreview();
    },

    // Auto-completion
    handleAutoComplete(event) {
        const editor = document.getElementById('scriptEditor');
        if (!editor) return;
        
        const cursorPos = editor.selectionStart;
        const text = editor.value;
        const lineStart = text.lastIndexOf('\n', cursorPos - 1) + 1;
        const lineEnd = text.indexOf('\n', cursorPos);
        const currentLine = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);
        
        if (currentLine.length > 0 && !event.ctrlKey && !event.altKey && !event.metaKey) {
            const suggestions = [...this.characters, ...this.locations, ...this.presets].filter(item =>
                item.toLowerCase().includes(currentLine.toLowerCase())
            );
            
            if (suggestions.length > 0 && currentLine.trim() !== '') {
                this.showAutoComplete(suggestions, editor, lineStart);
            } else {
                this.hideAutoComplete();
            }
        } else {
            this.hideAutoComplete();
        }
    },

    showAutoComplete(suggestions, editor, lineStart) {
        const popup = document.getElementById('autocompletePopup');
        if (!popup) return;
        
        popup.innerHTML = suggestions.map(suggestion => 
            `<div class="autocomplete-item" data-suggestion="${suggestion}" data-line-start="${lineStart}">${suggestion}</div>`
        ).join('');
        
        popup.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const suggestion = e.target.getAttribute('data-suggestion');
                const lineStart = parseInt(e.target.getAttribute('data-line-start'));
                this.insertSuggestion(suggestion, lineStart);
            });
        });
        
        const rect = editor.getBoundingClientRect();
        popup.style.left = rect.left + 'px';
        popup.style.top = (rect.top + 100) + 'px';
        popup.style.display = 'block';
    },

    hideAutoComplete() {
        const popup = document.getElementById('autocompletePopup');
        if (popup) popup.style.display = 'none';
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
        editor.focus();
    },

    // Key handling
    handleKeyDown(event) {
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
            localStorage.setItem('scriptGenie_presets', JSON.stringify(this.presets));
        }
    },

    deletePreset(preset) {
        this.presets = this.presets.filter(p => p !== preset);
        this.updatePresetsList();
        localStorage.setItem('scriptGenie_presets', JSON.stringify(this.presets));
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

    updatePresetsList() {
        const list = document.getElementById('presetsList');
        if (!list) return;
        
        list.innerHTML = this.presets.map(preset => `
            <div class="preset-item" data-preset="${preset}">
                ${preset}
                <span class="preset-delete" data-delete="${preset}">×</span>
            </div>
        `).join('');
    },

    loadPresets() {
        const saved = localStorage.getItem('scriptGenie_presets');
        if (saved) {
            try {
                this.presets = JSON.parse(saved);
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
        if (!printWindow) return;
        
        const title = document.getElementById('scriptTitle')?.value || 'Untitled Script';
        const content = document.getElementById('scriptPreview')?.innerHTML || '';
        
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
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
        
        printWindow.onload = function() {
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 500);
        };
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
            
            localStorage.setItem('scriptGenie_autosave', JSON.stringify(scriptData));
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
        const header = document.querySelector('.editor-pane .pane-header');
        if (header) {
            const originalText = header.textContent;
            header.textContent = '💾 Saved!';
            setTimeout(() => {
                header.textContent = originalText;
            }, 1000);
        }
    }
};

// Initialize when script loads
ScriptGenie.init();
