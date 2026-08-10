/**
 * CODER System — Tab Manager
 * 
 * Manages tab injection, cross-tab session tracking, and script execution.
 * Leverages admin permissions: scripting, activeTab, webNavigation.
 */

export interface CheckoutTabInfo {
  tabId: number;
  url: string;
  domain: string;
  hasCheckout: boolean;
  provider?: string;
}

class TabManager {
  /**
   * Finds all open tabs with potential checkout pages.
   */
  public async findCheckoutTabs(): Promise<CheckoutTabInfo[]> {
    if (typeof chrome === 'undefined' || !chrome.tabs) return [];

    return new Promise((resolve) => {
      chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] }, async (tabs) => {
        const checkoutTabs: CheckoutTabInfo[] = [];

        for (const tab of tabs) {
          if (!tab.id || !tab.url) continue;

          try {
            const domain = new URL(tab.url).hostname;
            const res = await chrome.tabs.sendMessage(tab.id, { action: 'DETECT_FIELDS' }).catch(() => null);

            if (res?.success && res.data?.hasCheckout) {
              checkoutTabs.push({
                tabId: tab.id,
                url: tab.url,
                domain,
                hasCheckout: true,
                provider: res.data.provider,
              });
            }
          } catch {
            // Ignore inaccessible tabs
          }
        }

        resolve(checkoutTabs);
      });
    });
  }

  /**
   * Programmatically injects content scripts into a target tab.
   */
  public async injectContentScript(tabId: number): Promise<boolean> {
    if (typeof chrome === 'undefined' || !chrome.scripting) return false;

    try {
      await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        files: ['content.js'],
      });
      console.log(`[CODER TabManager] Injected content.js into tab:${tabId}`);
      return true;
    } catch (err) {
      console.warn(`[CODER TabManager] Failed to inject into tab:${tabId}:`, err);
      return false;
    }
  }

  /**
   * Reloads a target tab and waits for document load.
   */
  public async reloadTab(tabId: number): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;

    return new Promise((resolve) => {
      chrome.tabs.reload(tabId, {}, () => {
        // Listen for tab complete status
        const listener = (id: number, info: chrome.tabs.TabChangeInfo) => {
          if (id === tabId && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        };
        chrome.tabs.onUpdated.addListener(listener);
      });
    });
  }
}

export const tabManager = new TabManager();
