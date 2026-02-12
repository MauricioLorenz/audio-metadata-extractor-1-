# Audio Metadata Extractor & API

A high-performance audio metadata extraction tool built with React/Vite and Vercel Serverless Functions. It provides both a web UI and a REST API endpoint to extract technical metadata from WAV, MP3, FLAC, and other audio formats.

## 🚀 Features

- **Web UI:** Drag & drop interface to analyze files instantly.
- **REST API:** Endpoint at `/api/analyze` for external integrations (n8n, Bubble, Python, etc.).
- **Detailed Metadata:** Extract bitrate, sample rate, channels, duration, encoding, and more.
- **Robust Parsing:** Uses `music-metadata` for deterministic extraction.

## 🛠️ API Usage

### Endpoint
`POST /api/analyze`

### Request (CURL)
```bash
curl -X POST "https://your-app.vercel.app/api/analyze" \
  -F "file=@/path/to/your/audio.wav"
```

### Response (JSON)
```json
{
  "filename": "audio.wav",
  "mimeType": "audio/wav",
  "sizeBytes": 1048576,
  "format": "WAV",
  "durationSeconds": 120.5,
  "bitrateKbps": 1411,
  "sampleRateHz": 44100,
  "channels": 2,
  "encoding": "PCM",
  "isLossless": true,
  "timestamp": "2024-03-20T10:00:00Z"
}
```

## 📦 Installation & Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run locally:**
   ```bash
   npm run dev
   ```

3. **Vercel Deployment:**
   - Push to GitHub.
   - Import to Vercel.
   - The `/api` directory will be automatically deployed as Serverless Functions.

## 📄 License
MIT
