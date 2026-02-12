// This file runs on Vercel's serverless infrastructure
import { IncomingForm } from 'formidable';
import * as mm from 'music-metadata';
import fs from 'fs';

// Disable the default body parser so formidable can handle the multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // 1. Handle CORS for external tools (n8n, Bubble, Python, CURL, etc.)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Please use POST to upload audio files.'
    });
  }

  // Check if content-type is multipart/form-data
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return res.status(400).json({
      error: 'Invalid Content-Type',
      message: 'Request must be multipart/form-data'
    });
  }

  try {
    // 2. Parse the incoming form data
    const data = await new Promise((resolve, reject) => {
      const form = new IncomingForm({
        keepExtensions: true,
        allowEmptyFiles: false,
        maxFileSize: 100 * 1024 * 1024, // Increased to 100MB limit
        multiples: true,
      });

      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    // 3. Robustly find the uploaded file
    let file;
    const fileKeys = Object.keys(data.files);

    // Look for 'file', 'audio', 'data' or any first file found
    if (data.files.file) {
      file = Array.isArray(data.files.file) ? data.files.file[0] : data.files.file;
    } else if (data.files.audio) {
      file = Array.isArray(data.files.audio) ? data.files.audio[0] : data.files.audio;
    } else if (fileKeys.length > 0) {
      const firstKey = fileKeys[0];
      const fileOrArray = data.files[firstKey];
      file = Array.isArray(fileOrArray) ? fileOrArray[0] : fileOrArray;
    }

    if (!file || !file.filepath) {
      return res.status(400).json({
        error: 'No file uploaded',
        receivedFields: Object.keys(data.fields),
        receivedFiles: fileKeys,
        message: 'Please send the file as multipart/form-data with key "file" or "audio".'
      });
    }

    // 4. Analyze bitstream
    const metadata = await mm.parseFile(file.filepath);
    const { format } = metadata;

    const result = {
      filename: file.originalFilename || file.newFilename || 'uploaded_file',
      mimeType: file.mimetype || 'application/octet-stream',
      sizeBytes: file.size,
      format: format.container || 'Unknown',
      durationSeconds: format.duration || 0,
      bitrateKbps: format.bitrate ? Math.round(format.bitrate / 1000) : 0,
      sampleRateHz: format.sampleRate || 0,
      channels: format.numberOfChannels || 0,
      encoding: format.codec || format.codecProfile || 'Unknown',
      isLossless: format.lossless || false,
      timestamp: new Date().toISOString()
    };

    // 5. Cleanup
    try {
      fs.unlinkSync(file.filepath);
    } catch (e) {
      console.warn('Failed to cleanup temp file:', file.filepath);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Server processing error:', error);
    return res.status(500).json({
      error: 'Metadata Extraction Failed',
      details: error.message
    });
  }
}