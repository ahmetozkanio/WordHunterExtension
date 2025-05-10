document.addEventListener('DOMContentLoaded', () => {
  // DOM element references
  const wordList = document.getElementById('wordList');
  const wordCount = document.getElementById('wordCount');
  const exportBtn = document.getElementById('exportBtn');
  const exportDropdown = document.getElementById('exportDropdown');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const exportTxtBtn = document.getElementById('exportTxtBtn');
  const importBtn = document.getElementById('importBtn');
  const fileInput = document.getElementById('fileInput');
  const settingsIcon = document.querySelector('.settings-icon');
  const settingsPanel = document.querySelector('.settings-panel');
  const settingsCloseBtn = document.querySelector('.settings-panel .close-btn');
  const infoIcon = document.querySelector('.info-icon');
  const infoPanel = document.querySelector('.info-panel');
  const closeBtn = document.querySelector('.info-panel .close-btn');

  // Tab switching functionality
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      tab.classList.add('active');
      const targetContent = document.getElementById(tab.dataset.tab);
      targetContent.classList.add('active');
      
      if (tab.dataset.tab === 'learning') {
        loadLearningProgress();
      } else {
        loadWords();
      }
    });
  });

  function createLevelBadge(level) {
    const tooltips = {
      1: "Newly learned - Just started learning this word",
      2: "Learning in progress - Getting familiar with the word",
      3: "Well learned - Good understanding of the word",
      4: "Very well learned - Strong knowledge of the word",
      5: "Mastered - Complete mastery of the word"
    };

    const checkIcon = level < 5 ? `
      <span class="level-up-icon" title="Level up" data-level="${level}">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
        </svg>
      </span>
    ` : '';

    return `<span class="level-badge level-${level}" data-level="${level}" data-tooltip="${tooltips[level]}">
      ${level}${checkIcon}
    </span>`;
  }

  function levelUp(word, currentLevel) {
    if (currentLevel >= 5) return; // Maximum level kontrol
    
    const newLevel = currentLevel + 1;
    chrome.storage.local.get(['words'], result => {
      const words = result.words || [];
      const wordIndex = words.findIndex(w => w.word === word);
      
      if (wordIndex !== -1) {
        words[wordIndex].level = newLevel;
        chrome.storage.local.set({ words }, () => {
          const activeTab = document.querySelector('.tab.active');
          if (activeTab.dataset.tab === 'learning') {
            loadLearningProgress();
          } else {
            loadWords();
          }
        });
      }
    });
  }

  function createLevelDropdown(wordObj) {
    const dropdown = document.createElement('div');
    dropdown.className = 'level-dropdown';
    dropdown.innerHTML = Array.from({length: 5}, (_, i) => i + 1)
      .map(level => `<span class="level-option level-${level}" data-level="${level}">Level ${level}</span>`)
      .join('');
    return dropdown;
  }

  function updateWordLevel(word, newLevel) {
    chrome.storage.local.get(['words'], result => {
      const words = result.words || [];
      const wordIndex = words.findIndex(w => w.word === word);
      
      if (wordIndex !== -1) {
        words[wordIndex].level = newLevel;
        chrome.storage.local.set({ words }, () => {
          const activeTab = document.querySelector('.tab.active');
          if (activeTab.dataset.tab === 'learning') {
            loadLearningProgress();
          } else {
            loadWords();
          }
        });
      }
    });
  }

  function createWordItem(wordObj) {
    const activeTab = document.querySelector('.tab.active');
    const isLearningTab = activeTab.dataset.tab === 'learning';

    const wordItem = document.createElement('div');
    wordItem.className = 'word-item';
    wordItem.innerHTML = `
      <span class="word-text">
        ${wordObj.count > 1 ? `<span class="word-count-badge">${wordObj.count}</span>` : ''}
        ${wordObj.word}
        ${isLearningTab ? createLevelBadge(wordObj.level || 1) : `<span class="level-badge level-${wordObj.level || 1}" data-level="${wordObj.level || 1}">${wordObj.level || 1}</span>`}
      </span>
      <div class="word-actions">
        <span class="sound-icon" title="Play Sound" data-word="${wordObj.word}">🎧</span>
        <a href="https://translate.google.com/?sl=auto&tl=tr&text=${encodeURIComponent(wordObj.word)}&op=translate" target="_blank" title="Google Translate">
          <img src="images/google-translate-icon.png" alt="Google Translate" class="icon">
        </a>
        <span class="delete-icon" title="Delete" data-word="${wordObj.word}">❌</span>
      </div>
    `;

    // Level badge click handler for both tabs
    const levelBadge = wordItem.querySelector('.level-badge');
    levelBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      const allDropdowns = document.querySelectorAll('.level-dropdown');
      allDropdowns.forEach(d => {
        if (d !== dropdown) {
          d.classList.remove('show');
        }
      });
      dropdown.classList.toggle('show');
    });

    // Create and append level dropdown for both tabs
    const dropdown = document.createElement('div');
    dropdown.className = 'level-dropdown';
    dropdown.innerHTML = Array.from({length: 5}, (_, i) => i + 1)
      .map(level => `<span class="level-option level-${level} ${level === (wordObj.level || 1) ? 'current' : ''}" 
        data-level="${level}" 
        data-word="${wordObj.word}">
        ${level}
      </span>`)
      .join('');
    levelBadge.appendChild(dropdown);

    // Level options click handler for both tabs
    dropdown.addEventListener('click', (e) => {
      const option = e.target.closest('.level-option');
      if (option) {
        e.stopPropagation();
        const newLevel = parseInt(option.dataset.level);
        const word = option.dataset.word;
        updateWordLevel(word, newLevel);
      }
    });

    // Level up icon click handler (only in Learning tab)
    if (isLearningTab) {
      const levelUpIcon = wordItem.querySelector('.level-up-icon');
      if (levelUpIcon) {
        levelUpIcon.addEventListener('click', (e) => {
          e.stopPropagation();
          const currentLevel = parseInt(e.currentTarget.dataset.level);
          levelUp(wordObj.word, currentLevel);
        });
      }
    }

    // Add other event listeners
    const wordText = wordItem.querySelector('.word-text');
    wordText.addEventListener('dblclick', handleWordEdit);

    const soundIcon = wordItem.querySelector('.sound-icon');
    soundIcon.addEventListener('click', () => {
      playSound(wordObj.word);
    });

    const deleteIcon = wordItem.querySelector('.delete-icon');
    deleteIcon.addEventListener('click', () => {
      deleteWord(wordObj.word);
    });

    return wordItem;
  }

  // Load and display saved words
  function loadWords() {
    chrome.storage.local.get(['words'], result => {
      const words = result.words || [];
      wordCount.textContent = `Total Words: ${words.length}`;
      
      wordList.innerHTML = '';
      
      // Group words by date
      const groupedWords = words.reduce((groups, word) => {
        const date = new Date(word.date);
        const dateKey = date.toLocaleDateString();
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(word);
        return groups;
      }, {});

      // Sort dates in descending order
      const sortedDates = Object.keys(groupedWords).sort((a, b) => 
        new Date(b) - new Date(a)
      );

      // Create sections for each date
      sortedDates.forEach(dateKey => {
        const dateWords = groupedWords[dateKey];
        const dateSection = document.createElement('div');
        dateSection.className = 'date-section';
        
        const dateHeader = document.createElement('div');
        dateHeader.className = 'date-header';
        const wordCount = dateWords.length;
        dateHeader.innerHTML = `
          <div class="date-info">
            <span class="date-text">${dateKey}</span>
            <span class="date-word-count">(${wordCount} word${wordCount !== 1 ? 's' : ''})</span>
          </div>
          <span class="toggle-icon">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
            </svg>
          </span>
        `;

        const wordContainer = document.createElement('div');
        wordContainer.className = 'word-container';

        dateWords.sort((a, b) => new Date(b.date) - new Date(a.date))
          .forEach(wordObj => {
            wordContainer.appendChild(createWordItem(wordObj));
          });

        dateSection.appendChild(dateHeader);
        dateSection.appendChild(wordContainer);
        wordList.appendChild(dateSection);

        // Add click event for collapsible functionality
        dateHeader.addEventListener('click', () => {
          dateSection.classList.toggle('collapsed');
          const toggleIcon = dateHeader.querySelector('.toggle-icon');
          toggleIcon.style.transform = dateSection.classList.contains('collapsed') ? 'rotate(-90deg)' : 'rotate(0)';
        });
      });
    });
  }

  function loadLearningProgress() {
    chrome.storage.local.get(['words'], result => {
      const words = result.words || [];
      const learningList = document.getElementById('learningList');
      learningList.innerHTML = '';

      // Group words by level
      const groupedByLevel = words.reduce((groups, word) => {
        const level = word.level || 1;
        if (!groups[level]) {
          groups[level] = [];
        }
        groups[level].push({...word});
        return groups;
      }, {});

      // Create sections for each level (1 to 5)
      for (let level = 1; level <= 5; level++) {
        const levelWords = groupedByLevel[level] || [];
        if (levelWords.length > 0) {
          const levelSection = document.createElement('div');
          levelSection.className = 'date-section';
          
          const levelHeader = document.createElement('div');
          levelHeader.className = 'date-header';
          
          levelHeader.classList.add(`level-${level}`);

          levelHeader.innerHTML = `
            <div class="date-info">
              <span class="level-badge level-${level}">Level ${level}</span>
              <span class="date-word-count">(${levelWords.length} word${levelWords.length !== 1 ? 's' : ''})</span>
            </div>
            <span class="toggle-icon">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
              </svg>
            </span>
          `;

          const wordContainer = document.createElement('div');
          wordContainer.className = 'word-container';

          // Sort words by date within each level
          levelWords.sort((a, b) => new Date(b.date) - new Date(a.date));

          levelWords.forEach(wordObj => {
            const wordItem = createWordItem(wordObj);
            wordContainer.appendChild(wordItem);
          });

          levelSection.appendChild(levelHeader);
          levelSection.appendChild(wordContainer);
          learningList.appendChild(levelSection);

          // Add click event for collapsible functionality
          levelHeader.addEventListener('click', () => {
            levelSection.classList.toggle('collapsed');
            const toggleIcon = levelHeader.querySelector('.toggle-icon');
            toggleIcon.style.transform = levelSection.classList.contains('collapsed') ? 'rotate(-90deg)' : 'rotate(0)';
          });
        }
      }

      // Update word count
      wordCount.textContent = `Total Words: ${words.length}`;
    });
  }

  // Function to play sound using SpeechSynthesis API
  function playSound(word) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US'; // Set language to English
    window.speechSynthesis.speak(utterance);
  }

  // Function to delete a word
  function deleteWord(wordToDelete) {
    chrome.storage.local.get(['words'], result => {
      const words = result.words || [];
      const updatedWords = words.filter(word => word.word !== wordToDelete);
      chrome.storage.local.set({ words: updatedWords }, () => {
        // Reload both views to keep them in sync
        loadWords();
        loadLearningProgress();
        
        // Update the active view based on current tab
        const activeTab = document.querySelector('.tab.active');
        if (activeTab.dataset.tab === 'learning') {
          loadLearningProgress();
        } else {
          loadWords();
        }
      });
    });
  }

  // Function to handle word editing
  function handleWordEdit(event) {
    // Get the word-text span (either the clicked element or its parent)
    const wordSpan = event.target.classList.contains('word-text') ? 
                    event.target : 
                    event.target.closest('.word-text');
    
    // Find the actual word content (skip the count badge if it exists)
    const wordContent = Array.from(wordSpan.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent.trim())
      .join('');

    const input = document.createElement('input');
    input.type = 'text';
    input.value = wordContent;
    input.className = 'edit-input';
    
    // Replace the span with input
    wordSpan.style.display = 'none';
    wordSpan.parentNode.insertBefore(input, wordSpan);
    input.focus();

    function saveEdit() {
      const newWord = input.value.trim();
      if (newWord && newWord !== wordContent) {
        chrome.storage.local.get(['words'], result => {
          const words = result.words || [];
          const wordIndex = words.findIndex(w => w.word === wordContent);
          
          if (wordIndex !== -1) {
            words[wordIndex].word = newWord;
            chrome.storage.local.set({ words }, () => {
              loadWords(); // Reload the word list
            });
          }
        });
      } else {
        // If no changes or empty, just restore the original display
        wordSpan.style.display = '';
        input.remove();
      }
    }

    // Save on enter key
    input.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        saveEdit();
      } else if (e.key === 'Escape') {
        wordSpan.style.display = '';
        input.remove();
      }
    });

    // Save on blur (when input loses focus)
    input.addEventListener('blur', saveEdit);
  }

  // Export to CSV
  exportCsvBtn.addEventListener('click', () => {
    chrome.storage.local.get(['words'], result => {
      const words = result.words || [];
      if (words.length === 0) return;
      let csv = '"Word";"Date"\n';
      csv += words.map(word =>
        `"${word.word.replace(/"/g, '""')}";"${new Date(word.date).toLocaleString()}"`
      ).join("\n");
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'wordhunter.csv';
      link.click();
    });
  });

  // Export to JSON
  exportJsonBtn.addEventListener('click', () => {
    chrome.storage.local.get(['words'], result => {
      const words = result.words || [];
      if (words.length === 0) return;
      const json = JSON.stringify(words, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'wordhunter.json';
      link.click();
    });
  });

  // Export to TXT
  exportTxtBtn.addEventListener('click', () => {
    chrome.storage.local.get(['words'], result => {
      const words = result.words || [];
      if (words.length === 0) return;
      const txt = words.map(word => word.word).join("\n");
      const blob = new Blob([txt], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'wordhunter.txt';
      link.click();
    });
  });

  // Import functionality
  importBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      let importedWords = [];
      const fileContent = e.target.result;
      const fileExtension = file.name.split('.').pop().toLowerCase();

      try {
        switch (fileExtension) {
          case 'json':
            importedWords = JSON.parse(fileContent);
            // Validate JSON structure
            if (!Array.isArray(importedWords)) {
              throw new Error('Invalid JSON format. Expected an array of words.');
            }
            importedWords = importedWords.map(item => ({
              word: item.word || '',
              date: item.date || new Date().toISOString()
            }));
            break;

          case 'csv':
            const lines = fileContent.split('\n');
            // Skip header row and process each line
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (line) {
                const [word, date] = line.split(';').map(item => 
                  item.replace(/^"(.*)"$/, '$1').trim()
                );
                if (word) {
                  importedWords.push({
                    word,
                    date: date || new Date().toISOString()
                  });
                }
              }
            }
            break;

          case 'txt':
            const words = fileContent.split('\n');
            importedWords = words
              .map(word => word.trim())
              .filter(word => word.length > 0)
              .map(word => ({
                word,
                date: new Date().toISOString()
              }));
            break;

          default:
            throw new Error('Unsupported file format');
        }

        // Merge imported words with existing words
        chrome.storage.local.get(['words'], result => {
          const existingWords = result.words || [];
          const newWords = [...existingWords];
          
          // Add only non-duplicate words
          importedWords.forEach(importedWord => {
            if (!existingWords.some(existing => existing.word === importedWord.word)) {
              newWords.push(importedWord);
            }
          });

          chrome.storage.local.set({ words: newWords }, () => {
            loadWords(); // Refresh the word list
            fileInput.value = ''; // Reset file input
          });
        });

      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing file. Please check the file format.');
      }
    };

    reader.readAsText(file);
  });

  // Toggle dropdown menu
  exportBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exportDropdown.classList.toggle('show');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#exportBtn') && !e.target.closest('#exportDropdown')) {
      exportDropdown.classList.remove('show');
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('level-badge')) {
      const allDropdowns = document.querySelectorAll('.level-dropdown');
      allDropdowns.forEach(d => d.classList.remove('show'));
    }
  });

  // Info panel functionality
  document.querySelector('.icon-wrapper:has(.info-icon)').addEventListener('click', () => {
    infoPanel.classList.toggle('show');
  });

  // Settings panel functionality
  document.querySelector('.icon-wrapper:has(.settings-icon)').addEventListener('click', () => {
    // Close info panel if it's open
    infoPanel.classList.remove('show');
    settingsPanel.classList.toggle('show');
  });

  // Close panels when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.icon-wrapper') && 
        !e.target.closest('.settings-panel') && 
        !e.target.closest('#exportDropdown')) {
      settingsPanel.classList.remove('show');
    }
    if (!e.target.closest('.icon-wrapper') && 
        !e.target.closest('.info-panel')) {
      infoPanel.classList.remove('show');
    }
  });

  // Initial load - starting with Learning Progress
  loadLearningProgress();
});