import { AudioMetadata } from "../types";

export const analyzeAudioRemote = async (file: File, endpointUrl: string, isDemoMode: boolean = false): Promise<AudioMetadata> => {
  
  // 1. DEMO MODE: Simulate a backend response
  if (isDemoMode) {
    console.log("Simulating API call...");
    await new Promise(resolve => setTimeout(resolve, 1500)); // Fake network delay

    return {
      filename: file.name,
      format: file.name.split('.').pop()?.toUpperCase() || 'MP3',
      mimeType: file.type || 'audio/mpeg',
      sizeBytes: file.size,
      durationSeconds: 245.5, // Fake duration
      bitrateKbps: 320,
      sampleRateHz: 44100,
      channels: 2,
      isLossless: false,
      encoding: 'LAME 3.99r',
    };
  }

  // 2. REAL MODE: Fetch from API
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(endpointUrl, {
      method: 'POST',
      body: formData,
      mode: 'cors',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      filename: data.filename || file.name,
      format: data.format || 'UNKNOWN',
      mimeType: data.mimeType || 'unknown',
      sizeBytes: data.sizeBytes || file.size,
      durationSeconds: data.durationSeconds || 0,
      bitrateKbps: data.bitrateKbps || 0,
      sampleRateHz: data.sampleRateHz || 0,
      channels: data.channels || 0,
      isLossless: data.isLossless || false,
      encoding: data.encoding || 'Unknown',
    };

  } catch (error: any) {
    console.error("API Upload Error:", error);
    
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
       throw new Error(
         `Connection Failed. This usually means:\n` +
         `• CORS is blocking the request. Ensure your backend has 'Access-Control-Allow-Origin: *'.\n` +
         `• The URL '${endpointUrl}' is unreachable or incorrect.\n` +
         `• You are mixing HTTPS (this app) with HTTP (your local server).`
       );
    }
    
    throw new Error(error.message || "Failed to connect to the analysis server.");
  }
};