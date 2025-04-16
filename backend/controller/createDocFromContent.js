import fs from "fs/promises";
import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel } from "docx";
import parseContentSections from "./parseContentSections.js";
import createParagraphsFromText from "./createParaFromText.js";
import createCodeParagraphs from "./createCodePara.js";

async function createDocumentFromContent(content, assignment, outputPath,name,uid) {
  try {
    const sections = parseContentSections(content, assignment.title);

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Experiment ", bold: true, size: 30 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: " ", size: 26 })],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),

          // Assignment Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: sections.title || assignment.title, bold: true, size: 34 })],
          }),
          new Paragraph({ text: "" }),

          // Student Info Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Name")], width: { size: 30, type: WidthType.PERCENTAGE } }),
                  new TableCell({ children: [new Paragraph(name)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("UID")] }),
                  new TableCell({ children: [new Paragraph(uid)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Date")] }),
                  new TableCell({ children: [new Paragraph(new Date().toLocaleDateString())] }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: "" }),

          // AIM
          new Paragraph({ text: "AIM", heading: HeadingLevel.HEADING_1 }),
          ...createParagraphsFromText(sections.aim),
          new Paragraph({ text: "" }),

          // ALGORITHM
          new Paragraph({ text: "PROCEDURE / ALGORITHM", heading: HeadingLevel.HEADING_1 }),
          ...createParagraphsFromText(sections.algorithm),

          new Paragraph({ text: "" }),
          // CODE
          new Paragraph({ text: "CODE", heading: HeadingLevel.HEADING_1 }),
          ...createCodeParagraphs(sections.code),

          new Paragraph({ text: "" }),  

          // OBSERVATION TABLE
          new Paragraph({ text: "OBSERVATION TABLE", heading: HeadingLevel.HEADING_1 }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Input")], width: { size: 33, type: WidthType.PERCENTAGE } }),
                  new TableCell({ children: [new Paragraph("Expected Output")], width: { size: 33, type: WidthType.PERCENTAGE } }),
                  new TableCell({ children: [new Paragraph("Actual Output")], width: { size: 34, type: WidthType.PERCENTAGE } }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("")] }),
                  new TableCell({ children: [new Paragraph("")] }),
                  new TableCell({ children: [new Paragraph("")] }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: "" }),

          // SCREENSHOTS / DIAGRAMS Placeholder
          new Paragraph({ text: "SCREENSHOTS & DIAGRAMS", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({
            children: [new TextRun({ text: "[This section will include relevant screenshots or diagrams]", italics: true })],
          }),

          new Paragraph({ text: "" }),  

          // CONCLUSION
          new Paragraph({ text: "CONCLUSION", heading: HeadingLevel.HEADING_1 }),
          ...createParagraphsFromText(sections.conclusion),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(outputPath, buffer);

    return outputPath;
  } catch (error) {
    console.error(`Error creating document: ${error.message}`);
    throw error;
  }
}

export default createDocumentFromContent;
