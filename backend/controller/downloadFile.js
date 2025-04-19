import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { getCookiesFromSupabase } from './cookieManager.js';

async function downloadFileWithAuthentication(url, outputPath, username) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let browser;
  try {
    // Retrieve cookies from Supabase instead of logging in each time
    const { cookies, error: cookieError } = await getCookiesFromSupabase(username);
    if (cookieError) {
      throw new Error(`Failed to retrieve cookies: ${cookieError}`);
    }

    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ acceptDownloads: true });
    await context.addCookies(cookies);

    const downloadPage = await context.newPage();

    // Trigger file download (windows.href)
    const downloadPromise = downloadPage.waitForEvent('download');
    await downloadPage.evaluate((fileUrl) => {
      window.location.href = fileUrl;
    }, url);

    const download = await downloadPromise;
    console.log(`Download started: ${download.suggestedFilename()}`);

    await download.saveAs(outputPath);
    console.log(`File downloaded successfully to: ${outputPath}`);

    await downloadPage.close();
    await context.close();
    return outputPath;
  } catch (error) {
    console.error(`Error downloading file: ${error.message}`);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}

export default downloadFileWithAuthentication;