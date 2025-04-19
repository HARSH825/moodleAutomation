import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';
import generateAssignmentContent from './genContent.js';
import createDocumentFromContent from './createDocFromContent.js';
import downloadFile from './downloadFile.js';

// Environment
const __dirname = path.dirname(fileURLToPath(import.meta.url)); // Overall
const dataDir = path.join(__dirname, 'data'); // Overall 
const docsDir = path.join(dataDir, 'docs'); // Gen documents 

async function genDocController(req, res) {
    const { username, NAME, UID, key } = req.body;
    console.log("key : " + key);
    
    try {
        await fs.mkdir(docsDir, { recursive: true });
        
        // Read the all-non-submitted file
        const allNonSubmittedPath = path.join(dataDir, `all-non-submitted-${username}.json`);
        const allNonSubmittedData = await fs.readFile(allNonSubmittedPath, 'utf-8');
        const nonSubmittedByCourse = JSON.parse(allNonSubmittedData);
        
        console.log(` Starting document generation for user: ${username}`);
        
        const results = {};
        const generatedDocs = [];
        
        // Process each course
        for (const courseId in nonSubmittedByCourse) {
            const courseData = nonSubmittedByCourse[courseId];
            const courseDirPath = path.join(docsDir, courseId);
            await fs.mkdir(courseDirPath, { recursive: true });
            
            console.log(` Processing course: ${courseData.courseTitle} (${courseData.assignments.length} assignments)`);
            
            results[courseId] = {
                courseTitle: courseData.courseTitle,
                documents: []
            };
            
            // Process each assignment
            for (const assignment of courseData.assignments) {
                console.log(` Processing assignment: ${assignment.title}`);
                
                // Create filename from assignment title
                const safeTitle = assignment.title
                    .replace(/[^a-z0-9]/gi, '_')
                    .replace(/_+/g, '_')
                    .substring(0, 50);
                
                try {
                    // If files exist, download them
                    let fileContent = null;
                    let downloadedFilePath = null;
                    
                    if (assignment.relatedFiles && assignment.relatedFiles.length > 0) {
                        const file = assignment.relatedFiles[0]; // First file
                        const tempFilePath = path.join(courseDirPath, `temp_${file.fileName}`);
                        
                        console.log(` Downloading file: ${file.fileName}`);
                        // Note: Removed password parameter as we now use stored cookies
                        downloadedFilePath = await downloadFile(file.fileUrl, tempFilePath, username);
                        
                        if (downloadedFilePath) {
                            try {
                                // Extract text from the file
                                if (file.fileName.endsWith('.docx')) {
                                    const result = await mammoth.extractRawText({ path: downloadedFilePath });
                                    fileContent = result.value;
                                    
                                    console.log(` Extracted content from: ${file.fileName}`);
                                } else {
                                    fileContent = `[File available: ${file.fileName}]`;
                                }
                            } catch (extractErr) {
                                console.error(` Could not extract content: ${extractErr.message}`);
                                fileContent = `[File available but content extraction failed: ${file.fileName}]`;
                            }
                        }
                    }
                    
                    const assignmentInfo = assignment;
                    assignmentInfo.fileContent = fileContent || assignmentInfo.fileContent || '';
                    
                    // Generate content
                    console.log(` Generating content for: ${assignment.title}`);
                    const content = await generateAssignmentContent(
                        assignmentInfo,
                        NAME,
                        UID,
                        key
                    );
                    
                    // Create doc
                    console.log(` Creating document: ${assignment.title}`);
                    const url = await createDocumentFromContent(content, assignment, NAME, UID);
                    
                    // Clean temp downloaded files
                    if (downloadedFilePath) {
                        try {
                            await fs.unlink(downloadedFilePath);
                        } catch (unlinkErr) {
                            console.error(` Couldn't remove temp file: ${unlinkErr.message}`);
                        }
                    }
                    
                    results[courseId].documents.push({
                        title: assignment.title,
                        url: url
                    });
                    
                    generatedDocs.push({
                        courseId,
                        courseTitle: courseData.courseTitle,
                        title: assignment.title,
                        url: url
                    });
                    
                    console.log(` Document created for: ${assignment.title}`);
                } catch (assignmentError) {
                    console.error(` Error processing assignment: ${assignmentError.message}`);
                    results[courseId].documents.push({
                        title: assignment.title,
                        error: assignmentError.message
                    });
                }
            }
        }
        
        console.log(` Document generation completed. Generated ${generatedDocs.length} documents.`);
        
        res.json({
            success: true,
            results,
            generatedDocuments: generatedDocs
        });
    } catch (error) {
        console.error(`Error generating documents: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

export default genDocController;