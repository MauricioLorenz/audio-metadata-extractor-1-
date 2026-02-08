export interface AudioMetadata {
  filename: string;
  format: string; // e.g., "WAV", "MP3"
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number;
  bitrateKbps: number;
  sampleRateHz: number;
  channels: number; // 1 (Mono) or 2 (Stereo)
  isLossless: boolean;
  encoding: string; // e.g., "PCM", "AAC"
}

export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface BackendSnippetProps {
  apiKeyVariableName: string;
}