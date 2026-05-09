const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const extractTextFromPdf = async ({ filePath, buffer }) => {
  const pdfBuffer = buffer || fs.readFileSync(filePath);
  const parsed = await pdfParse(pdfBuffer);
  return parsed.text.replace(/\s+/g, ' ').trim();
};

const resolveUploadPath = (fileName) => {
  return path.join(process.cwd(), 'uploads', fileName);
};

module.exports = {
  extractTextFromPdf,
  resolveUploadPath,
};
