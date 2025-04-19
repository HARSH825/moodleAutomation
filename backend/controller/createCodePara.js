import { Paragraph, TextRun } from "docx";
function createCodeParagraphs(code) {
  if (!code?.trim()) {
    return [new Paragraph("No code implementation required for this assignment.")];
  }

  const cleanCode = code
    .replace(/```[\w]*\n/g, "")
    .replace(/```/g, "")
    .split("\n");

  return cleanCode.map(line =>
    new Paragraph({
      children: [
        new TextRun({
          text: line || " ",
          font: "Courier New",
          size: 20,
        }),
      ],
      spacing: { before: 80, after: 80 },
    })
  );
}

export default createCodeParagraphs;
