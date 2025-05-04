import path from 'path';
import { fileURLToPath } from 'url';
import { loginToMoodle } from "../moodleBot.js";
import ensureDataDir from './ensureDataDirectory.js';
import { saveCookiesToSupabase } from './cookieManager.js';
import { saveJsonToSupabase } from './supaBaseManager.js';
import { getBrowser, releaseBrowser } from '../utils/browserManager.js';

// env
const __dirname = path.dirname(fileURLToPath(import.meta.url)); 
const dataDir = path.join(__dirname, 'data'); 

async function loginFetchController(req, res) {
    const { username, password } = req.body;
    
    let controllerTimeout = setTimeout(() => {
        res.status(408).json({ 
            success: false, 
            error: "Request timeout - operation took too long",
            message: "Please try again later"
        });
    }, 180000); //3 min
    
    let browser;
    try {
        await ensureDataDir(); 
        
        const { cookies, page, browser: loginBrowser } = await loginToMoodle(username, password);
        console.log('Login successful for:', username);
        
        const { success, error: cookieError } = await saveCookiesToSupabase(username, cookies);
        if (!success) {
            throw new Error(`Failed to save cookies: ${cookieError}`);
        }
        console.log(`Cookies saved to Supabase for: ${username}`);
        
        await page.close();
        await loginBrowser.close();
        
        browser = await getBrowser();
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        });
        await context.addCookies(cookies);
        
        console.log('Navigating to courses page...');
        const coursePage = await context.newPage();
        try {
            await coursePage.goto('https://moodle.spit.ac.in/my/courses.php', { 
                waitUntil: 'domcontentloaded', 
                timeout: 60000 
            });
            
            await coursePage.waitForSelector('.course-info-container', { timeout: 60000 });
        
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
        
            console.log('Courses fetched:', courses);
        
            const coursesFilename = `courses-${username}.json`;
            const { success: coursesSaved, url: coursesUrl, error: coursesError } = await saveJsonToSupabase(
                coursesFilename,
                courses
            );
            
            if (!coursesSaved) {
                console.error(`Error saving courses to Supabase: ${coursesError}`);
            }
            console.log(`💾 Courses data saved to Supabase: ${coursesFilename}`);
        
            await coursePage.close();
        
            const allExperiments = {};
            const BATCH_SIZE = 3;
            
            for (let i = 0; i < courses.length; i += BATCH_SIZE) {
                const courseBatch = courses.slice(i, i + BATCH_SIZE);
                
                for (const course of courseBatch) {
                    const page = await context.newPage();
                    try {
                        await page.goto(course.url, { 
                            waitUntil: 'domcontentloaded', 
                            timeout: 60000 
                        });
                        
                        await page.waitForSelector('.course-content', { timeout: 60000 });
                
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
                        
                        const courseExperimentsFilename = `experiments-${username}-course-${course.id}.json`;
                        const { success: expSaved, error: expError } = await saveJsonToSupabase(
                            courseExperimentsFilename,
                            allExperiments[course.id]
                        );
                        
                        if (!expSaved) {
                            console.error(`Error saving course experiments to Supabase: ${expError}`);
                        }
                    } catch (courseError) {
                        console.error(`Error processing course ${course.title}:`, courseError.message);
                        allExperiments[course.id] = {
                            courseTitle: course.title,
                            courseUrl: course.url,
                            experiments: [],
                            error: courseError.message
                        };
                    } finally {
                        await page.close();
                    }
                }
            }
        
            const allExperimentsFilename = `all-experiments-${username}.json`;
            const { success: allExpSaved, url: allExpUrl, error: allExpError } = await saveJsonToSupabase(
                allExperimentsFilename,
                allExperiments
            );
            
            if (!allExpSaved) {
                console.error(`Error saving all experiments to Supabase: ${allExpError}`);
            }
            console.log(` All experiments saved to Supabase: ${allExperimentsFilename}`);
        
            await context.close();
            await releaseBrowser(browser);
            browser = null;
            
            clearTimeout(controllerTimeout);
        
            res.json({ 
                success: true, 
                courses,
                experimentsByCourse: allExperiments,
                supabaseUrls: {
                    courses: coursesUrl,
                    allExperiments: allExpUrl
                }
            });
        } catch (pageError) {
            throw new Error(`Error fetching course data: ${pageError.message}`);
        }
    } catch (error) {
        console.error(' Error in /loginFetch:', error.message);
        
        if (browser) {
            await releaseBrowser(browser);
        }
        
        clearTimeout(controllerTimeout);
        
        res.status(500).json({ success: false, error: error.message });
    }
}
export default loginFetchController;