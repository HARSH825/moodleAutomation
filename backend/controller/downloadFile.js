import fs from 'fs';
import path from 'path';
import { getCookiesFromSupabase } from './cookieManager.js';
import { getBrowser, releaseBrowser } from '../utils/browserManager.js';

async function downloadFileWithAuthentication(url, outputPath, username) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let browser;
  try {
    const { cookies, error: cookieError } = await getCookiesFromSupabase(username);
    if (cookieError) {
      throw new Error(`Failed to retrieve cookies: ${cookieError}`);
    }

    browser = await getBrowser();
    const context = await browser.newContext({ 
      acceptDownloads: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    });
    await context.addCookies(cookies);

    const downloadPage = await context.newPage();

    try {
      const downloadPromise = downloadPage.waitForEvent('download', { timeout: 60000 });
      await downloadPage.evaluate((fileUrl) => {
        window.location.href = fileUrl;
      }, url);

      const download = await downloadPromise;
      console.log(`Download started: ${download.suggestedFilename()}`);

      const savePromise = download.saveAs(outputPath);
      await Promise.race([
        savePromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('File save timeout')), 60000)
        )
      ]);
      
      console.log(`File downloaded successfully to: ${outputPath}`);
    } finally {
      await downloadPage.close();
      await context.close();
      await releaseBrowser(browser);
      browser = null;
    }
    
    return outputPath;
  } catch (error) {
    console.error(`Error downloading file: ${error.message}`);
    if (browser) {
      await releaseBrowser(browser);
    }
    return null;
  }
}

export default downloadFileWithAuthentication;