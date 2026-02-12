// This file runs on Vercel's serverless infrastructure
import { IncomingForm } from 'formidable';
import * as mm from 'music-metadata';
import fs from 'fs';
import path from 'fs'; // This import seems incorrect, should be 'path' if used, but not used in the provided snippet. Keeping as per instruction.
import os from 'os';
import axios from 'axios';
import { pipeline } from 'stream/promises';

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
      message: 'Please use POST to analyze audio.'
    });
  }

  try {
    let filePath = '';
    let fileName = '';
    let mimeType = '';
    let fileSize = 0;

    // 2. Determine if analysis is via URL or direct upload
    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('application/json')) {
      // --- CHOICE A: ANALYSIS VIA URL (JSON POST) ---
      // Need to parse manually since bodyParser is off
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const body = JSON.parse(Buffer.concat(chunks).toString());
      const fileUrl = body.fileUrl || body.url;

      if (!fileUrl) {
        return res.status(400).json({ error: 'Missing fileUrl in JSON body' });
      }

      console.log('Downloading remote file:', fileUrl);
      const tempPath = `${os.tmpdir()}/remote-audio-${Date.now()}`;

      const response = await axios({
        method: 'get',
        url: fileUrl,
        responseType: 'stream',
        timeout: 30000, // 30s timeout
      });

      await pipeline(response.data, fs.createWriteStream(tempPath));

      filePath = tempPath;
      fileName = fileUrl.split('/').pop()?.split('?')[0] || 'remote_file';
      mimeType = response.headers['content-type'] || 'audio/mpeg';
      fileSize = parseInt(response.headers['content-length'] || '0');

    } else if (contentType.includes('multipart/form-data')) {
      // --- CHOICE B: DIRECT UPLOAD (MAX 4.5MB ON VERCEL) ---
      const data = await new Promise((resolve, reject) => {
        const form = new IncomingForm({
          keepExtensions: true,
          maxFileSize: 100 * 1024 * 1024,
          multiples: false,
        });
        form.parse(req, (err, fields, files) => {
          if (err) return reject(err);
          // Handle potential fields like 'fileUrl' even in form-data
          resolve({ fields, files });
        });
      });

      // Check for fileUrl in form fields first
      const remoteUrl = data.fields.fileUrl || data.fields.url;
      if (remoteUrl) {
        const urlToUse = Array.isArray(remoteUrl) ? remoteUrl[0] : remoteUrl;
        console.log('Downloading remote file from form field:', urlToUse);
        const tempPath = `${os.tmpdir()}/remote-audio-${Date.now()}`;
        const response = await axios({ method: 'get', url: urlToUse, responseType: 'stream' });
        await pipeline(response.data, fs.createWriteStream(tempPath));

        filePath = tempPath;
        fileName = urlToUse.split('/').pop()?.split('?')[0] || 'remote_file';
        mimeType = response.headers['content-type'] || 'audio/mpeg';
        fileSize = parseInt(response.headers['content-length'] || '0');
      } else {
        // Otherwise use uploaded file
        let file;
        const fileKeys = Object.keys(data.files);
        if (data.files.file) file = Array.isArray(data.files.file) ? data.files.file[0] : data.files.file;
        else if (data.files.audio) file = Array.isArray(data.files.audio) ? data.files.audio[0] : data.files.audio;
        else if (fileKeys.length > 0) file = Array.isArray(data.files[fileKeys[0]]) ? data.files[fileKeys[0]][0] : data.files[fileKeys[0]];

        if (!file || !file.filepath) {
          return res.status(413).json({
            error: 'Payload Too Large or No File',
            message: 'On Vercel Free, direct uploads must be < 4.5MB. For larger files (like yours), send a "fileUrl" instead.'
          });
        }
        filePath = file.filepath;
        fileName = file.originalFilename || 'uploaded_audio';
        mimeType = file.mimetype || 'audio/mpeg';
        fileSize = file.size;
      }
    } else {
      return res.status(400).json({ error: 'Unsupported Content-Type. Use application/json or multipart/form-data' });
    }

    // 3. Analyze bitstream
    const metadata = await mm.parseFile(filePath);
    const { format } = metadata;

    const result = {
      filename: fileName,
      mimeType: mimeType,
      sizeBytes: fileSize,
      format: format.container || 'Unknown',
      durationSeconds: format.duration || 0,
      bitrateKbps: format.bitrate ? Math.round(format.bitrate / 1000) : 0,
      sampleRateHz: format.sampleRate || 0,
      channels: format.numberOfChannels || 0,
      encoding: format.codec || format.codecProfile || 'Unknown',
      isLossless: format.lossless || false,
      timestamp: new Date().toISOString(),
      analysisMethod: filePath.includes(os.tmpdir()) ? 'Remote Download' : 'Direct Upload'
    };

    // 4. Cleanup
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn('Failed to cleanup temp file:', filePath);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Server processing error:', error);
    return res.status(500).json({
      error: 'Metadata Extraction Failed',
      details: error.message,
      tip: 'If processing a large file, ensure you are sending "fileUrl" and not the binary file itself.'
    });
  }
}