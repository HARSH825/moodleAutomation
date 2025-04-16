import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDNYonVVi6OSNeolTLygmQGWAi80o_ldkQ";

const genAI = new GoogleGenerativeAI(apiKey);

// Sanitize input to avoid injection or formatting issues
const sanitize = (str) => str?.replace(/[`$<>]/g, '').trim() || '';

// Limit the file content size to avoid exceeding token limits
const MAX_CONTENT_LENGTH = 10000;

/**
 * Builds a structured prompt for Gemini based on assignment info
 * @param {Object} param0
 * @param {string} param0.title
 * @param {string} param0.fullTitle
 * @param {string} param0.fileContent
 * @returns {string}
 */
function buildPrompt({ title, fullTitle, fileContent , NAME, UID }) {
  return `
You are an expert academic writer. Generate a detailed and professional assignment/experiment file for an engineering student.

**Student Details:**
- Name: ${NAME}
- UID: ${UID}

**Assignment Details:**
- Title: ${title || "Untitled Assignment"}
- Description: ${fullTitle || title || "N/A"}

If available, include technical details from this additional file content:
${fileContent || "None"}

---

The generated document must follow this structure (SECTION HEADINGS MUST BE WRITTEN EXACTLY AS SHOWN):

TITLE:
<Write a clear technical title here>

AIM:
<Write 2–3 lines  explaining the aim of this assignment>

ALGORITHM:
<Explain the algorithm step-by-step. Use numbered or bulleted format if needed>

CODE:
<Write code related to this assignment. Include comments. No need to wrap in triple backticks.new Paragraph({ text: "CODE", heading: HeadingLevel.HEADING_1 }),
          ...createCodeParagraphs(sections.code),

          Above is how i am going to identify and put code in the docx using docx library . So make sure to give proper response for it to be identified correctly.>
>

ObSERVATION:
<Write observations in tabular format. Use | to separate columns. Example:

CONCLUSION:
<Wrap up the assignment with insights, what was learned.>

IN ALL UNDESTAND : WE WANT TO MAKE THE BEST PRETTY DOCUMENT OUT OF THIS TEXT USING THE DOCX JS LIBRARY, AND FOR THAT I AM GENERATING THIS CONTENT.
Do not use markdown, do not include extra formatting. Only include clean, plain text with correct section labels.Following is how the content is going to be parsed:function parseContentSections(content, title) {
    //spliiter logic
    return {
      title,
      aim: extract(content, "AIM"),
      algorithm: extract(content, "ALGORITHM"),
      code: extract(content, "CODE"),
      observation: extract(content, "OBSERVATION"),
      conclusion: extract(content, "CONCLUSION"),
    };
  }

`.trim();
}

/**
 * Generates a structured assignment text for DOCX creation.
 * @param {Object} assignmentInfo - Info like title, fullTitle, and fileContent.
 * @returns {Promise<string>} - Clean, sectioned plain text content.
 */
async function generateAssignmentContent(assignmentInfo ,NAME , UID) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Sanitize and trim file content
    const rawContent = sanitize(assignmentInfo.fileContent || '');
    const trimmedContent =
      rawContent.length > MAX_CONTENT_LENGTH
        ? rawContent.slice(0, MAX_CONTENT_LENGTH) + '\n[Truncated]'
        : rawContent;

    const prompt = buildPrompt({
      title: sanitize(assignmentInfo.title),
      fullTitle: sanitize(assignmentInfo.fullTitle),
      fileContent: trimmedContent,
      NAME:NAME,
      UID:UID
    });

    // 5 second delay
    await new Promise(resolve => setTimeout(resolve, 5000));

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error(` Error generating content: ${error.message}`);
    return `TITLE:\n${assignmentInfo.title || "Untitled Assignment"}\n\nUnable to generate due to error: ${error.message}`;
  }
}

export default generateAssignmentContent ;
