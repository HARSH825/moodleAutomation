import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright'; 
import { loginToMoodle } from "../moodleBot.js";
import ensureDataDir from './ensureDataDirectory.js';
import { saveCookiesToSupabase } from './cookieManager.js';

// Environment setup
const __dirname = path.dirname(fileURLToPath(import.meta.url)); 
const dataDir = path.join(__dirname, 'data'); 

async function loginFetchController(req, res) {
    const { username, password } = req.body;
    
    let browser;
    try {
        await ensureDataDir();
        
        const { cookies, page } = await loginToMoodle(username, password);
        console.log('Login successful for:', username);
        
        // Save cookies to Supabase instead of local file
        const { success, error: cookieError } = await saveCookiesToSupabase(username, cookies);
        if (!success) {
            throw new Error(`Failed to save cookies: ${cookieError}`);
        }
        console.log(`Cookies saved to Supabase for: ${username}`);
        
        browser = await chromium.launch({ headless: false });
        const context = await browser.newContext();
        await context.addCookies(cookies);
        const coursePage = await context.newPage();
    
        console.log('🔄 Navigating to courses page...');
        await coursePage.goto('https://moodle.spit.ac.in/my/courses.php', { waitUntil: 'domcontentloaded' });
        await coursePage.waitForSelector('.course-info-container', { timeout: 10000 });
    
        const courses = await coursePage.$$eval('.course-info-container', nodes =>
          nodes.map(node => {
            const titleEl = node.querySelector('a.aalink.coursename .multiline');
            const linkEl = node.querySelector('a.aalink.coursename');
            return {
              title: titleEl?.textContent.trim() || '',
              url: linkEl?.href || '',
              id: linkEl?.href.split('id=')[1] || ''
            };
          })
        );
    
        console.log('📚 Courses fetched:', courses);
    
        const coursesFilePath = path.join(dataDir, `courses-${username}.json`);
        await fs.writeFile(coursesFilePath, JSON.stringify(courses, null, 2));
        console.log(`💾 Courses data saved to: ${coursesFilePath}`);
    
        await page.close();
        await coursePage.close();
    
        //fetch
        const allExperiments = {};
        for (const course of courses) {
          console.log(`Waiting 1000ms before processing course: ${course.title}`);
          await new Promise(resolve => setTimeout(resolve, 10000));
    
          const page = await context.newPage();
          await page.goto(course.url, { waitUntil: 'domcontentloaded' });
          await page.waitForSelector('.course-content', { timeout: 20000 });
    
          const experiments = await page.$$eval('div.activityname a.aalink', links => 
            links.map(link => {
              const titleElement = link.querySelector('.instancename');
              const fullTitle = titleElement ? titleElement.textContent.trim() : '';
              let title = fullTitle;
              const accesshideSpan = titleElement?.querySelector('.accesshide');
              if (accesshideSpan) {
                title = fullTitle.replace(accesshideSpan.textContent, '').trim();
              }
              return {
                title: title,
                fullTitle: fullTitle,
                url: link.href,
                id: link.href.includes('id=') ? link.href.split('id=')[1].split('&')[0] : '',
                type: accesshideSpan ? accesshideSpan.textContent.trim() : 'Unknown'
              };
            })
          );
    
          console.log(`Found ${experiments.length} experiments for course: ${course.title}`);
    
          allExperiments[course.id] = {
            courseTitle: course.title,
            courseUrl: course.url,
            experiments
          };
    
          const courseExperimentsPath = path.join(dataDir, `experiments-${username}-course-${course.id}.json`);
          await fs.writeFile(courseExperimentsPath, JSON.stringify(allExperiments[course.id], null, 2));
          await page.close();
        }
    
        const allExperimentsPath = path.join(dataDir, `all-experiments-${username}.json`);
        await fs.writeFile(allExperimentsPath, JSON.stringify(allExperiments, null, 2));
        console.log(` All experiments saved to: ${allExperimentsPath}`);
    
        await browser.close();
    
        res.json({ 
          success: true, 
          courses,
          experimentsByCourse: allExperiments,
          coursesFile: coursesFilePath,
          experimentsFile: allExperimentsPath
        });
    
    } catch (error) {
        console.error(' Error in /loginFetch:', error.message);
        if (browser) await browser.close();
        res.status(500).json({ success: false, error: error.message });
    }
}

export default loginFetchController;