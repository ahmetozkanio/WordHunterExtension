// Import WordManager
import wordManager from './wordManager.js';

// Icon paths
const ICON_PATHS = {
  sound: "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",
  translate: "M21 4H11l-1-3H3c-1.1 0-2 .9-2 2v15c0 1.1.9 2 2 2h8l1 3h9c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM7 16c-2.76 0-5-2.24-5-5s2.24-5 5-5c1.35 0 2.48.5 3.35 1.3L9.03 8.57c-.38-.36-1.04-.78-2.03-.78-1.74 0-3.15 1.44-3.15 3.21S5.26 14.21 7 14.21c2.01 0 2.84-1.44 2.92-2.21H7v-1.57h4.68c.07.31.12.61.12 1.02C11.8 13.97 9.89 16 7 16zm6.17-5.42h3.7c-.43 1.25-1.11 2.43-2.05 3.47-.31-.35-.6-.72-.86-1.1l-.79-2.37zm8.33 9.92c0 .55-.45 1-1 1H14l2-2.5-1.04-3.1 3.1 3.1.92-.92-3.3-3.25.02-.02c1.13-1.25 1.93-2.69 2.4-4.22H20v-1.3h-4.53V8h-1.29v1.29h-1.44L11.46 5.5h9.04c.55 0 1 .45 1 1v14z",
  delete: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  info: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
  settings: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
  levelUp: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z",
  toggleDown: "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z",
  copy: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
};

 // Level to interval mapping for spaced repetition
 const LEVEL_STYLES = {
  0: {
    tooltip: "Not studied yet - Word is not in the learning system. Click 'Review' to start learning this word.",
    reviewInterval: 0, // No review needed
    nextLevelThreshold: 1 // Move to level 1 after first review
  },
  1: {
    tooltip: "Newly learned - Review today",
    reviewInterval: 0, // Review today
    nextLevelThreshold: 1 // Need 1 successful review to move to level 2
  },
  2: {
    tooltip: "Learning in progress - Review tomorrow",
    reviewInterval: 1, // Review tomorrow
    nextLevelThreshold: 1 // Need 1 successful review to move to level 3
  },
  3: {
    tooltip: "Well learned - Review in 4 days",
    reviewInterval: 4, // Review in 4 days
    nextLevelThreshold: 1 // Need 1 successful review to move to level 4
  },
  4: {
    tooltip: "Very well learned - Review in 7 days",
    reviewInterval: 7, // Review in 1 week
    nextLevelThreshold: 1 // Need 1 successful review to move to level 5
  },
  5: {
    tooltip: "Almost mastered - Review in 14 days",
    reviewInterval: 14, // Review in 2 weeks
    nextLevelThreshold: 1 // Need 1 successful review to move to level 6
  },
  6: {
    tooltip: "Mastered - Review in 30 days",
    reviewInterval: 30, // Review in 1 month
    nextLevelThreshold: 1 // Maximum level, no further progression
  }
};

document.addEventListener('DOMContentLoaded', async () => {

    // DOM element references
    const wordList = document.getElementById('wordList');
    const wordCount = document.getElementById('wordCount');
    const exportBtn = document.getElementById('exportBtn');
    const exportDropdown = document.getElementById('exportDropdown');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const exportTxtBtn = document.getElementById('exportTxtBtn');
    const importBtn = document.getElementById('importBtn');
    const copyWordsBtn = document.getElementById('copyWordsBtn');
    const copyWordsText = document.getElementById('copyWordsText');
    const fileInput = document.getElementById('fileInput');
    const settingsPanel = document.querySelector('.settings-panel');
    const settingsCloseBtn = document.querySelector('.settings-panel .close-btn');
    const infoPanel = document.querySelector('.info-panel');
    const closeBtn = document.querySelector('.info-panel .close-btn');
    // Ensure default tab is set and visible
    const defaultTab = document.querySelector('.tab[data-tab="repetition"]');
    const defaultContent = document.getElementById('repetition');

    // Notification Settings
    const notificationToggle = document.getElementById('notificationToggle');
    const notificationTime = document.getElementById('notificationTime');

  try {
    // Initialize WordManager
    await wordManager.initialize();

    // Initial setup and data loading
    await loadNotificationSettings();
    await migrateOldData();
    await wordManager.checkMissedReviews();
    
    if (defaultTab && defaultContent) {
      // Remove active class from all tabs and contents
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Set default tab and content as active
      defaultTab.classList.add('active');
      defaultContent.classList.add('active');
      
      // Load initial content
      await loadSpacedRepetition();
    } else {
      console.error('Default tab or content not found');
    }

    // Add listener for word changes after all functions are defined
    wordManager.addListener(words => {
      loadWords();
      loadLearningProgress();
      loadSpacedRepetition();
    });

  } catch (error) {
    console.error('Error during initial setup:', error);
  }

  // Create SVG icon helper function
  function createSvgIcon(name, size = 18, additionalClasses = '') {
    return `<svg class="icon-base ${additionalClasses}" viewBox="0 0 24 24" width="${size}" height="${size}">
      <path fill="currentColor" d="${ICON_PATHS[name]}"/>
    </svg>`;
  }

  // Tab switching functionality
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked tab and its content
      tab.classList.add('active');
      const targetContent = document.getElementById(tab.dataset.tab);
      if (targetContent) {
        targetContent.classList.add('active');
      }
      
      // Load appropriate content
      switch (tab.dataset.tab) {
        case 'repetition':
          loadSpacedRepetition();
          break;
        case 'learning':
          loadLearningProgress();
          break;
        default:
          loadWords();
      }
    });
  });

 

  function createSimpleLevelBadge(level) {
    const style = LEVEL_STYLES[level] || LEVEL_STYLES[0];
    return `<span class="level-badge level-${level}" 
      data-level="${level}" 
      data-tooltip="${style.tooltip}"
      style="color: ${style.color}; background-color: ${style.bgColor}; border-color: ${style.borderColor};">
      ${level}
    </span>`;
  }

  function createLevelBadge(level, isInReview = false) {
    const style = LEVEL_STYLES[level] || LEVEL_STYLES[0];
    const checkIcon = level < 6 ? `
      <span class="level-up-icon" title="Level up" data-level="${level}">
        ${createSvgIcon('levelUp', 16)}
      </span>
    ` : '';

    // Show review button for level 0 words
    const reviewButton = level === 0 ? `
      <span class="review-button ${isInReview ? 'in-review' : ''}" title="${isInReview ? 'In Review' : 'Start Review'}">
        ${isInReview ? 'In Review' : 'Review'}
      </span>
    ` : '';

    return `<span class="level-badge level-${level}" 
      data-level="${level}" 
      data-tooltip="${style.tooltip}"
      style="color: ${style.color}; background-color: ${style.bgColor}; border-color: ${style.borderColor};">
      ${level}${checkIcon}
    </span>${reviewButton}`;
  }

  function createWordItem(wordObj) {
    const activeTab = document.querySelector('.tab.active');
    const isLearningTab = activeTab.dataset.tab === 'learning' || activeTab.dataset.tab === 'repetition';

    const wordItem = document.createElement('div');
    wordItem.className = 'word-item';
    wordItem.innerHTML = `
      <span class="word-text">
        ${wordObj.encounterCount > 1 ? `<span class="word-count-badge">${wordObj.encounterCount}</span>` : ''}
        ${wordObj.word}
        ${isLearningTab ? createLevelBadge(wordObj.learningLevel || 0, wordObj.isInReview) : createSimpleLevelBadge(wordObj.learningLevel || 0)}
      </span>
      <div class="word-actions">
        <span class="icon-wrapper sound-icon" title="Play Sound" data-word="${wordObj.word}">
          ${createSvgIcon('sound')}
        </span>
        <a href="https://translate.google.com/?sl=auto&tl=tr&text=${encodeURIComponent(wordObj.word)}&op=translate" 
           target="_blank" 
           title="Google Translate" 
           class="icon-wrapper translate-icon">
          ${createSvgIcon('translate')}
        </a>
        <span class="icon-wrapper delete-icon" title="Delete" data-word="${wordObj.word}">
          ${createSvgIcon('delete')}
        </span>
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

    // Add review button click handler
    const reviewButton = wordItem.querySelector('.review-button');
    if (reviewButton) {
      reviewButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentLevel = wordObj.learningLevel || 0;
        if (typeof wordObj.word === 'string' && wordObj.word.trim() !== '') {
          updateWordProgress(wordObj.word, currentLevel);
        } else {
          console.error('Invalid word object:', wordObj);
        }
      });
    }

    // Create and append level dropdown for both tabs
    const dropdown = document.createElement('div');
    dropdown.className = 'level-dropdown';
    dropdown.innerHTML = Array.from({length: 7}, (_, i) => i) // 0'dan 6'ya kadar
      .map(level => `<span class="level-option level-${level} ${level === (wordObj.learningLevel || 0) ? 'current' : ''}" 
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
        if (typeof word === 'string' && word.trim() !== '' && !isNaN(newLevel) && newLevel >= 0 && newLevel <= 6) {
          updateWordProgress(word, newLevel);
        } else {
          console.error('Invalid level option data:', { word, newLevel });
        }
      }
    });

    // Level up icon click handler (only in Learning tab)
    if (isLearningTab) {
      const levelUpIcon = wordItem.querySelector('.level-up-icon');
      if (levelUpIcon) {
        levelUpIcon.addEventListener('click', (e) => {
          e.stopPropagation();
          const currentLevel = parseInt(e.currentTarget.dataset.level);
          if (!isNaN(currentLevel) && currentLevel >= 0 && currentLevel < 6) {
            updateWordProgress(wordObj.word, currentLevel + 1);
          } else {
            console.error('Invalid level for level up:', currentLevel);
          }
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

  // Function to load and display saved words
  function loadWords() {
    const words = wordManager.getWords();
    wordCount.textContent = `Total Words: ${words.length}`;
    
    wordList.innerHTML = '';
    
    // Group words by date
    const groupedWords = words.reduce((groups, word) => {
      const date = new Date(word.addedDate || word.date);
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
      
      dateSection.classList.add('collapsed');
      const dateHeader = document.createElement('div');
      dateHeader.className = 'date-header';
      const wordCount = dateWords.length;
      dateHeader.innerHTML = `
        <div class="date-info">
          <span class="date-text">${dateKey}</span>
          <span class="date-word-count">(${wordCount} word${wordCount !== 1 ? 's' : ''})</span>
        </div>
        <span class="toggle-icon">
          ${createSvgIcon('toggleDown', 16)}
        </span>
      `;

      const wordContainer = document.createElement('div');
      wordContainer.className = 'word-container';

      // Sort words by date within each section
      dateWords.sort((a, b) => {
        const dateA = new Date(a.addedDate || a.date);
        const dateB = new Date(b.addedDate || b.date);
        return dateB - dateA;
      }).forEach(wordObj => {
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

      // Set initial toggle icon rotation for collapsed sections
      if (dateSection.classList.contains('collapsed')) {
        const toggleIcon = dateHeader.querySelector('.toggle-icon');
        toggleIcon.style.transform = 'rotate(-90deg)';
      }
    });
  }

  // Function to load learning progress
  function loadLearningProgress() {
    const words = wordManager.getWords();
    const learningList = document.getElementById('learningList');
    learningList.innerHTML = '';

    // Group words by level
    const groupedByLevel = words.reduce((groups, word) => {
      const level = word.learningLevel || 0;
      if (!groups[level]) {
        groups[level] = [];
      }
      groups[level].push({...word});
      return groups;
    }, {});

    // Create sections for each level (0 to 6)
    for (let level = 0; level <= 6; level++) {
      const levelWords = groupedByLevel[level] || [];
      if (levelWords.length > 0) {
        const levelSection = document.createElement('div');
        levelSection.className = 'date-section';
        
        levelSection.classList.add('collapsed');
        
        const levelHeader = document.createElement('div');
        levelHeader.className = 'date-header';
        
        const style = LEVEL_STYLES[level] || LEVEL_STYLES[0];
        levelHeader.innerHTML = `
          <div class="date-info">
            <span class="level-badge level-${level}" 
              style="color: ${style.color}; background-color: ${style.bgColor}; border-color: ${style.borderColor};">
              Level ${level}
            </span>
            <span class="date-word-count">(${levelWords.length} word${levelWords.length !== 1 ? 's' : ''})</span>
          </div>
          <span class="toggle-icon">
            ${createSvgIcon('toggleDown', 16)}
          </span>
        `;

        const wordContainer = document.createElement('div');
        wordContainer.className = 'word-container';

        // Sort words by date within each level
        levelWords.sort((a, b) => {
          const dateA = new Date(a.addedDate || a.date);
          const dateB = new Date(b.addedDate || b.date);
          return dateB - dateA;
        });

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

        // Set initial toggle icon rotation for collapsed sections
        if (levelSection.classList.contains('collapsed')) {
          const toggleIcon = levelHeader.querySelector('.toggle-icon');
          toggleIcon.style.transform = 'rotate(-90deg)';
        }
      }
    }

    // Update word count
    wordCount.textContent = `Total Words: ${words.length}`;
  }

  // Function to load spaced repetition
  async function loadSpacedRepetition() {
    try {
      const groupedWords = wordManager.getWordsGroupedByReviewStatus();
      const repetitionList = document.getElementById('repetitionList');
      
      if (!repetitionList) {
        console.error('repetitionList element not found');
        return;
      }
      
      repetitionList.innerHTML = '';

      // Create sections for each group
      if (groupedWords.today && groupedWords.today.length > 0) {
        const todaySection = createReviewSection('Today\'s Reviews', groupedWords.today);
        repetitionList.appendChild(todaySection);
      }

      // Create sections for future reviews
      if (groupedWords.future) {
        // Sort future dates
        const sortedDates = Object.keys(groupedWords.future).sort();
        
        // Show only next 7 days of reviews
        sortedDates.slice(0, 7).forEach(dateKey => {
          const words = groupedWords.future[dateKey];
          const date = new Date(dateKey);
          const tomorrow = wordManager.addDays(wordManager.getTodayUTC(), 1);
          
          let sectionTitle;
          if (wordManager.compareDates(date, tomorrow) === 0) {
            sectionTitle = 'Tomorrow\'s Reviews';
          } else {
            sectionTitle = date.toLocaleDateString() + ' Reviews';
          }
          
          const futureSection = createReviewSection(sectionTitle, words);
          repetitionList.appendChild(futureSection);
        });
      }

      // Create section for not started words
      if (groupedWords.notStarted && groupedWords.notStarted.length > 0) {
        const notStartedSection = createReviewSection('Not Started', groupedWords.notStarted);
        repetitionList.appendChild(notStartedSection);
      }
    } catch (error) {
      console.error('Error loading spaced repetition:', error);
    }
  }

  // Function to delete a word
  function deleteWord(wordToDelete) {
    wordManager.deleteWord(wordToDelete);
  }

  // Function to handle word editing
  function handleWordEdit(event) {
    const wordSpan = event.target.classList.contains('word-text') ? 
                    event.target : 
                    event.target.closest('.word-text');
    
    const wordContent = Array.from(wordSpan.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent.trim())
      .join('');

    const input = document.createElement('input');
    input.type = 'text';
    input.value = wordContent;
    input.className = 'edit-input';
    
    wordSpan.style.display = 'none';
    wordSpan.parentNode.insertBefore(input, wordSpan);
    input.focus();

    function saveEdit() {
      const newWord = input.value.trim();
      if (newWord && newWord !== wordContent) {
        wordManager.editWord(wordContent, newWord);
      } else {
        wordSpan.style.display = '';
        input.remove();
      }
    }

    input.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        saveEdit();
      } else if (e.key === 'Escape') {
        wordSpan.style.display = '';
        input.remove();
      }
    });

    input.addEventListener('blur', saveEdit);
  }

  // Function to update word progress
  function updateWordProgress(word, newLevel) {
    wordManager.updateWordProgress(word, newLevel);
  }

  // Export to JSON
  exportJsonBtn.addEventListener('click', () => {
    const words = wordManager.getWords();
    if (words.length === 0) return;
    
    const exportData = words.map(word => ({
      word: word.word,
      meaning: word.meaning || "",
      examples: Array.isArray(word.examples) ? word.examples : [],
      isInReview: word.isInReview || false,
      encounterCount: word.encounterCount || 1,
      learningLevel: word.learningLevel || 0,
      addedDate: word.addedDate,
      repetitionHistory: Array.isArray(word.repetitionHistory) ? word.repetitionHistory : [],
      nextReviewDate: word.nextReviewDate
    }));

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'wordhunter.json';
    link.click();
  });

  // Export to CSV
  exportCsvBtn.addEventListener('click', () => {
    const words = wordManager.getWords();
    if (words.length === 0) return;
    
    let csv = '"Word";"Meaning";"Examples";"Is In Review";"Encounter Count";"Learning Level";"Added Date";"Next Review Date"\n';
    csv += words.map(word =>
      `"${word.word.replace(/"/g, '""')}";"${(word.meaning || '').replace(/"/g, '""')}";"${(word.examples || []).join(', ').replace(/"/g, '""')}";"${word.isInReview}";"${word.encounterCount || 1}";"${word.learningLevel || 0}";"${new Date(word.addedDate).toLocaleString()}";"${word.nextReviewDate ? new Date(word.nextReviewDate).toLocaleString() : ''}"`
    ).join("\n");
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'wordhunter.csv';
    link.click();
  });

  // Export to TXT
  exportTxtBtn.addEventListener('click', () => {
    const words = wordManager.getWords();
    if (words.length === 0) return;
    
    const txt = words.map(word => {
      const details = [
        `Word: ${word.word}`,
        `Meaning: ${word.meaning || ''}`,
        `Examples: ${(word.examples || []).join(', ')}`,
        `Is In Review: ${word.isInReview}`,
        `Learning Level: ${word.learningLevel || 0}`,
        `Encounter Count: ${word.encounterCount || 1}`,
        `Added Date: ${new Date(word.addedDate).toLocaleString()}`,
        `Next Review Date: ${word.nextReviewDate ? new Date(word.nextReviewDate).toLocaleString() : 'Not set'}`,
        '---'
      ].join('\n');
      return details;
    }).join('\n\n');

    const blob = new Blob([txt], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'wordhunter.txt';
    link.click();
  });

  // Copy Words functionality
  copyWordsBtn.addEventListener('click', () => {
    const words = wordManager.getWords();
    if (words.length === 0) return;

    const textToCopy = words.map(word => word.word).join('\n');
    const originalText = copyWordsText.textContent;

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        copyWordsText.textContent = '✅ Copied!';
        copyWordsBtn.disabled = true;

        setTimeout(() => {
          copyWordsText.textContent = originalText;
          copyWordsBtn.disabled = false;
        }, 3000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        copyWordsText.textContent = '❌ Failed';
        setTimeout(() => {
          copyWordsText.textContent = originalText;
        }, 3000);
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
            if (!Array.isArray(importedWords)) {
              throw new Error('Invalid JSON format. Expected an array of words.');
            }
            importedWords = importedWords.map(item => ({
              word: item.word || '',
              meaning: item.meaning || "",
              examples: Array.isArray(item.examples) ? item.examples : [],
              isInReview: item.isInReview || false,
              encounterCount: parseInt(item.encounterCount) || 1,
              learningLevel: parseInt(item.learningLevel) || 0,
              addedDate: item.addedDate || new Date().toISOString(),
              repetitionHistory: Array.isArray(item.repetitionHistory) ? item.repetitionHistory : [],
              nextReviewDate: item.nextReviewDate || null
            }));
            break;

          case 'csv':
            const lines = fileContent.split('\n');
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (line) {
                const [word, meaning, examples, isInReview, encounterCount, learningLevel, addedDate, nextReviewDate] = 
                  line.split(';').map(item => item.replace(/^"(.*)"$/, '$1').trim());
                
                if (word) {
                  importedWords.push({
                    word,
                    meaning: meaning || "",
                    examples: examples ? examples.split(',').map(e => e.trim()) : [],
                    isInReview: isInReview === 'true',
                    encounterCount: parseInt(encounterCount) || 1,
                    learningLevel: parseInt(learningLevel) || 0,
                    addedDate: addedDate || new Date().toISOString(),
                    repetitionHistory: [],
                    nextReviewDate: nextReviewDate || null
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
                meaning: "",
                examples: [],
                isInReview: false,
                encounterCount: 1,
                learningLevel: 0,
                addedDate: new Date().toISOString(),
                repetitionHistory: [],
                nextReviewDate: null
              }));
            break;

          default:
            throw new Error('Unsupported file format');
        }

        // Add imported words to WordManager
        for (const word of importedWords) {
          await wordManager.addWord(word.word);
        }

        fileInput.value = ''; // Reset file input
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

  // Function to generate level info list
  function generateLevelInfoList() {
    const infoPanel = document.querySelector('.info-panel');
    const levelInfoContainer = infoPanel.querySelector('.level-info-container');
    
    // Clear existing level info items
    levelInfoContainer.innerHTML = '';
    
    // Generate level info items
    Object.entries(LEVEL_STYLES).forEach(([level, style]) => {
      const levelInfo = document.createElement('div');
      levelInfo.className = 'level-info';
      levelInfo.innerHTML = `
        <span class="level-indicator level-${level}">Level ${level}</span>
        <span class="level-description">${style.tooltip}</span>
      `;
      levelInfoContainer.appendChild(levelInfo);
    });
  }

  // Info panel functionality
  const infoIconWrapper = document.querySelector('.header-actions .icon-wrapper:first-child');
  infoIconWrapper.addEventListener('click', () => {
    settingsPanel.classList.remove('show');
    infoPanel.classList.toggle('show');
    if (infoPanel.classList.contains('show')) {
      generateLevelInfoList();
    }
  });

  // Settings panel functionality
  const settingsIconWrapper = document.querySelector('.header-actions .icon-wrapper:nth-child(2)');
  settingsIconWrapper.addEventListener('click', () => {
    infoPanel.classList.remove('show');
    settingsPanel.classList.toggle('show');
  });

  // Close button functionality
  settingsCloseBtn.addEventListener('click', () => {
    settingsPanel.classList.remove('show');
  });

  closeBtn.addEventListener('click', () => {
    infoPanel.classList.remove('show');
  });

  // Close panels when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.header-actions .icon-wrapper:first-child') && 
        !e.target.closest('.info-panel')) {
      infoPanel.classList.remove('show');
    }
    if (!e.target.closest('.header-actions .icon-wrapper:nth-child(2)') && 
        !e.target.closest('.settings-panel') && 
        !e.target.closest('#exportDropdown')) {
      settingsPanel.classList.remove('show');
    }
  });

  // Date utility functions
  const DateUtils = {
    // Convert any date to local midnight UTC
    toLocalMidnightUTC: (date) => {
      // Get the date in local timezone
      const localDate = new Date(date);
      // Set to midnight in local timezone
      localDate.setHours(0, 0, 0, 0);
      // Convert to UTC
      const utcDate = new Date(Date.UTC(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate()
      ));
      return utcDate;
    },

    // Get today's date at local midnight UTC
    getTodayUTC: () => {
      const now = new Date();
      return DateUtils.toLocalMidnightUTC(now);
    },

    // Add days to a date
    addDays: (date, days) => {
      const result = new Date(date);
      result.setUTCDate(result.getUTCDate() + days);
      return result;
    },

    // Compare two dates (ignoring time)
    compareDates: (date1, date2) => {
      const d1 = DateUtils.toLocalMidnightUTC(date1);
      const d2 = DateUtils.toLocalMidnightUTC(date2);
      return d1.getTime() - d2.getTime();
    },

    // Format date for display
    formatDate: (date) => {
      const localDate = new Date(date);
      return localDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  function createReviewSection(title, words) {
    const section = document.createElement('div');
    section.className = 'date-section';
    
    // Add collapsed class by default if it's not Today's Reviews
    if (title !== 'Today\'s Reviews') {
      section.classList.add('collapsed');
    }
    
    const header = document.createElement('div');
    header.className = 'date-header';
    
    // Add success class for Today's Reviews
    if (title === 'Today\'s Reviews') {
      header.classList.add('success');
    }
    
    // Add copy icon for Today's Reviews
    const copyIcon = title === 'Today\'s Reviews' ? `
      <span class="copy-icon" title="Copy all words">
        ${createSvgIcon('copy', 16)}
      </span>
    ` : '';
    
    header.innerHTML = `
      <div class="date-info">
        <span class="section-title">${title}</span>
        <span class="date-word-count">(${words.length} word${words.length !== 1 ? 's' : ''})</span>
      </div>
      <div class="header-actions">
        ${copyIcon}
        <span class="toggle-icon">
          ${createSvgIcon('toggleDown', 16)}
        </span>
      </div>
    `;

    // Add copy functionality for Today's Reviews
    if (title === 'Today\'s Reviews') {
      const copyButton = header.querySelector('.copy-icon');
      copyButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent section collapse
        const wordsToCopy = words.map(word => word.word).join('\n');
        navigator.clipboard.writeText(wordsToCopy)
          .then(() => {
            // Show success feedback
            copyButton.classList.add('copied');
            setTimeout(() => {
              copyButton.classList.remove('copied');
            }, 2000);
          })
          .catch(err => {
            console.error('Failed to copy words:', err);
          });
      });
    }

    const wordContainer = document.createElement('div');
    wordContainer.className = 'word-container';

    // Sort words by next review date
    words.sort((a, b) => {
      const dateA = a.nextReviewDate ? new Date(a.nextReviewDate) : new Date(0);
      const dateB = b.nextReviewDate ? new Date(b.nextReviewDate) : new Date(0);
      return dateA - dateB;
    });

    words.forEach(wordObj => {
      const wordItem = createWordItem(wordObj);
      wordContainer.appendChild(wordItem);
    });

    section.appendChild(header);
    section.appendChild(wordContainer);

    // Add click event for collapsible functionality
    header.addEventListener('click', () => {
      section.classList.toggle('collapsed');
      const toggleIcon = header.querySelector('.toggle-icon');
      toggleIcon.style.transform = section.classList.contains('collapsed') ? 'rotate(-90deg)' : 'rotate(0)';
    });

    // Set initial toggle icon rotation for collapsed sections
    if (section.classList.contains('collapsed')) {
      const toggleIcon = header.querySelector('.toggle-icon');
      toggleIcon.style.transform = 'rotate(-90deg)';
    }

    return section;
  }

  // Storage işlemleri için yardımcı fonksiyonlar
  function saveToStorage(key, data) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: data }, () => {
        if (chrome.runtime.lastError) {
          console.error('Storage error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  function getFromStorage(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Storage error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[key]);
        }
      });
    });
  }

  // Eski modelden yeni modele geçiş fonksiyonu
  async function migrateOldData() {
    try {
      console.log('Starting migration process...');
      
      const oldData = await getFromStorage('words');
      console.log('Retrieved old data:', oldData);

      if (!oldData) {
        console.log('No data found to migrate');
        return;
      }

      // Veri formatını kontrol et
      if (!Array.isArray(oldData)) {
        console.error('Invalid data format: Expected array but got', typeof oldData);
        throw new Error('Invalid data format');
      }

      // Migration kontrolü - Eğer ilk kelime yeni formatta ise migration yapma
      if (oldData.length > 0 && 
          oldData[0].hasOwnProperty('repetitionHistory') && 
          Array.isArray(oldData[0].repetitionHistory)) {
        console.log('Data is already in new format (repetitionHistory exists)');
        return;
      }

      console.log('Starting migration from old format to new format...');
      console.log('Sample old data:', oldData[0]);
      
      const newData = oldData.map((oldWord, index) => {
        try {
          // Eski modeldeki alanları kontrol et ve yeni modele dönüştür
          const oldLevel = parseInt(oldWord.level) || 0; // Varsayılan olarak 0
          const newLevel = Math.max(0, oldLevel - 1); // Tüm levelleri 1 azalt

          // Tarih kontrolü ve düzeltmesi
          let addedDate = oldWord.date || new Date().toISOString();
          try {
            // Tarih formatını kontrol et ve düzelt
            const date = new Date(addedDate);
            if (isNaN(date.getTime())) {
              // Geçersiz tarih ise şu anki tarihi kullan
              addedDate = new Date().toISOString();
            } else {
              // Geçerli tarihi ISO formatına çevir
              addedDate = date.toISOString();
            }
          } catch (dateError) {
            console.warn(`Invalid date for word ${oldWord.word}, using current date`);
            addedDate = new Date().toISOString();
          }

          const newWord = {
            word: oldWord.word || '',
            meaning: oldWord.meaning || "",
            examples: Array.isArray(oldWord.examples) ? oldWord.examples : [],
            isInReview: oldWord.isInReview || false,
            encounterCount: parseInt(oldWord.count) || 1,
            learningLevel: newLevel,
            addedDate: addedDate,
            repetitionHistory: [], 
            nextReviewDate: null, 
          };

          // Veri doğrulama
          if (!newWord.word) {
            console.warn(`Word at index ${index} has no word property, skipping...`);
            return null;
          }

          console.log(`Migrating word: ${newWord.word}, Old level: ${oldLevel}, New level: ${newLevel}, Date: ${newWord.addedDate}`);
          return newWord;
        } catch (wordError) {
          console.error(`Error processing word at index ${index}:`, wordError);
          console.error('Problematic word data:', oldWord);
          return null;
        }
      }).filter(word => word !== null);

      console.log('Migration completed. New data sample:', newData[0]);
      console.log(`Migrated ${newData.length} words successfully`);

      // Yeni veriyi kaydet
      await saveToStorage('words', newData);
      console.log('New data saved successfully');
      
      // UI'ı güncelle
      const activeTab = document.querySelector('.tab.active');
      if (activeTab.dataset.tab === 'repetition') {
        loadSpacedRepetition();
      } else if (activeTab.dataset.tab === 'learning') {
        loadLearningProgress();
      } else {
        loadWords();
      }
    } catch (error) {
      console.error('Migration error details:', error);
      console.error('Error stack:', error.stack);
      
      let errorMessage = 'Veri dönüşümü sırasında bir hata oluştu: ';
      if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Bilinmeyen bir hata';
      }
      
      alert(errorMessage + '\n\nLütfen console\'da hata detaylarını kontrol edin.');
    }
  }

  // Load notification settings
  async function loadNotificationSettings() {
    const result = await chrome.storage.local.get(['notificationSettings']);
    const settings = result.notificationSettings || {
      enabled: true,
      time: '09:00'
    };
    
    notificationToggle.checked = settings.enabled;
    notificationTime.value = settings.time;
    notificationTime.disabled = !settings.enabled;
  }

  // Save notification settings
  async function saveNotificationSettings() {
    const settings = {
      enabled: notificationToggle.checked,
      time: notificationTime.value
    };
    
    await chrome.storage.local.set({ notificationSettings: settings });
    
    // Update alarm in background
    chrome.runtime.sendMessage({
      action: 'updateNotificationSettings',
      settings: settings
    });
  }

  // Event listeners for notification settings
  notificationToggle.addEventListener('change', () => {
    notificationTime.disabled = !notificationToggle.checked;
    saveNotificationSettings();
  });

  notificationTime.addEventListener('change', saveNotificationSettings);

  // Function to play sound for a word using Text-to-Speech
  function playSound(word) {
    console.log('Attempting to play sound for:', word);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      // Optionally set language, pitch, rate, volume
      // utterance.lang = 'en-US'; // Örnek: İngilizce
      // utterance.pitch = 1;
      // utterance.rate = 1;
      // utterance.volume = 1;

      utterance.onstart = () => {
        console.log('Speech synthesis started for:', word);
      };
      utterance.onend = () => {
        console.log('Speech synthesis ended for:', word);
      };
      utterance.onerror = (event) => {
        console.error('Speech synthesis error for', word, ':', event.error);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported in this browser.');
      // Fallback or error message if TTS is not supported
    }
  }
});