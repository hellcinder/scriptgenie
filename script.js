// Application state
let currentTheme = 'light';
let presets = ['INT. HOUSE - DAY', 'EXT. STREET - NIGHT', 'JOHN', 'MARY', 'FADE IN:', 'FADE OUT:', 'CUT TO:'];
let characters = new Set();
let locations = new Set();
let timerInterval = null;
let timerSeconds = 0;
let timerRunning = false;

// Theme management
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', currentTheme);
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.textContent = currentTheme === 'light' ? '🌙' : '☀️';
    }
    
    // Save theme preference
    localStorage.setItem('scriptGenie_theme', currentTheme);
}

// Load saved theme
function loadTheme() {
    const savedTheme = localStorage.getItem('scriptGenie_theme');
    if (savedTheme) {
        currentTheme = savedTheme;
        document.body.setAttribute('data-theme', currentTheme);
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = currentTheme === 'light' ? '🌙' : '☀️';
        }
    }
}

// Fountain parser
function parseFountain(text) {
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
                locations.add(locationMatch[2].trim());
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
                    characters.add(line.trim().replace(/\([^)]*\)/, '').trim());
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
}

// Format parsed script for preview
function formatScript(parsed) {
    return parsed.map(element => {
        const { type, content } = element;
        
        switch (type) {
            case 'empty':
                return '<div class="empty-line">&nbsp;</div>';
            case 'scene-heading':
                return `<div class="scene-heading">${escapeHtml(content)}</div>`;
            case 'character':
                return `<div class="character-name">${escapeHtml(content)}</div>`;
            case 'dialogue':
                return `<div class="dialogue">${escapeHtml(content)}</div>`;
            case 'parenthetical':
                return `<div class="parenthetical">${escapeHtml(content)}</div>`;
            case 'transition':
                return `<div class="transition">${escapeHtml(content)}</div>`;
            case 'action':
            default:
                return `<div class="action">${escapeHtml(content)}</div>`;
        }
    }).join('');
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Update preview
function updatePreview() {
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
        const parsed = parseFountain(editor.value);
        const formatted = formatScript(parsed);
        
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
