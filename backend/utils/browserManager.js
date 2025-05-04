import { chromium } from 'playwright';

let browserPool = [];
const MAX_BROWSERS = 2;
const BROWSER_TIMEOUT = 5 * 60 * 1000; // 5 minutes

async function getBrowser() {
  if (browserPool.length > 0) {
    return browserPool.pop();
  }
  
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-setuid-sandbox',
      '--no-sandbox',
      '--no-zygote'
    ]
  });
  
  return browser;
}

async function releaseBrowser(browser) {
  if (!browser) return;
  
  try {
    if (browserPool.length < MAX_BROWSERS) {
      browserPool.push(browser);
    } else {
      await browser.close();
    }
  } catch (error) {
    console.error('Error releasing browser:', error);
    try {
      await browser.close();
    } catch (e) {
      
    }
  }
}


async function closeBrowserPool() {
  const closingPromises = browserPool.map(browser => browser.close().catch(e => console.error('Error closing browser:', e)));
  browserPool = [];
  await Promise.all(closingPromises);
}

process.on('exit', closeBrowserPool);
process.on('SIGINT', closeBrowserPool);
process.on('SIGTERM', closeBrowserPool);

export { getBrowser, releaseBrowser, closeBrowserPool };