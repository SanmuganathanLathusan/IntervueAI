const express = require('express');
const upload = require('../middleware/upload');
const { extractTextFromPdf, resolveUploadPath } = require('../utils/pdf');

const router = express.Router();

const handleExtractText = async (req, res) => {
  try {
    let pdfText = '';
    let filePath = req.body.filePath;

    if (req.file) {
      filePath = req.file.path;
      pdfText = await extractTextFromPdf({ filePath });
    } else if (filePath) {
      const resolvedPath = filePath.startsWith(process.cwd()) ? filePath : resolveUploadPath(filePath);
      pdfText = await extractTextFromPdf({ filePath: resolvedPath });
      filePath = resolvedPath;
    } else {
      return res.status(400).json({ message: 'Upload a PDF file or pass a filePath' });
    }

    return res.json({
      message: 'PDF text extracted successfully',
      filePath,
      pdfText,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to extract text', error: error.message });
  }
};

const handleUploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'A PDF file is required' });
    }

    const pdfText = await extractTextFromPdf({ filePath: req.file.path });

    return res.status(201).json({
      message: 'PDF uploaded successfully',
      fileName: req.file.filename,
      filePath: req.file.path,
      pdfText,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to upload PDF', error: error.message });
  }
};

router.post('/upload-pdf', upload.single('file'), handleUploadPdf);
router.post('/extract-text', upload.single('file'), handleExtractText);

module.exports = router;
