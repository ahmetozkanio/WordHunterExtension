// Initialize storage if not exists
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ words: [] });
}); 