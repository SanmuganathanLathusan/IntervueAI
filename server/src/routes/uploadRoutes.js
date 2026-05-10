const express = require('express');
const upload = require('../middleware/upload');
const authMiddleware = require('../middleware/auth');
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

    console.log(`[Upload] Processing: ${req.file.originalname} (${req.file.size} bytes)`);
    const pdfText = await extractTextFromPdf({ filePath: req.file.path });

    if (!pdfText || pdfText.trim().length < 50) {
      return res.status(422).json({ message: 'PDF appears to be empty or unreadable. Please upload a text-based PDF.' });
    }

    return res.status(201).json({
      message: 'PDF uploaded successfully',
      fileName: req.file.filename,
      filePath: req.file.path,
      pdfText,
    });
  } catch (error) {
    console.error('[Upload] Error:', error.message);
    return res.status(500).json({ message: 'Failed to upload PDF', error: error.message });
  }
};

// Both routes require authentication to prevent anonymous abuse
router.post('/upload-pdf', authMiddleware, upload.single('file'), handleUploadPdf);
router.post('/extract-text', authMiddleware, upload.single('file'), handleExtractText);

module.exports = router;
