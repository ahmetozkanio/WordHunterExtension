// Initialize storage if not exists
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get('words', (result) => {
    if (!Array.isArray(result.words)) {
      chrome.storage.sync.set({ words: [] });
    }
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