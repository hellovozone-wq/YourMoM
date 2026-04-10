import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function processMeetingAudio(audioBlob: Blob, language: 'en' | 'id' = 'en') {
  const base64Data = await blobToBase64(audioBlob);
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: audioBlob.type,
              data: base64Data,
            },
          },
        ],
      },
    ],
    config: {
      systemInstruction: `You are a professional meeting assistant. 
      Your task is to process the provided meeting audio and generate a structured report.
      
      STRICT INSTRUCTIONS:
      1. TRANSCRIPTION: Transcribe the audio exactly as spoken, identifying speakers (e.g., Speaker 1, Speaker 2).
      2. SUMMARY: Provide a concise summary of the key points discussed.
      3. ACTION ITEMS: List the decisions made and tasks assigned.
      
      LANGUAGE SETTING:
      - The Transcript section must remain in the original language spoken in the audio.
      - The Summary and Action Items sections MUST be written entirely in ${language === 'id' ? 'Bahasa Indonesia' : 'English'}.
      
      MARKDOWN STRUCTURE:
      Use the following headers exactly:
      # Transcript
      # ${language === 'id' ? 'Ringkasan' : 'Summary'}
      # ${language === 'id' ? 'Daftar Tindakan' : 'Action Items'}`,
    }
  });

  return response.text;
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(",")[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
