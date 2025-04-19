import fs from "fs/promises";
import {
  Packer,
  Paragraph,
  TextRun,
  Document,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
} from "docx";
import parseContentSections from "./parseContentSections.js";
import createParagraphsFromText from "./createParaFromText.js";
import createCodeParagraphs from "./createCodePara.js";
import supabase from "../supabaseClient.js";

async function createDocumentFromContent(content, assignment, name, uid) {
  try {
    const sections = parseContentSections(content, assignment.title);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Experiment ", bold: true, size: 30 })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: " ", size: 26 })],
            }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "" }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: sections.title || assignment.title,
                  bold: true,
                  size: 34,
                }),
              ],
            }),
            new Paragraph({ text: "" }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph("Name")],
                      width: { size: 30, type: WidthType.PERCENTAGE },
                    }),
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
                    new TableCell({
                      children: [new Paragraph(new Date().toLocaleDateString())],
                    }),
                  ],
                }),
              ],
            }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "AIM", heading: HeadingLevel.HEADING_1 }),
            ...createParagraphsFromText(sections.aim || ""),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "PROCEDURE / ALGORITHM", heading: HeadingLevel.HEADING_1 }),
            ...createParagraphsFromText(sections.algorithm || ""),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "CODE", heading: HeadingLevel.HEADING_1 }),
            ...createCodeParagraphs(sections.code || ""),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "OBSERVATION TABLE", heading: HeadingLevel.HEADING_1 }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph("Input")],
                      width: { size: 33, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph("Expected Output")],
                      width: { size: 33, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph("Actual Output")],
                      width: { size: 34, type: WidthType.PERCENTAGE },
                    }),
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
            new Paragraph({ text: "SCREENSHOTS & DIAGRAMS", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "[This section will include relevant screenshots or diagrams]",
                  italics: true,
                }),
              ],
            }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "CONCLUSION", heading: HeadingLevel.HEADING_1 }),
            ...createParagraphsFromText(sections.conclusion || ""),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const fileName = `${uid}_${Date.now()}.docx`;

    const { data, error } = await supabase.storage
      .from("gendocs")
      .upload(`assignments/${fileName}`, buffer, {
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: true,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from("gendocs")
      .getPublicUrl(`assignments/${fileName}`);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error(`Error creating document: ${error.message}`);
    throw error;
  }
}

export default createDocumentFromContent;
