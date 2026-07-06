const fs = require('fs');
const path = require('path');
const multer = require('multer');
const config = require('../config');

const UPLOAD_FIELD = 'resume';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

if (!fs.existsSync(config.uploadsDir)) {
  fs.mkdirSync(config.uploadsDir, { recursive: true });
}

function createHttpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

const storage = multer.diskStorage({
  destination: config.uploadsDir,
  filename: (req, file, cb) => {
    const userId = req.user?.id ?? 'unknown';
    const unique = `${userId}-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}.pdf`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const isPdf =
      file.mimetype === 'application/pdf' ||
      path.extname(file.originalname).toLowerCase() === '.pdf';

    if (!isPdf) {
      return cb(createHttpError(400, 'Only PDF files are allowed'));
    }

    cb(null, true);
  },
});

function uploadResume(req, res, next) {
  upload.single(UPLOAD_FIELD)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        const message =
          err.code === 'LIMIT_FILE_SIZE'
            ? 'File exceeds the 10MB size limit'
            : err.message;
        return next(createHttpError(400, message));
      }
      return next(err);
    }
    next();
  });
}

function uploadResumeOptional(req, res, next) {
  uploadResume(req, res, next);
}

module.exports = { uploadResume, uploadResumeOptional, UPLOAD_FIELD };
