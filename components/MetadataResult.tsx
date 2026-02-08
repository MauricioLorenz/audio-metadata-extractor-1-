import React from 'react';
import { AudioMetadata } from '../types';
import { formatFileSize } from '../utils/fileUtils';

interface MetadataResultProps {
  data: AudioMetadata;
}

export const MetadataResult: React.FC<MetadataResultProps> = ({ data }) => {
  const items = [
    { label: "File Name", value: data.filename, colSpan: true },
    { label: "Format", value: data.format },
    { label: "MIME Type", value: data.mimeType },
    { label: "Duration", value: data.durationSeconds ? `${data.durationSeconds.toFixed(2)}s` : 'Unknown' },
    { label: "File Size", value: formatFileSize(data.sizeBytes) },
    { label: "Bitrate", value: data.bitrateKbps ? `${data.bitrateKbps} kbps` : 'N/A' },
    { label: "Sample Rate", value: data.sampleRateHz ? `${data.sampleRateHz} Hz` : 'N/A' },
    { label: "Channels", value: data.channels === 1 ? 'Mono (1)' : data.channels > 1 ? `Stereo (${data.channels})` : 'Unknown' },
    { label: "Encoding", value: data.encoding },
    { label: "Lossless", value: data.isLossless ? 'Yes' : 'No' },
  ];

  return (
    <div className="w-full bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl animate-fade-in-up">
      <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Analysis Result
        </h2>
        <span className="px-3 py-1 bg-primary-900/30 text-primary-400 text-xs font-mono rounded-full border border-primary-800">
          Source: Remote API
        </span>
      </div>
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, idx) => (
          <div 
            key={idx} 
            className={`bg-slate-900/40 p-3 rounded-lg border border-slate-700/50 ${item.colSpan ? 'md:col-span-2' : ''}`}
          >
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
            <p className="text-slate-200 font-mono text-sm md:text-base truncate">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-black/30 p-4 border-t border-slate-700">
         <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Raw JSON Response</p>
         <pre className="text-xs text-emerald-400 font-mono overflow-x-auto p-2 bg-slate-950 rounded border border-slate-800">
           {JSON.stringify(data, null, 2)}
         </pre>
      </div>
    </div>
  );
};