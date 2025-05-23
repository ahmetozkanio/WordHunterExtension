class WordManager {
  constructor() {
    this.words = [];
    this.listeners = new Set();
    this.initialized = false;
  }

  // Initialize the WordManager by loading words from storage
  async initialize() {
    if (this.initialized) return;
    
    try {
      const result = await chrome.storage.local.get(['words']);
      this.words = result.words || [];
      this.initialized = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Error initializing WordManager:', error);
      throw error;
    }
  }

  // Get all words
  getWords() {
    return [...this.words];
  }

  // Get a specific word
  getWord(wordText) {
    return this.words.find(w => w.word.toLowerCase() === wordText.toLowerCase());
  }

  // Add a new word
  async addWord(wordText) {
    wordText = wordText.trim().toLowerCase();
    
    // Check if word already exists
    const existingWordIndex = this.words.findIndex(w => w.word.toLowerCase() === wordText);
    if (existingWordIndex !== -1) {
      // Increment count if word exists
      this.words[existingWordIndex].encounterCount = (this.words[existingWordIndex].encounterCount || 1) + 1;
    } else {
      // Create new word entry
      const newWord = {
        word: wordText,
        meaning: "",
        examples: [],
        isInReview: false,
        encounterCount: 1,
        learningLevel: 0,
        addedDate: new Date().toISOString(),
        repetitionHistory: [],
        nextReviewDate: null,
      };
      this.words.push(newWord);
    }

    await this.saveToStorage();
    this.notifyListeners();
  }

  // Update word progress
  async updateWordProgress(wordText, newLevel) {
    const wordIndex = this.words.findIndex(w => w.word === wordText);
    if (wordIndex === -1) return;

    const wordObj = this.words[wordIndex];
    const currentLevel = wordObj.learningLevel || 0;
    
    let isLevelDown = newLevel < currentLevel;

    // Calculate next review date based on new level
    let nextReviewDate = null;
    const todayUTC = this.getTodayUTC();

    // Use current nextReviewDate as base, or today if not set
    let baseDate;
    if (isLevelDown) {
      baseDate = todayUTC;
    } else if (wordObj.nextReviewDate) {
      baseDate = this.toLocalMidnightUTC(new Date(wordObj.nextReviewDate));
    } else {
      baseDate = todayUTC;
    }

    // Set review date based on the new level
    switch (newLevel) {
      case 0:
        nextReviewDate = todayUTC;
        break;
      case 1:
        nextReviewDate = this.addDays(baseDate, 1);
        break;
      case 2:
        nextReviewDate = this.addDays(baseDate, 2);
        break;
      case 3:
        nextReviewDate = this.addDays(baseDate, 3);
        break;
      case 4:
        nextReviewDate = this.addDays(baseDate, 7);
        break;
      case 5:
        nextReviewDate = this.addDays(baseDate, 16);
        break;
      case 6:
        nextReviewDate = null;
        break;
    }

    // Determine isInReview state
    let isInReview;
    if (newLevel === 0) {
      isInReview = !wordObj.isInReview;
    } else {
      isInReview = newLevel === 6 ? false : true;
    }

    // Create a new history entry
    const historyEntry = {
      fromLevel: currentLevel,
      toLevel: newLevel,
      timestamp: new Date().toISOString(),
      type: newLevel > currentLevel ? 'levelUp' : newLevel < currentLevel ? 'levelDown' : 'same'
    };

    // Initialize or update repetition history
    const repetitionHistory = Array.isArray(wordObj.repetitionHistory) ? wordObj.repetitionHistory : [];
    repetitionHistory.push(historyEntry);

    // Update word object
    this.words[wordIndex] = {
      ...wordObj,
      isInReview,
      learningLevel: newLevel,
      repetitionHistory,
      nextReviewDate: nextReviewDate ? nextReviewDate.toISOString() : null,
    };

    await this.saveToStorage();
    this.notifyListeners();
  }

  // Delete a word
  async deleteWord(wordText) {
    this.words = this.words.filter(w => w.word !== wordText);
    await this.saveToStorage();
    this.notifyListeners();
  }

  // Edit a word
  async editWord(oldWord, newWord) {
    const wordIndex = this.words.findIndex(w => w.word === oldWord);
    if (wordIndex === -1) return;

    this.words[wordIndex].word = newWord;
    await this.saveToStorage();
    this.notifyListeners();
  }

  // Check for missed reviews
  async checkMissedReviews() {
    const todayUTC = this.getTodayUTC();
    let hasUpdates = false;

    for (const word of this.words) {
      if (!word.isInReview || word.learningLevel === 6) continue;

      const nextReviewDate = word.nextReviewDate ? 
        this.toLocalMidnightUTC(new Date(word.nextReviewDate)) : 
        null;

      if (nextReviewDate && this.compareDates(nextReviewDate, todayUTC) < 0) {
        const currentLevel = word.learningLevel || 0;
        if (currentLevel > 0) {
          const newLevel = Math.max(0, currentLevel - 1);
          await this.updateWordProgress(word.word, newLevel);
          hasUpdates = true;
        }
      }
    }

    return hasUpdates;
  }

  // Get words for review
  getWordsForReview() {
    const todayUTC = this.getTodayUTC();
    return this.words.filter(word => {
      if (!word.isInReview || !word.nextReviewDate) return false;
      
      const reviewDate = this.toLocalMidnightUTC(new Date(word.nextReviewDate));
      return this.compareDates(reviewDate, todayUTC) === 0;
    });
  }

  // Get words grouped by review status
  getWordsGroupedByReviewStatus() {
    const todayUTC = this.getTodayUTC();
    
    return this.words.reduce((groups, word) => {
      const level = word.learningLevel || 0;
      let wordReviewDate = null;
      
      if (word.nextReviewDate) {
        wordReviewDate = this.toLocalMidnightUTC(new Date(word.nextReviewDate));
      }

      if (word.isInReview) {
        if (!wordReviewDate) {
          if (!groups.today) groups.today = [];
          groups.today.push(word);
        } else {
          const daysDiff = Math.floor(this.compareDates(wordReviewDate, todayUTC) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === 0) {
            if (!groups.today) groups.today = [];
            groups.today.push(word);
          } else if (daysDiff > 0) {
            const dateKey = wordReviewDate.toISOString();
            if (!groups.future) groups.future = {};
            if (!groups.future[dateKey]) groups.future[dateKey] = [];
            groups.future[dateKey].push(word);
          }
        }
      } else if (level === 0) {
        if (!groups.notStarted) groups.notStarted = [];
        groups.notStarted.push(word);
      }
      
      return groups;
    }, {});
  }

  // Add a listener for word changes
  addListener(listener) {
    this.listeners.add(listener);
  }

  // Remove a listener
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  // Notify all listeners of changes
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.words));
  }

  // Save words to storage
  async saveToStorage() {
    try {
      await chrome.storage.local.set({ words: this.words });
    } catch (error) {
      console.error('Error saving words to storage:', error);
      throw error;
    }
  }

  // Utility functions
  getTodayUTC() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  toLocalMidnightUTC(date) {
    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);
    return localDate;
  }

  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  compareDates(date1, date2) {
    return date1.getTime() - date2.getTime();
  }
}

// Create a singleton instance
const wordManager = new WordManager();

// Export the singleton instance
export default wordManager; 