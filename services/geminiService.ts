import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AudioMetadata } from "../types";

// Define the expected schema for the Gemini response
const metadataSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    format: { type: Type.STRING, description: "The audio container format (e.g., WAV, MP3, MP4, FLAC)." },
    mimeType: { type: Type.STRING, description: "The IANA MIME type." },
    durationSeconds: { type: Type.NUMBER, description: "Duration in seconds." },
    bitrateKbps: { type: Type.NUMBER, description: "Bitrate in kbps." },
    sampleRateHz: { type: Type.NUMBER, description: "Sample rate in Hz." },
    channels: { type: Type.INTEGER, description: "Number of audio channels." },
    isLossless: { type: Type.BOOLEAN, description: "Whether the format is lossless." },
    encoding: { type: Type.STRING, description: "The encoding standard used (e.g., PCM, AAC, MP3)." },
  },
  required: ["format", "mimeType", "durationSeconds", "bitrateKbps", "sampleRateHz", "channels", "isLossless", "encoding"],
};

export const analyzeAudioWithGemini = async (
  base64Data: string,
  mimeType: string,
  fileName: string,
  fileSize: number
): Promise<AudioMetadata> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key is missing. Please check your environment configuration.");
    }

    const ai = new GoogleGenAI({ apiKey });

    // Using gemini-3-flash-preview as it is fast and capable of multimodal reasoning
    const modelId = "gemini-3-flash-preview"; 
    
    const prompt = `
      Analyze this audio file technically. 
      I need strict technical metadata. 
      The file name is "${fileName}" and the file size is ${fileSize} bytes.
      
      Extract or estimate the following with high precision:
      - Format (WAV, MP3, etc)
      - Bitrate (kbps)
      - Sample Rate (Hz)
      - Channels
      - Encoding
      - Duration
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: metadataSchema,
        temperature: 0, // Deterministic for technical data
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("Empty response from Gemini.");
    }

    const data = JSON.parse(jsonText);

    return {
      filename: fileName,
      sizeBytes: fileSize,
      ...data
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};