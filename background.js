// background.js (service worker)
chrome.action.onClicked.addListener(() => {
  // Open the main panel in a new tab
  chrome.tabs.create({ url: chrome.runtime.getURL('src/popup/popup.html') });
});

// Listen for checkout page loads to open a secondary popup
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const checkoutPatterns = [
      '*://checkout.stripe.com/*',
      '*://buy.stripe.com/*',
      '*://*.stripe.com/*/checkout*',
    ];
    const matches = checkoutPatterns.some((pattern) => {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(tab.url!);
    });
    if (matches) {
      chrome.windows.create({
        url: chrome.runtime.getURL('popup.html'),
        type: 'popup',
        width: 420,
        height: 720,
      });
    }
  }
});
