import React, { useState, useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { MetadataResult } from './components/MetadataResult';
import { BackendSnippet } from './components/BackendSnippet';
import { analyzeAudioRemote } from './services/audioService';
import { AudioMetadata, AppStatus } from './types';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<AudioMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Default to relative path "/api/analyze". 
  // When deployed on Vercel, this automatically points to the serverless function.
  const [apiUrl, setApiUrl] = useState<string>('/api/analyze');
  
  // Default to false now, so user tries the Real API immediately on deploy
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const handleFileSelect = async (file: File) => {
    // Validation
    if (!isDemoMode && !apiUrl) {
      alert("Please enter a valid API Endpoint URL or enable Simulation Mode.");
      return;
    }

    try {
      setStatus(AppStatus.ANALYZING);
      setError(null);
      setResult(null);
      
      // Upload to backend or Simulate
      const metadata = await analyzeAudioRemote(file, apiUrl, isDemoMode);

      setResult(metadata);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setStatus(AppStatus.ERROR);
      setError(err.message || "Failed to analyze audio file.");
    }
  };

  const reset = () => {
    setStatus(AppStatus.IDLE);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 font-sans selection:bg-primary-500/30">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-primary-500">
              <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 0 1 .75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 0 1 9.75 22.5a.75.75 0 0 1-.75-.75v-4.131A15.838 15.838 0 0 1 6.382 15H2.25a.75.75 0 0 1-.75-.75 6.75 6.75 0 0 1 7.815-6.666ZM15 6.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" clipRule="evenodd" />
              <path d="M5.26 17.242a.75.75 0 1 0-.897-1.203 5.243 5.243 0 0 0-2.05 5.022.75.75 0 0 0 .625.627 5.243 5.243 0 0 0 5.022-2.051.75.75 0 1 0-1.202-.897 3.744 3.744 0 0 1-3.008 1.51c0-1.23.592-2.323 1.51-3.008Z" />
            </svg>
            <span className="ml-3 text-xl font-bold text-white tracking-tight">Audio Metadata API Client</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500">
            Upload & Analyze
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Sends your audio file to the <code>/api/analyze</code> endpoint (hosted on Vercel) to extract metadata.
          </p>
        </header>

        {/* Main Content Area */}
        <main className="space-y-6">
          
          {/* API URL Configuration */}
          <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex flex-col gap-4">
            
            {/* Toggle Demo Mode */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isDemoMode} 
                  onChange={(e) => setIsDemoMode(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 text-primary-500 focus:ring-primary-500/50 bg-slate-800"
                />
                Simulate Backend (Demo Mode)
              </label>
              <span className={`text-xs px-2 py-1 rounded border ${isDemoMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                {isDemoMode ? 'Simulating Response' : 'Real API Request'}
              </span>
            </div>

            {/* URL Input (Disabled in Demo Mode) */}
            <div className={`transition-opacity duration-200 ${isDemoMode ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              <label htmlFor="apiUrl" className="text-sm font-semibold text-slate-300 mb-1 block">
                API Endpoint URL (POST)
              </label>
              <div className="flex gap-2">
                <input
                  id="apiUrl"
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://your-bubble-app.com/api/analyze"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-primary-500 transition-colors font-mono text-sm"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                The app will send a <code>POST</code> request with the file in a <code>FormData</code> body (key: 'file').
              </p>
            </div>
          </div>

          {/* File Input */}
          <div className="bg-slate-900/50 p-1 rounded-2xl border border-slate-800 shadow-2xl">
            {status === AppStatus.SUCCESS && result ? (
              <div className="p-8 text-center space-y-6">
                <MetadataResult data={result} />
                <button 
                  onClick={reset}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg border border-slate-600 transition-all hover:scale-105 active:scale-95"
                >
                  Analyze Another File
                </button>
              </div>
            ) : (
              <div className="p-2">
                 <FileUploader onFileSelect={handleFileSelect} status={status} />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-400 shrink-0 mt-0.5">
                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-semibold text-red-400">Request Failed</h4>
                <p className="text-red-300 text-sm mt-1 whitespace-pre-wrap leading-relaxed font-mono">{error}</p>
              </div>
            </div>
          )}

          {/* Code Export Section for Backend */}
          <BackendSnippet />

        </main>
      </div>
    </div>
  );
};

export default App;