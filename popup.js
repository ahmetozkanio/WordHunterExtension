document.addEventListener('DOMContentLoaded', () => {
  const wordList = document.getElementById('wordList');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const exportTxtBtn = document.getElementById('exportTxtBtn');

  // Load and display saved words
  function loadWords() {
    chrome.storage.local.get(['words'], result => {
      const words = result.words || [];
      wordList.innerHTML = '';
      
      words.sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(word => {
          const wordItem = document.createElement('div');
          wordItem.className = 'word-item';
          wordItem.innerHTML = `
            <span class="word-text">${word.text}</span>
            <div class="word-actions">
              <span class="word-date" title="${new Date(word.date).toLocaleString()}">${new Date(word.date).toLocaleDateString()}</span>
              <span class="sound-icon" title="Play Sound" data-word="${word.text}">📢</span>
              <a href="https://translate.google.com/?sl=auto&tl=tr&text=${encodeURIComponent(word.text)}&op=translate" target="_blank" title="Google Translate">
                <img src="images/google-translate-icon.png" alt="Google Translate" class="icon">
              </a>
              <span class="delete-icon" title="Delete" data-word="${word.text}">❌</span>
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
      const updatedWords = words.filter(word => word.text !== wordToDelete);
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
        `"${word.text.replace(/"/g, '""')}";"${new Date(word.date).toLocaleString()}"`
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
      const json = JSON.stringify(words.map(word => ({ word: word.text, date: word.date })), null, 2);
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
      const txt = words.map(word => word.text).join("\n");
      const blob = new Blob([txt], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'wordhunter.txt';
      link.click();
    });
  });

  // Initial load
  loadWords();
});