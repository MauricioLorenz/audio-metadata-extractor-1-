import React, { useState } from 'react';

export const BackendSnippet: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const snippet = `
/**
 * BACKEND NODE.JS (Express/Cloud Function/Lambda)
 * 
 * Dependencies:
 * "music-metadata": "^7.14.0",
 * "multer": "^1.4.5-lts.1",
 * "cors": "^2.8.5"
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mm = require('music-metadata');

const app = express();
// Enable CORS for all routes (Critical for browser clients)
app.use(cors({ origin: true }));

// Configure Multer to store file in memory temporarily
const upload = multer({ storage: multer.memoryStorage() });

// POST endpoint expecting a file with key 'file'
app.post('/analyze-audio', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // req.file.buffer contains the binary data
    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    const originalName = req.file.originalname;

    // Parse metadata using music-metadata
    const metadata = await mm.parseBuffer(fileBuffer, mimeType);
    const format = metadata.format;

    const result = {
      filename: originalName,
      mimeType: mimeType,
      sizeBytes: req.file.size,
      format: format.container,
      durationSeconds: format.duration,
      bitrateKbps: format.bitrate ? Math.round(format.bitrate / 1000) : 0,
      sampleRateHz: format.sampleRate,
      channels: format.numberOfChannels,
      encoding: format.codec || format.codecProfile,
      isLossless: format.lossless
    };

    return res.json(result);

  } catch (error) {
    console.error("Processing error:", error);
    return res.status(500).json({ error: error.message });
  }
});
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-700 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-white font-semibold">Backend Code Example (Node.js)</h3>
          <p className="text-slate-400 text-sm">
            Example using Express + CORS + Multer.
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-600 transition-colors flex items-center gap-2 shrink-0"
        >
          {copied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Copied!
            </>
          ) : (
            <>
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
              </svg>
              Copy Node.js Snippet
            </>
          )}
        </button>
      </div>
      <div className="p-0 overflow-hidden">
        <pre className="p-4 text-sm font-mono text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">
          <code className="language-javascript">{snippet}</code>
        </pre>
      </div>
    </div>
  );
};