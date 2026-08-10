/**
 * CODER System — Proxy Manager
 * 
 * Manages proxy rotation and configuration using chrome.proxy API.
 * Leverages admin permission `proxy`.
 */

import { STORAGE_KEYS } from '../utils/constants';

export interface ProxyConfig {
  host: string;
  port: number;
  scheme: 'http' | 'https' | 'socks5';
  username?: string;
  password?: string;
}

class ProxyManager {
  private proxyList: ProxyConfig[] = [];
  private currentIndex = 0;
  private isEnabled = false;

  public async init(): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.proxy) return;

    return new Promise((resolve) => {
      chrome.storage.local.get(
        [STORAGE_KEYS.PROXY_LIST, STORAGE_KEYS.PROXY_ENABLED, STORAGE_KEYS.PROXY_CURRENT_INDEX],
        (res) => {
          this.proxyList = (res[STORAGE_KEYS.PROXY_LIST] as ProxyConfig[]) || [];
          this.isEnabled = !!res[STORAGE_KEYS.PROXY_ENABLED];
          this.currentIndex = (res[STORAGE_KEYS.PROXY_CURRENT_INDEX] as number) || 0;
          if (this.isEnabled && this.proxyList.length > 0) {
            this.applyCurrentProxy();
          }
          resolve();
        }
      );
    });
  }

  public async setProxyList(list: ProxyConfig[]): Promise<void> {
    this.proxyList = list;
    this.currentIndex = 0;
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [STORAGE_KEYS.PROXY_LIST]: list, [STORAGE_KEYS.PROXY_CURRENT_INDEX]: 0 });
    }
  }

  public async enableProxy(enable: boolean): Promise<void> {
    this.isEnabled = enable;
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [STORAGE_KEYS.PROXY_ENABLED]: enable });
    }

    if (enable && this.proxyList.length > 0) {
      await this.applyCurrentProxy();
    } else {
      await this.clearProxy();
    }
  }

  public async rotateProxy(): Promise<ProxyConfig | null> {
    if (this.proxyList.length === 0) return null;

    this.currentIndex = (this.currentIndex + 1) % this.proxyList.length;
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [STORAGE_KEYS.PROXY_CURRENT_INDEX]: this.currentIndex });
    }

    if (this.isEnabled) {
      await this.applyCurrentProxy();
    }

    return this.proxyList[this.currentIndex];
  }

  private async applyCurrentProxy(): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.proxy || this.proxyList.length === 0) return;

    const current = this.proxyList[this.currentIndex];
    const config: chrome.proxy.ProxyConfig = {
      mode: 'fixed_servers',
      rules: {
        singleProxy: {
          scheme: current.scheme,
          host: current.host,
          port: current.port,
        },
        bypassList: ['localhost', '127.0.0.1'],
      },
    };

    return new Promise((resolve) => {
      chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
        console.log(`[CODER Proxy] Applied ${current.scheme}://${current.host}:${current.port}`);
        resolve();
      });
    });
  }

  private async clearProxy(): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.proxy) return;

    return new Promise((resolve) => {
      chrome.proxy.settings.clear({ scope: 'regular' }, () => {
        console.log('[CODER Proxy] Proxy cleared (direct connection)');
        resolve();
      });
    });
  }
}

export const proxyManager = new ProxyManager();
