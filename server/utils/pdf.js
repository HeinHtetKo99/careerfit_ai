const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function extractPdfText(filePath) {
  const buffer = await fs.promises.readFile(filePath);
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return (result.text || '').trim();
  } finally {
    await parser.destroy();
  }
}

async function removeFile(filePath) {
  try {
    await fs.promises.unlink(filePath);
  } catch {
    // File may already be removed.
  }
}

module.exports = { extractPdfText, removeFile };
