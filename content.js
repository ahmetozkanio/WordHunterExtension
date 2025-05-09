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
      const words = (result && result.words) ? result.words : [];
      words.push({
        word: selectedText,
        date: new Date().toISOString()
      });
      chrome.storage.local.set({ words }, () => {
        floatingButton.style.display = 'none';
      });
    });
  }
});