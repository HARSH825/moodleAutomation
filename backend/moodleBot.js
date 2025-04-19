import { chromium } from 'playwright';

export async function loginToMoodle(username, password) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const moodleURL = 'https://moodle.spit.ac.in/login/index.php';
  
  await page.goto(moodleURL);
  
  await page.fill('input#username', username);
  await page.fill('input#password', password);
  
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle' }),
  ]);
  
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
