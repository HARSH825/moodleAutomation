import { Paragraph, TextRun } from "docx";

// Helper to convert lines with **bold** to proper TextRuns
function parseMarkdownToTextRuns(line) {
  const regex = /\*\*(.*?)\*\*/g;
  const runs = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: line.slice(lastIndex, match.index), size: 24 }));
    }
    runs.push(new TextRun({ text: match[1], bold: true, size: 24 }));
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    runs.push(new TextRun({ text: line.slice(lastIndex), size: 24 }));
  }

  return runs;
}

function createParagraphsFromText(text) {
  if (!text?.trim()) {
    return [new Paragraph("No content available.")];
  }

  return text.split("\n").filter(Boolean).map(line =>
    new Paragraph({
      children: parseMarkdownToTextRuns(line.trim()),
      spacing: { before: 200, after: 100 },
    })
  );
}

export default createParagraphsFromText;
