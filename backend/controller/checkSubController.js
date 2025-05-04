import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import ensureDataDir from './ensureDataDirectory.js';
import { getCookiesFromSupabase } from './cookieManager.js';
import { saveJsonToSupabase, getJsonFromSupabase } from './supaBaseManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url)); 
const dataDir = path.join(__dirname, 'data');

const CONCURRENT_ASSIGNMENTS = 5; 
const PAGE_TIMEOUT = 15000; 

async function checkSubmissionStatus(page, assignment) {
    console.log(`Checking assignment: ${assignment.title}`);
    
    try {
        await page.goto(assignment.url, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT });
        
        const expandButton = await page.$('.collapsible-actions .collapseexpand');
        if (expandButton) {
            await expandButton.click();
            await page.waitForTimeout(500); 
        }
        
        const submissionStatus = await page.evaluate(() => {
            let status = null;
            
            const rows = document.querySelectorAll('.submissionstatustable tr');
            for (const row of rows) {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2 && cells[0]?.textContent?.trim() === 'Submission status') {
                    return cells[1]?.textContent?.trim();
                }
            }
            
            const tables = document.querySelectorAll('table.generaltable');
            for (const table of tables) {
                const rows = table.querySelectorAll('tr');
                for (const row of rows) {
                    const cells = row.querySelectorAll('td, th');
                    if (cells.length >= 2 && cells[0]?.textContent?.trim() === 'Submission status') {
                        return cells[1]?.textContent?.trim();
                    }
                }
            }
            
            const submissionText = Array.from(document.querySelectorAll('*'))
                .find(element => 
                    element.textContent?.includes('Submission status') &&
                    (element.nextElementSibling?.textContent?.includes('submitted') ||
                    element.nextElementSibling?.textContent?.includes('No submission'))
                );
            
            return submissionText?.nextElementSibling?.textContent?.trim() || null;
        });
        
        const allFiles = await page.evaluate(() => {
            const fileElements = Array.from(document.querySelectorAll('.fileuploadsubmission a'));
            
            const attachmentElements = Array.from(document.querySelectorAll('.mod-assign-intro-attachments a'));
            //plugin files idhr
            const pluginFiles = Array.from(document.querySelectorAll('a[href*="pluginfile.php"]'))
                .filter(el => el.href.includes('.doc') || el.href.includes('.pdf') || el.href.includes('.zip'));
            
            // combine
            return [...fileElements, ...attachmentElements, ...pluginFiles].map(el => ({
                fileName: el.textContent.trim(),
                fileUrl: el.href
            }));
        });
        
        console.log(`Submission status: "${submissionStatus || 'Not found'}" with ${allFiles.length} files`);
        
        const isSubmitted = submissionStatus && 
            (submissionStatus.includes('Submitted for grading') || 
             submissionStatus.includes('submitted') &&
             !submissionStatus.includes('No submission'));
        
        if (!isSubmitted && isSubmitted !== null) {
            console.log(`Assignment not submitted: ${assignment.title}`);
            return {
                isSubmitted: false,
                result: {
                    ...assignment,
                    submissionStatus: submissionStatus || 'Unknown',
                    relatedFiles: allFiles.length > 0 ? allFiles : null
                }
            };
        } else {
            console.log(`Assignment submitted: ${assignment.title}`);
            return { isSubmitted: true };
        }
    } catch (error) {
        console.error(` Error checking assignment ${assignment.title}:`, error.message);
        return {
            isSubmitted: false,
            result: {
                ...assignment,
                submissionStatus: 'Error checking status',
                error: error.message
            }
        };
    }
}

async function processInBatches(items, batchSize, processFunction) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(processFunction));
        results.push(...batchResults);
    }
    return results;
}

async function checkSubController(req, res) {
    const { username } = req.body;
    let browser;
    
    try {
        await ensureDataDir(); 
        
        const [cookiesResult, experimentsResult] = await Promise.all([
            getCookiesFromSupabase(username),
            getJsonFromSupabase(`all-experiments-${username}.json`)
        ]);
        
        if (cookiesResult.error) {
            throw new Error(`Failed to retrieve cookies: ${cookiesResult.error}`);
        }
        
        if (experimentsResult.error) {
            throw new Error(`Failed to retrieve experiments: ${experimentsResult.error}`);
        }
        
        const cookies = cookiesResult.cookies;
        const allExperiments = experimentsResult.data;
        
        browser = await chromium.launch({ 
            headless: false,
            args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox']
        });
        
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            viewport: { width: 1280, height: 720 },
            ignoreHTTPSErrors: true
        });
        
        await context.addCookies(cookies);
        
        const nonSubmittedAssignments = {};
        const savePromises = [];
        
        for (const courseId in allExperiments) {
            const courseData = allExperiments[courseId];
            const courseTitle = courseData.courseTitle;
            const assignments = courseData.experiments.filter(exp => exp.type === 'Assignment');
            
            console.log(` Checking ${assignments.length} assignments for course: ${courseTitle}`);
            
            const pagePool = await Promise.all(
                Array(Math.min(CONCURRENT_ASSIGNMENTS, assignments.length))
                    .fill()
                    .map(() => context.newPage())
            );
            
            const nonSubmitted = [];
            let pageIndex = 0;
            
            await processInBatches(assignments, pagePool.length, async (assignment) => {
                const page = pagePool[pageIndex % pagePool.length];
                pageIndex++;
                
                const result = await checkSubmissionStatus(page, assignment);
                if (!result.isSubmitted) {
                    nonSubmitted.push(result.result);
                }
            });
            
            await Promise.all(pagePool.map(page => page.close()));
            
            nonSubmittedAssignments[courseId] = {
                courseTitle,
                courseUrl: courseData.courseUrl,
                nonSubmittedCount: nonSubmitted.length,
                assignments: nonSubmitted
            };
            
            const nonSubmittedFilename = `non-submitted-${username}-course-${courseId}.json`;
            const savePromise = saveJsonToSupabase(
                nonSubmittedFilename, 
                nonSubmittedAssignments[courseId]
            );
            
            savePromises.push(savePromise);
            console.log(` Non-submitted assignments saving to Supabase: ${nonSubmittedFilename}`);
        }
        
        await Promise.all(savePromises);
        //save
        const allNonSubmittedFilename = `all-non-submitted-${username}.json`;
        const { success: allNonSubSaved, url: allNonSubUrl, error: allNonSubError } = await saveJsonToSupabase(
            allNonSubmittedFilename,
            nonSubmittedAssignments
        );
        
        if (!allNonSubSaved) {
            console.error(`Error saving all non-submitted assignments to Supabase: ${allNonSubError}`);
        }
        
        await browser.close();
        
        res.json({
            success: true,
            nonSubmittedAssignments,
            supabaseUrl: allNonSubUrl
        });
        
    } catch (error) {
        console.error(' Error in /checkSubmissions:', error.message);
        if (browser) await browser.close();
        res.status(500).json({ success: false, error: error.message });
    }
}

export default checkSubController;