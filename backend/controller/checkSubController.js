import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import ensureDataDir from './ensureDataDirectory.js';
import { getCookiesFromSupabase } from './cookieManager.js';
import { saveJsonToSupabase, getJsonFromSupabase } from './supaBaseManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url)); 
const dataDir = path.join(__dirname, 'data'); 

async function checkSubController(req, res) {
    const { username } = req.body;
      
    let browser;
    try {
        await ensureDataDir(); //for fallback
        
        // cookies
        const { cookies, error: cookieError } = await getCookiesFromSupabase(username);
        if (cookieError) {
            throw new Error(`Failed to retrieve cookies: ${cookieError}`);
        }
        
        // all exp
        const allExperimentsFilename = `all-experiments-${username}.json`;
        const { data: allExperiments, error: expError } = await getJsonFromSupabase(allExperimentsFilename);
        
        if (expError) {
            throw new Error(`Failed to retrieve experiments: ${expError}`);
        }
        
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        await context.addCookies(cookies);
        
        const nonSubmittedAssignments = {};
        
        for (const courseId in allExperiments) {
            const courseData = allExperiments[courseId];
            const courseTitle = courseData.courseTitle;
            const assignments = courseData.experiments.filter(exp => exp.type === 'Assignment');
            
            console.log(` Checking ${assignments.length} assignments for course: ${courseTitle}`);
            
            const nonSubmitted = [];
            
            for (const assignment of assignments) {
                console.log(`  ⏳ Checking assignment: ${assignment.title}`);
                //delay
                // await new Promise(resolve => setTimeout(resolve, 2000));
                
                const page = await context.newPage();
                try {
                    await page.goto(assignment.url, { waitUntil: 'networkidle', timeout: 30000 });
                    
                    // if req,check
                    const expandButton = await page.$('.collapsible-actions .collapseexpand');
                    if (expandButton) {
                        await expandButton.click();
                        await page.waitForTimeout(1000); //for the content to expand
                    }
                    
                    let submissionStatus = null;
                    
                    // first selector 
                    submissionStatus = await page.evaluate(() => {
                        const rows = document.querySelectorAll('.submissionstatustable tr');
                        for (const row of rows) {
                            const cells = row.querySelectorAll('td');
                            if (cells.length >= 2) {
                                const firstCell = cells[0]?.textContent?.trim();
                                if (firstCell === 'Submission status') {
                                    return cells[1]?.textContent?.trim();
                                }
                            }
                        }
                        return null;
                    });
                    
                    // broaderselector
                    if (!submissionStatus) {
                        submissionStatus = await page.evaluate(() => {
                            const tables = document.querySelectorAll('table.generaltable');
                            for (const table of tables) {
                                const rows = table.querySelectorAll('tr');
                                for (const row of rows) {
                                    const cells = row.querySelectorAll('td, th');
                                    if (cells.length >= 2) {
                                        const firstCell = cells[0]?.textContent?.trim();
                                        if (firstCell === 'Submission status') {
                                            return cells[1]?.textContent?.trim();
                                        }
                                    }
                                }
                            }
                            return null;
                        });
                    }
                    
                    // general selector
                    if (!submissionStatus) {
                        submissionStatus = await page.evaluate(() => {
                            const submissionText = Array.from(document.querySelectorAll('*'))
                                .find(element => 
                                    element.textContent?.includes('Submission status') &&
                                    (element.nextElementSibling?.textContent?.includes('submitted') ||
                                    element.nextElementSibling?.textContent?.includes('No submission'))
                                );
                            
                            return submissionText?.nextElementSibling?.textContent?.trim() || null;
                        });
                    }
                    
                    console.log(`Submission status: "${submissionStatus || 'Not found'}"`);
                    
                    // file URLS
                    const relatedFiles = await page.evaluate(() => {
                        const fileElements = document.querySelectorAll('.fileuploadsubmission a');
                        return Array.from(fileElements).map(el => {
                            return {
                                fileName: el.textContent.trim(),
                                fileUrl: el.href
                            };
                        });
                    });
                    
                    // alternative selectors , if no fles
                    let alternativeFiles = [];
                    if (relatedFiles.length === 0) {
                        alternativeFiles = await page.evaluate(() => {
                            const attachmentElements = document.querySelectorAll('.mod-assign-intro-attachments a');
                            const results = Array.from(attachmentElements).map(el => {
                                return {
                                    fileName: el.textContent.trim(),
                                    fileUrl: el.href
                                };
                            });
                            
                            // still no files
                            if (results.length === 0) {
                                const allLinks = document.querySelectorAll('a[href*="pluginfile.php"]');
                                return Array.from(allLinks)
                                    .filter(el => el.href.includes('.doc') || el.href.includes('.pdf') || el.href.includes('.zip'))
                                    .map(el => {
                                        return {
                                            fileName: el.textContent.trim(),
                                            fileUrl: el.href
                                        };
                                    });
                            }
                            
                            return results;
                        });
                    }
                    
                    const allFiles = [...relatedFiles, ...alternativeFiles];
                    console.log(` Found ${allFiles.length} related files`);
                    
                    //subm status
                    const isSubmitted = submissionStatus && 
                                       (submissionStatus.includes('Submitted for grading') || 
                                        submissionStatus.includes('submitted') &&
                                        !submissionStatus.includes('No submission'));
                    
                    if (!isSubmitted) {
                        nonSubmitted.push({
                            ...assignment,
                            submissionStatus: submissionStatus || 'Unknown',
                            relatedFiles: allFiles.length > 0 ? allFiles : null
                        });
                        console.log(`Assignment not submitted: ${assignment.title}`);
                        
                        if (allFiles.length > 0) {
                            console.log(` Related files found: ${allFiles.map(f => f.fileName).join(', ')}`);
                        }
                    } else {
                        console.log(`Assignment submitted: ${assignment.title}`);
                    }
                    
                } catch (error) {
                    console.error(` Error checking assignment ${assignment.title}:`, error.message);
                    // if couldnt determine status
                    nonSubmitted.push({
                        ...assignment,
                        submissionStatus: 'Error checking status',
                        error: error.message
                    });
                }
                
                await page.close();
            }
            
            nonSubmittedAssignments[courseId] = {
                courseTitle,
                courseUrl: courseData.courseUrl,
                nonSubmittedCount: nonSubmitted.length,
                assignments: nonSubmitted
            };
            
            // save non-sub to supa
            const nonSubmittedFilename = `non-submitted-${username}-course-${courseId}.json`;
            const { success: nonSubSaved, error: nonSubError } = await saveJsonToSupabase(
                nonSubmittedFilename, 
                nonSubmittedAssignments[courseId]
            );
            
            if (!nonSubSaved) {
                console.error(`Error saving non-submitted assignments to Supabase: ${nonSubError}`);
            }
            console.log(` Non-submitted assignments saved to Supabase: ${nonSubmittedFilename}`);
        }
        
        // save
        const allNonSubmittedFilename = `all-non-submitted-${username}.json`;
        const { success: allNonSubSaved, url: allNonSubUrl, error: allNonSubError } = await saveJsonToSupabase(
            allNonSubmittedFilename,
            nonSubmittedAssignments
        );
        
        if (!allNonSubSaved) {
            console.error(`Error saving all non-submitted assignments to Supabase: ${allNonSubError}`);
        }
        console.log(` All non-submitted assignments saved to Supabase: ${allNonSubmittedFilename}`);
        
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