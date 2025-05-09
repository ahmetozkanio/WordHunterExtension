// Remove old button if exists
const oldBtn = document.getElementById('wordhunter-btn');
if (oldBtn) oldBtn.remove();

const floatingButton = document.createElement('button');
floatingButton.id = 'wordhunter-btn';
floatingButton.innerHTML = '⭐️';
floatingButton.style.cssText = `
  position: absolute;
  display: none;
  background: #e0e0e0;
  color: #444;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
  padding: 2px 6px;
  font-size: 16px;
  cursor: pointer;
  z-index: 99999;
  transition: background 0.2s, color 0.2s;
`;
floatingButton.onmouseover = () => {
  floatingButton.style.background = '#bdbdbd';
  floatingButton.style.color = '#222';
};
floatingButton.onmouseout = () => {
  floatingButton.style.background = '#e0e0e0';
  floatingButton.style.color = '#444';
};

document.body.appendChild(floatingButton);

document.addEventListener('mouseup', (e) => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
    floatingButton.style.display = 'block';
    floatingButton.style.left = `${rect.right + window.scrollX + 8}px`;
    floatingButton.style.top = `${rect.top + window.scrollY - 4}px`;
  } else {
    floatingButton.style.display = 'none';
  }
});

floatingButton.addEventListener('click', () => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText && chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['words'], result => {
      const words = result.words || [];
      
      // Check if word already exists
      const existingWordIndex = words.findIndex(w => w.word === selectedText);
      if (existingWordIndex !== -1) {
        // Increment count if word exists
        words[existingWordIndex].count = (words[existingWordIndex].count || 1) + 1;
        words[existingWordIndex].date = new Date().toISOString(); // Update date
        chrome.storage.local.set({ words }, () => {
          if (chrome.runtime.lastError) {
            showFeedback('Error updating word', 'error');
          } else {
            showFeedback(`"${selectedText}" (${words[existingWordIndex].count})`, 'warning');
          }
          floatingButton.style.display = 'none';
        });
        return;
      }

      // Add new word with count and level
      const newWord = {
        word: selectedText,
        date: new Date().toISOString(),
        count: 1,
        level: 1  // Default level is 1
      };
      words.push(newWord);

      chrome.storage.local.set({ words }, () => {
        if (chrome.runtime.lastError) {
          showFeedback('Error saving word', 'error');
        } else {
          showFeedback(`"${selectedText}" saved!`, 'success');
        }
        floatingButton.style.display = 'none';
      });
    });
  }
});

// Create feedback element
const feedback = document.createElement('div');
feedback.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px 20px;
  border-radius: 4px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  z-index: 999999;
  display: none;
  transition: opacity 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
`;
document.body.appendChild(feedback);

function showFeedback(message, type) {
  feedback.textContent = message;
  feedback.style.display = 'block';
  feedback.style.opacity = '1';
  
  switch(type) {
    case 'success':
      feedback.style.backgroundColor = '#4CAF50';
      feedback.style.color = 'white';
      break;
    case 'warning':
      feedback.style.backgroundColor = '#ff9800';
      feedback.style.color = 'white';
      break;
    case 'error':
      feedback.style.backgroundColor = '#f44336';
      feedback.style.color = 'white';
      break;
  }

  setTimeout(() => {
    feedback.style.opacity = '0';
    setTimeout(() => {
      feedback.style.display = 'none';
    }, 300);
  }, 2000);
}