// content.js script started
// console.log('WordHunter content.js script started');

// Remove old button if exists
const oldBtn = document.getElementById('wordhunter-btn');
if (oldBtn) oldBtn.remove();

const floatingButton = document.createElement('button');
floatingButton.id = 'wordhunter-btn';
floatingButton.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 24 24">
    <path d="M12 .587l3.668 7.431 8.2 1.191-5.934 5.782 1.402 8.173L12 18.897l-7.336 3.857 1.402-8.173L.132 9.209l8.2-1.191z"/>
  </svg>
`;
floatingButton.style.cssText = `
  position: absolute;
  display: none;
  background: #fbc02d;
  color: white;
  border: none;
  border-radius: 6px;
  width: 30px;
  height: 30px;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  cursor: pointer;
  z-index: 99999;
  transition: background 0.2s ease, transform 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
`;
floatingButton.onmouseover = () => {
  floatingButton.style.transform = 'scale(1.1)';
  floatingButton.style.background = '#E48F08FF';
};
floatingButton.onmouseout = () => {
  floatingButton.style.transform = 'scale(1)';
  floatingButton.style.background = '#f9a825';
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
  saveWord(selectedText);
});

function saveWord(selectedText) {
  selectedText = selectedText.trim().toLowerCase();
  console.log('Selected word:', selectedText);
  
  if (selectedText) {
    // Get the containing sentence
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    // Clone the range to work with it
    const rangeClone = range.cloneRange();
    
    // Expand the range to include the full sentence
    while (rangeClone.startOffset > 0) {
      rangeClone.setStart(rangeClone.startContainer, rangeClone.startOffset - 1);
      const text = rangeClone.toString();
      if (text.match(/[.!?]\s*$/)) {
        rangeClone.setStart(rangeClone.startContainer, rangeClone.startOffset + 1);
        break;
      }
    }
    
    while (rangeClone.endOffset < rangeClone.endContainer.length) {
      rangeClone.setEnd(rangeClone.endContainer, rangeClone.endOffset + 1);
      const text = rangeClone.toString();
      if (text.match(/[.!?]\s*$/)) {
        break;
      }
    }
    
    const containingSentence = rangeClone.toString().trim();
    console.log('Found containing sentence:', containingSentence);

    chrome.storage.local.get({ words: [] }, (result) => {
      const words = result.words;
      const existingWordIndex = words.findIndex(word => word.word === selectedText);

      if (existingWordIndex !== -1) {
        // Increment count if word already exists
        words[existingWordIndex].encounterCount = (words[existingWordIndex].encounterCount || 1) + 1;
        // Add the sentence to examples if it's not already there
        if (containingSentence && !words[existingWordIndex].examples.includes(containingSentence)) {
          words[existingWordIndex].examples.push(containingSentence);
        }
        showFeedback(`x${words[existingWordIndex].encounterCount} "${selectedText}" count increased!`, 'warning');
      } else {
        // Add new word (using WordManager structure)
        const newWord = {
          word: selectedText,
          meaning: "", // Default empty
          examples: containingSentence ? [containingSentence] : [], // Add the containing sentence as an example
          isInReview: false, // Default false
          encounterCount: 1, // Initial count 1
          learningLevel: 0, // Default level 0 (not started)
          addedDate: new Date().toISOString(), // Date added
          synonyms: [], // Default empty array
          repetitionHistory: [], // Default empty array
          nextReviewDate: null, // Initially null
        };
        words.push(newWord);
        showFeedback(`"${selectedText}" saved!`, 'success');
      }

      chrome.storage.local.set({ words: words }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving word:', chrome.runtime.lastError);
          showFeedback('Error saving word', 'error');
        } else {
          // Hide button when word is successfully saved
          floatingButton.style.display = 'none';
        }
      });
    });
  }
}

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

// Close floating button when clicking outside or clearing selection
document.addEventListener('mousedown', (e) => {
  const isClickInsideButton = e.target.id === 'wordhunter-btn';
  const selectedText = window.getSelection().toString().trim();
  if (!isClickInsideButton && !selectedText) {
    floatingButton.style.display = 'none';
  }
});

document.addEventListener('selectionchange', () => {
  const selectedText = window.getSelection().toString().trim();
  if (!selectedText) {
    floatingButton.style.display = 'none';
  }
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log("Received message:", message);  
  if (message.action === "save-word") {
    console.log('Received save-word message from background script:', message.text);
    saveWord(message.text); // Call the saveWord function with the text from the message
    sendResponse({success: true}); 
  }
  return true;  
});
