// Create ScriptGenie namespace to avoid global scope issues
const ScriptGenie = {
    // Application state
    currentTheme: 'light',
    presets: ['INT. HOUSE - DAY', 'EXT. STREET - NIGHT', 'JOHN', 'MARY', 'FADE IN:', 'FADE OUT:', 'CUT TO:'],
    characters: new Set(),
    locations: new Set(),
    timerInterval: null,
    timerSeconds: 0,
    timerRunning: false,

    // Theme management
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', this.currentTheme);
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
        }
        
        // Save theme preference
        localStorage.setItem('scriptGenie_theme', this.currentTheme);
    },

    // Load saved theme
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
            let content = line;
            
            // Skip empty lines but track them
            if (line.trim() === '') {
                parsed.push({ type: 'empty', content: '' });
                continue;
            }
            
            // Scene headings - must start with specific keywords
            if (/^(INT\.|EXT\.|INT\.\/EXT\.|FADE IN:|FADE OUT:)/i.test(line.trim())) {
                type = 'scene-heading';
                
                // Extract location for autocomplete
                const locationMatch = line.match(/(INT\.|EXT\.|INT\.\/EXT\.)\s+([^-]+)/i);
                if (locationMatch) {
                    this.locations.add(locationMatch[2].trim());
                }
            }
            // Transitions - all caps ending with ':'
            else if (/^[A-Z][A-Z\s]*:$/.test(line.trim()) || 
                     /^(CUT TO:|DISSOLVE TO:|FADE TO:|MATCH CUT:|JUMP CUT:|SMASH CUT:)/i.test(line.trim())) {
                type = 'transition';
            }
            // Character names - all caps, no punctuation except parentheses, not too long
            else if (/^[A-Z][A-Z\s]*(\([^)]*\))?$/.test(line.trim()) && 
                     line.trim().length > 1 && 
                     line.trim().length < 50 &&
                     !line.includes('.') &&
                     !line.includes(':') &&
                     i < lines.length - 1 && 
                     lines[i + 1].trim() !== '') {
                
                // Check if next non-empty line looks like dialogue (not all caps)
                let nextLineIndex = i + 1;
                while (nextLineIndex < lines.length && lines[nextLineIndex].trim() === '') {
                    nextLineIndex++;
                }
                
                if (nextLineIndex < lines.length) {
                    const nextLine = lines[nextLineIndex].trim();
                    // If next line is not all caps or starts with '(', it's likely dialogue
                    if (!(/^[A-Z][A-Z\s]*:?$/.test(nextLine)) || nextLine.startsWith('(')) {
                        type = 'character';
                        this.characters.add(line.trim().replace(/\([^)]*\)/, '').trim());
                    }
                }
            }
            // Parentheticals - wrapped in parentheses
            else if (/^\s*\([^)]+\)\s*$/.test(line.trim())) {
                type = 'parenthetical';
            }
            // Dialogue - follows character name or parenthetical
            else if (i > 0) {
                // Look backwards to find the most recent non-empty line
                let prevIndex = i - 1;
                while (prevIndex >= 0 && parsed[prevIndex] && parsed[prevIndex].type === 'empty') {
                    prevIndex--;
                }
                
                if (prevIndex >= 0 && parsed[prevIndex] && 
                    (parsed[prevIndex].type === 'character' || parsed[prevIndex].type === 'parenthetical')) {
                    type = 'dialogue';
                }
                // Continue dialogue if previous line was dialogue and this line is not all caps
                else if (prevIndex >= 0 && parsed[prevIndex] && 
                         parsed[prevIndex].type === 'dialogue' && 
                         !(/^[A-Z][A-Z\s]*:?$/.test(line.trim()))) {
                    type = 'dialogue';
                }
            }
            
            parsed.push({ type, content: line });
        }
        
        return parsed;
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
        
        // Check if all elements exist before proceeding
        if (!editor || !preview || !title || !author || !contact) {
            return;
        }
        
        // Update title page
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
        
        // Parse and format script
        if (editor.value && editor.value.trim()) {
            const parsed = this.parseFountain(editor.value);
            const formatted = this.formatScript(parsed);
            
            // Add title page + script content
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
            
            if (preview) {
                preview.innerHTML = titlePageHtml;
            }
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
            
            if (preview) {
                preview.innerHTML = defaultHtml;
            }
        }
    },

    // Setup all event listeners
    initializeEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => this.toggleTheme());
        
        // Header buttons
        document.getElementById('exportBtn')?.addEventListener('click', () => this.exportToPDF());
        document.getElementById('timerBtn')?.addEventListener('click', () => this.showTimer());
        
        // Quick action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const elementType = e.target.getAttribute('data-element');
                this.insertElement(elementType);
            });
        });
        
        // Add preset button
        document.getElementById('addPresetBtn')?.addEventListener('click', () => this.addPreset());
        
        // Timer controls
        document.getElementById('startTimerBtn')?.addEventListener('click', () => this.startTimer());
        document.getElementById('pauseTimerBtn')?.addEventListener('click', () => this.pauseTimer());
        document.getElementById('resetTimerBtn')?.addEventListener('click', () => this.resetTimer());
        document.getElementById('closeTimerBtn')?.addEventListener('click', () => this.closeTimer());
        
        // Preset list event delegation
        document.getElementById('presetsList')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('preset-delete')) {
                e.stopPropagation();
                const preset = e.target.getAttribute('data-delete');
                this.deletePreset(preset);
            } else if (e.target.classList.contains('preset-item')) {
                const preset = e.target.getAttribute('data-preset');
                this.insertPreset(preset);
            }
        });
        
        // Title page updates
        document.getElementById('scriptTitle')?.addEventListener('input', () => this.updatePreview());
        document.getElementById('authorName')?.addEventListener('input', () => this.updatePreview());
        document.getElementById('contactInfo')?.addEventListener('input', () => this.updatePreview());
        
        // Editor events
        const editor = document.getElementById('scriptEditor');
        if (editor) {
            editor.addEventListener('input', () => {
                this.updatePreview();
                clearTimeout(window.autoSaveTimeout);
                window.autoSaveTimeout = setTimeout(() => this.saveScript(), 2000);
            });
        }
        
        // Timer minutes input
        document.getElementById('timerMinutes')?.addEventListener('input', () => {
            if (!this.timerRunning) {
                this.resetTimer();
            }
        });
        
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
                
                const editor = document.querySelector('.editor-pane .pane-header');
                if (editor) {
                    const originalText = editor.textContent;
                    editor.textContent = '💾 Saved!';
                    setTimeout(() => {
                        editor.textContent = originalText;
                    }, 1000);
                }
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
    },
