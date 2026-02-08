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
  // 1. Handle CORS (Allow requests from anywhere or specific domains)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Warning: '*' allows any site to use your API. Change to your specific domain for security.
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    // 2. Parse the incoming form data (file upload)
    const data = await new Promise((resolve, reject) => {
      const form = new IncomingForm({
        keepExtensions: true,
        allowEmptyFiles: false,
        maxFileSize: 50 * 1024 * 1024, // 50MB limit
      });

      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    // Check if file exists. 'file' matches the formData.append('file', ...) key from the frontend
    // Formidable v3 returns an array of files
    const file = Array.isArray(data.files.file) ? data.files.file[0] : data.files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded. Ensure form-data key is "file".' });
    }

    // 3. Analyze the file using music-metadata
    const metadata = await mm.parseFile(file.filepath);
    const format = metadata.format;

    // 4. Clean up response structure
    const result = {
      filename: file.originalFilename || 'uploaded_file',
      mimeType: file.mimetype || 'application/octet-stream',
      sizeBytes: file.size,
      format: format.container,
      durationSeconds: format.duration || 0,
      bitrateKbps: format.bitrate ? Math.round(format.bitrate / 1000) : 0,
      sampleRateHz: format.sampleRate || 0,
      channels: format.numberOfChannels || 0,
      encoding: format.codec || format.codecProfile || 'Unknown',
      isLossless: format.lossless || false
    };

    // Clean up temp file (optional, Vercel lambda usually clears tmp, but good practice)
    try {
        fs.unlinkSync(file.filepath);
    } catch (e) {
        // ignore cleanup errors
    }

    // 5. Return JSON
    return res.status(200).json(result);

  } catch (error) {
    console.error('Analysis failed:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze audio file', 
      details: error.message 
    });
  }
}