// Initialize storage if not exists
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['words', 'notificationSettings'], (result) => {
    if (!Array.isArray(result.words)) {
      chrome.storage.local.set({ words: [] });
    }
    if (!result.notificationSettings) {
      chrome.storage.local.set({
        notificationSettings: {
          enabled: true,
          time: '09:00'
        }
      });
    }
    
    // Create initial alarm
    createNotificationAlarm(result.notificationSettings || { enabled: true, time: '09:00' });
    
    // Test notification on install
    // testNotification();
  });
});

chrome.contextMenus.create({
  id: "save-word",
  title: "Save selected word",
  contexts: ["selection"]
});


chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-word" && info.selectionText) {
    chrome.tabs.sendMessage(
      tab.id,
      {
        action: "save-word",
        text: info.selectionText.trim()
      },
      (response) => {  
        if (chrome.runtime.lastError) {
          console.error("Hata:", chrome.runtime.lastError);
        } else {
          console.log("Cevap:", response);
        }
      }
    );
  }
});

// Test notification function
function testNotification() {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'images/icon128.png',
    title: 'WordHunter Test',
    message: 'Testing notification sound...',
    priority: 2,
    silent: false,
    requireInteraction: true
  });
}

// Check for words that need review
async function checkWordsForReview() {
  try {
    const result = await chrome.storage.local.get(['words', 'notificationSettings']);
    const words = result.words || [];
    const settings = result.notificationSettings || { enabled: true, time: '09:00' };
    
    // If notifications are disabled, don't check
    if (!settings.enabled) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter words that are in review and due today
    const wordsToReview = words.filter(word => {
      if (!word.isInReview || !word.nextReviewDate) return false;
      
      const reviewDate = new Date(word.nextReviewDate);
      reviewDate.setHours(0, 0, 0, 0);
      
      return reviewDate.getTime() === today.getTime();
    });

    if (wordsToReview.length > 0) {
      // Create notification with sound
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon128.png',
        title: 'WordHunter - Review Time! 🎯',
        message: `You have ${wordsToReview.length} word${wordsToReview.length > 1 ? 's' : ''} to review today. Click to open WordHunter.`,
        priority: 2,
        silent: false,
        requireInteraction: true,
        buttons: [
          {
            title: 'Open WordHunter'
          }
        ]
      });
    }
  } catch (error) {
    console.error('Error checking words for review:', error);
  }
}

// Function to play sound in background
function playSoundInBackground() {
  const audio = new Audio(chrome.runtime.getURL('sounds/notification.mp3'));
  audio.volume = 1.0;
  audio.play().catch(error => {
    console.error('Error playing notification sound in background:', error);
  });
}

// Handle notification click and button click
chrome.notifications.onClicked.addListener(() => {
  chrome.action.openPopup();
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) { // "Open WordHunter" button
    chrome.action.openPopup();
  }
});

// Update notification settings
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateNotificationSettings') {
    createNotificationAlarm(request.settings);
  }
});

// Create or update notification alarm
function createNotificationAlarm(settings) {
  // Clear existing alarm
  chrome.alarms.clear('dailyReviewCheck');
  
  // If notifications are enabled, create new alarm
  if (settings.enabled) {
    const [hours, minutes] = settings.time.split(':').map(Number);
    const now = new Date();
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);
    
    if (now > next) {
      next.setDate(next.getDate() + 1);
    }
    
    // Calculate minutes until next check
    const minutesUntilNext = Math.floor((next.getTime() - now.getTime()) / (1000 * 60));
    
    chrome.alarms.create('dailyReviewCheck', {
      delayInMinutes: minutesUntilNext,
      periodInMinutes: 24 * 60 // Check every 24 hours
    });
  }
}

// Handle alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyReviewCheck') {
    checkWordsForReview();
  }
});

// Initial check when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  checkWordsForReview();
});