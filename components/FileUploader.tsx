import React, { useCallback } from 'react';
import { AppStatus } from '../types';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  status: AppStatus;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, status }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (status === AppStatus.ANALYZING) return;
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('audio/') || file.type === 'video/mp4') {
            onFileSelect(file);
        } else {
            alert("Please upload a valid audio file.");
        }
      }
    },
    [onFileSelect, status]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const isAnalyzing = status === AppStatus.ANALYZING;

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`
        relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
        flex flex-col items-center justify-center gap-4 group
        ${isAnalyzing ? 'opacity-50 cursor-not-allowed border-slate-600 bg-slate-800/50' : 'cursor-pointer hover:border-primary-500 hover:bg-slate-800/80 border-slate-600 bg-slate-800/30'}
      `}
    >
      <input
        type="file"
        accept="audio/*,video/mp4"
        onChange={handleChange}
        disabled={isAnalyzing}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      
      <div className={`p-4 rounded-full bg-slate-700 group-hover:bg-slate-600 transition-colors ${isAnalyzing ? 'animate-pulse' : ''}`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primary-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
        </svg>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-200">
          {isAnalyzing ? 'Parsing Metadata...' : 'Upload Audio File'}
        </h3>
        <p className="text-slate-400 text-sm">
          {isAnalyzing ? 'Reading file headers locally' : 'Drag & drop or click to browse (WAV, MP3, MP4, FLAC)'}
        </p>
      </div>
    </div>
  );
};