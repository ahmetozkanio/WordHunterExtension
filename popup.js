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
          wordList.innerHTML += `
            <div class="word-item">
              <span class="word-text">${word.text}</span>
              <span class="word-date">${new Date(word.date).toLocaleString()}</span>
            </div>
          `;
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