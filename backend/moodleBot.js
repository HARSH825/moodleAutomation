import { chromium } from 'playwright';

export async function loginToMoodle(username, password) {
  const browser = await chromium.launch({ 
    headless: false,
    args: [
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-setuid-sandbox',
      '--no-sandbox',
      '--no-zygote'
    ]
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  const moodleURL = 'https://moodle.spit.ac.in/login/index.php';
  
  // Add timeout options
  await page.goto(moodleURL, { timeout: 60000 });
  
  await page.fill('input#username', username);
  await page.fill('input#password', password);
  
  try {
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60000 }),
    ]);
  } catch (error) {
    await browser.close();
    throw new Error(`Navigation timeout: ${error.message}`);
  }
  
  const isLoginFailed = await page.$('div.loginerrors');
  const isStillOnLoginPage = page.url().includes('login/index.php');
  const usernameFieldStillExists = await page.$('input#username');
  
  if (isLoginFailed || isStillOnLoginPage || usernameFieldStillExists) {
    await browser.close();
    throw new Error('Login failed. Please check your credentials.');
  }

  const cookies = await page.context().cookies();
  return { cookies, page, browser }; 
}