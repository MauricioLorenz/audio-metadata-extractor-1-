import React, { useState } from 'react';

export const BackendSnippet: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'node' | 'curl' | 'js'>('curl');

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app';
  const apiUrl = `${currentUrl}/api/analyze`;

  const snippets = {
    curl: `
curl -X POST "${apiUrl}" \\
  -F "file=@/path/to/your/audio.wav"
    `.trim(),
    js: `
const formData = new FormData();
formData.append('file', audioFile); // File object from input

const response = await fetch("${apiUrl}", {
  method: 'POST',
  body: formData
});

const metadata = await response.json();
console.log(metadata);
    `.trim(),
    node: `
/**
 * BACKEND NODE.JS (Express/Cloud Function/Lambda)
 * Dependencies: "music-metadata", "multer", "cors"
 */
const express = require('express');
const multer = require('multer');
const mm = require('music-metadata');
const app = express();

const upload = multer({ storage: multer.memoryStorage() });

app.post('/analyze-audio', upload.single('file'), async (req, res) => {
  try {
    const metadata = await mm.parseBuffer(req.file.buffer, req.file.mimetype);
    res.json({
      filename: req.file.originalname,
      format: metadata.format.container,
      duration: metadata.format.duration,
      bitrate: metadata.format.bitrate,
      sampleRate: metadata.format.sampleRate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
    `.trim()
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-slate-700 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-white font-semibold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary-400">
              <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 0 0 2 4.25v11.5A2.25 2.25 0 0 0 4.25 18h11.5A2.25 2.25 0 0 0 18 15.75V4.25A2.25 2.25 0 0 0 15.75 2H4.25Zm4.03 6.22a.75.75 0 0 0-1.06 1.06L9.44 11l-2.22 2.22a.75.75 0 1 0 1.06 1.06l2.75-2.75a.75.75 0 0 0 0-1.06l-2.75-2.75Zm4.47 3.53a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
            </svg>
            API Integration Guide
          </h3>
          <p className="text-slate-400 text-sm">
            Use this endpoint from other services like n8n, Python, or CURL.
          </p>
        </div>
        <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
          {(['curl', 'js', 'node'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === tab ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <div className="relative group">
        <button
          onClick={handleCopy}
          className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-slate-800/80 backdrop-blur-sm hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md border border-slate-600 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <pre className="p-6 text-sm font-mono text-primary-300 overflow-x-auto whitespace-pre leading-relaxed bg-slate-950/50">
          <code>{snippets[activeTab]}</code>
        </pre>
      </div>
      <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700">
        <p className="text-xs text-slate-500 font-medium italic">
          Tip: Send <code>multipart/form-data</code> with the file attached to the <code>file</code> key.
        </p>
      </div>
    </div>
  );
};