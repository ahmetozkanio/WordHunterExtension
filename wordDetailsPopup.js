// Word Details Popup functionality
export class WordDetailsPopup {
    constructor(wordObj, createSvgIcon) {
        this.wordObj = wordObj;
        this.createSvgIcon = createSvgIcon;
        this.popup = null;
        this.currentState = 'hidden';
        this.closeTimeout = null;
        this.isPopupSticky = false;
    }

    create() {
        const popup = document.createElement('div');
        popup.className = 'word-details-popup';
        popup.innerHTML = `
            <div class="popup-content">
                <div class="popup-header">
                    <h3 class="word-title">${this.wordObj.word}</h3>
                     <span class="close-btn">&times;</span>
                </div>
                <div class="meaning-section">
                    <h4>Meaning:</h4>
                    <div class="editable-content" data-type="meaning">
                        <p class="content-text">${this.wordObj.meaning || 'No meaning added yet'}</p>
                        <div class="edit-area" style="display: none;">
                            <textarea class="edit-input">${this.wordObj.meaning || ''}</textarea>
                        </div>
                    </div>
                </div>
                <div class="examples-section">
                    <h4>Examples:</h4>
                    <div class="editable-content" data-type="examples">
                        <div class="content-text">
                            ${this.wordObj.examples && this.wordObj.examples.length > 0 
                                ? `<ul>${this.wordObj.examples.map(ex => {
                                    const highlightedEx = ex.replace(new RegExp(`\\b${this.wordObj.word}\\b`, 'gi'), '<span class="highlight-word">$&</span>');
                                    return `
                                    <li>
                                        <span class="example-text">${highlightedEx}</span>
                                        <span class="icon-wrapper sound-icon" title="Play Sound" data-text="${ex}">
                                            ${this.createSvgIcon('sound')}
                                        </span>
                                    </li>`;
                                }).join('')}</ul>`
                                : '<p>No examples added yet</p>'}
                        </div>
                        <div class="edit-area" style="display: none;">
                            <textarea class="edit-input">${this.wordObj.examples ? this.wordObj.examples.join('\n') : ''}</textarea>
                        </div>
                    </div>
                </div>
                <div class="synonyms-section">
                    <h4>Synonyms:</h4>
                    <div class="editable-content" data-type="synonyms">
                        <p class="content-text">${this.wordObj.synonyms ? this.wordObj.synonyms.join(', ') : 'No synonyms added yet'}</p>
                        <div class="edit-area" style="display: none;">
                            <textarea class="edit-input">${this.wordObj.synonyms ? this.wordObj.synonyms.join(', ') : ''}</textarea>
                        </div>
                    </div>
                </div>
                <div class="popup-edit-actions" style="display: none;">
                    <button class="save-btn">Save All Changes</button>
                    <button class="cancel-btn">Cancel</button>
                </div>
            </div>
        `;

        this.popup = popup;
        this.setupEventListeners();
        return popup;
    }

    setupEventListeners() {
        const closeBtn = this.popup.querySelector('.close-btn');
        const editableContents = this.popup.querySelectorAll('.editable-content');
        const popupEditActions = this.popup.querySelector('.popup-edit-actions');
        let isAnyFieldEditing = false;

        // Close button event
        closeBtn.addEventListener('click', () => this.handleClose());

        // Editable content events
        editableContents.forEach(content => {
            const contentText = content.querySelector('.content-text');
            const editArea = content.querySelector('.edit-area');
            const textarea = editArea.querySelector('.edit-input');

            contentText.addEventListener('dblclick', () => {
                editableContents.forEach(c => {
                    c.querySelector('.content-text').style.display = 'none';
                    c.querySelector('.edit-area').style.display = 'block';
                });
                popupEditActions.style.display = 'flex';
                isAnyFieldEditing = true;
                textarea.focus();
            });
        });

        // Save button event
        const saveBtn = this.popup.querySelector('.popup-edit-actions .save-btn');
        saveBtn.addEventListener('click', () => this.handleSave());

        // Cancel button event
        const cancelBtn = this.popup.querySelector('.popup-edit-actions .cancel-btn');
        cancelBtn.addEventListener('click', () => this.handleCancel());

        // Example sound icons
        const exampleSoundIcons = this.popup.querySelectorAll('.examples-section .sound-icon');
        exampleSoundIcons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                const text = icon.dataset.text;
                if (text) {
                    this.playSound(text);
                }
            });
        });

        // Escape key event
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isAnyFieldEditing) {
                cancelBtn.click();
            }
        });
    }

    handleSave() {
        const updatedData = {
            meaning: '',
            examples: [],
            synonyms: []
        };

        const editableContents = this.popup.querySelectorAll('.editable-content');
        editableContents.forEach(content => {
            const type = content.dataset.type;
            const textarea = content.querySelector('.edit-input');
            const contentText = content.querySelector('.content-text');

            if (type === 'examples') {
                updatedData.examples = textarea.value.split('\n').filter(line => line.trim());
                contentText.innerHTML = updatedData.examples.length > 0 
                    ? `<ul>${updatedData.examples.map(ex => {
                        const highlightedEx = ex.replace(new RegExp(`\\b${this.wordObj.word}\\b`, 'gi'), '<span class="highlight-word">$&</span>');
                        return `
                        <li>
                            <span class="example-text">${highlightedEx}</span>
                            <span class="icon-wrapper sound-icon" title="Play Sound" data-text="${ex}">
                                ${this.createSvgIcon('sound')}
                            </span>
                        </li>`;
                    }).join('')}</ul>`
                    : '<p>No examples added yet</p>';
            } else if (type === 'synonyms') {
                updatedData.synonyms = textarea.value.split(',').map(s => s.trim()).filter(s => s);
                contentText.innerHTML = `<p>${updatedData.synonyms.length > 0 ? updatedData.synonyms.join(', ') : 'No synonyms added yet'}</p>`;
            } else { // Meaning
                updatedData.meaning = textarea.value.trim();
                contentText.innerHTML = `<p>${updatedData.meaning || 'No meaning added yet'}</p>`;
            }
        });

        // Update word details
        this.onSave(updatedData);

        // Hide edit areas and show content texts
        editableContents.forEach(content => {
            content.querySelector('.content-text').style.display = 'block';
            content.querySelector('.edit-area').style.display = 'none';
        });
        this.popup.querySelector('.popup-edit-actions').style.display = 'none';
    }

    handleCancel() {
        const editableContents = this.popup.querySelectorAll('.editable-content');
        editableContents.forEach(content => {
            const contentText = content.querySelector('.content-text');
            const editArea = content.querySelector('.edit-area');
            const textarea = editArea.querySelector('.edit-input');
            const type = content.dataset.type;

            // Reset textarea value to original content
            if (type === 'examples') {
                textarea.value = this.wordObj.examples ? this.wordObj.examples.join('\n') : '';
            } else if (type === 'synonyms') {
                textarea.value = this.wordObj.synonyms ? this.wordObj.synonyms.join(', ') : '';
            } else { // Meaning
                textarea.value = this.wordObj.meaning || '';
            }

            contentText.style.display = 'block';
            editArea.style.display = 'none';
        });
        this.popup.querySelector('.popup-edit-actions').style.display = 'none';
    }

    handleClose() {
        clearTimeout(this.closeTimeout);
        this.updatePopupState('hidden');
    }

    updatePopupState(newState) {
        this.currentState = newState;
        switch (newState) {
            case 'hidden':
                this.popup.classList.remove('show');
                this.isPopupSticky = false;
                break;
            case 'showing':
                this.closeAllPopups();
                this.popup.classList.add('show');
                this.isPopupSticky = false;
                break;
            case 'sticky':
                this.popup.classList.add('show');
                this.isPopupSticky = true;
                break;
        }
    }

    closeAllPopups() {
        document.querySelectorAll('.word-details-popup.show').forEach(p => {
            p.classList.remove('show');
            p.style.visibility = 'hidden';
            p.style.opacity = '0';
        });
    }

    positionPopup(infoIcon) {
        const popupHeight = this.popup.offsetHeight;
        const popupWidth = this.popup.offsetWidth;
        
        const infoIconRect = infoIcon.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        let top = infoIconRect.bottom + 10;
        let left = infoIconRect.left - (popupWidth / 2) + (infoIconRect.width / 2);
        
        let isPositionedAbove = false;
        if (top + popupHeight > viewportHeight) {
            top = infoIconRect.top - popupHeight - 10;
            isPositionedAbove = true;
        }
        
        if (top < 0) {
            top = 10;
            isPositionedAbove = false;
        }
        
        if (left + popupWidth > viewportWidth) {
            left = viewportWidth - popupWidth - 10;
        }
        
        if (left < 10) {
            left = 10;
        }
        
        this.popup.style.top = `${top}px`;
        this.popup.style.left = `${left}px`;
        
        const arrowOffset = Math.min(
            Math.max(infoIconRect.left - left + (infoIconRect.width / 2), 20),
            popupWidth - 40
        );
        this.popup.style.setProperty('--arrow-offset', `${arrowOffset}px`);
        
        if (isPositionedAbove) {
            this.popup.classList.add('arrow-down');
            this.popup.classList.remove('arrow-up');
        } else {
            this.popup.classList.add('arrow-up');
            this.popup.classList.remove('arrow-down');
        }
    }

    show(infoIcon) {
        this.closeAllPopups();
        
        requestAnimationFrame(() => {
            this.positionPopup(infoIcon);
            this.updatePopupState('showing');

            clearTimeout(this.closeTimeout);
            this.closeTimeout = setTimeout(() => {
                this.updatePopupState('sticky');
            }, 3000);
        });
    }

    playSound(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    }

    setOnSave(callback) {
        this.onSave = callback;
    }
} 