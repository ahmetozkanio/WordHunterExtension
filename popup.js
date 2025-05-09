document.addEventListener('DOMContentLoaded', () => {
  const wordList = document.getElementById('wordList');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const exportTxtBtn = document.getElementById('exportTxtBtn');
  const wordCount = document.getElementById('wordCount');
  const importBtn = document.getElementById('importBtn');
  const fileInput = document.getElementById('fileInput');
  const exportBtn = document.getElementById('exportBtn');
  const exportDropdown = document.getElementById('exportDropdown');

  // Load and display saved words
  function loadWords() {
    chrome.storage.local.get(['words'], result => {
      const words = result.words || [];
      wordCount.textContent = `Total Words: ${words.length}`;
      
      wordList.innerHTML = '';
      
      words.sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(word => {
          const wordItem = document.createElement('div');
          wordItem.className = 'word-item';
          wordItem.innerHTML = `
            <span class="word-text">${word.word}</span>
            <div class="word-actions">
              <span class="word-date" title="${new Date(word.date).toLocaleString()}">${new Date(word.date).toLocaleDateString()}</span>
              <span class="sound-icon" title="Play Sound" data-word="${word.word}">📢</span>
              <a href="https://translate.google.com/?sl=auto&tl=tr&text=${encodeURIComponent(word.word)}&op=translate" target="_blank" title="Google Translate">
                <img src="images/google-translate-icon.png" alt="Google Translate" class="icon">
              </a>
              <span class="delete-icon" title="Delete" data-word="${word.word}">❌</span>
            </div>
          `;

          wordList.appendChild(wordItem);
        });

      // Add event listeners for sound icons
      const soundIcons = document.querySelectorAll('.sound-icon');
      soundIcons.forEach(icon => {
        icon.addEventListener('click', () => {
          const word = icon.getAttribute('data-word');
          playSound(word);
        });
      });

      // Add event listeners for delete icons
      const deleteIcons = document.querySelectorAll('.delete-icon');
      deleteIcons.forEach(icon => {
        icon.addEventListener('click', () => {
          const word = icon.getAttribute('data-word');
          deleteWord(word);
        });
      });
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
        loadWords(); // Reload the word list after deletion
      });
    });
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
  exportBtn.addEventListener('click', () => {
    exportDropdown.classList.toggle('show');
  });

  // Close dropdown when clicking outside
  window.addEventListener('click', (event) => {
    if (!event.target.matches('.export-btn')) {
      if (exportDropdown.classList.contains('show')) {
        exportDropdown.classList.remove('show');
      }
    }
  });

  // Initial load
  loadWords();
});