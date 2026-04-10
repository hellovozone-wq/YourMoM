import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function processMeetingAudio(audioBlob: Blob) {
  const base64Data = await blobToBase64(audioBlob);
  
  const prompt = `
    You are a professional meeting assistant. 
    1. Transcribe the provided audio accurately.
    2. Identify different speakers in the audio and label their contributions (e.g., Speaker 1, Speaker 2, or by name if mentioned).
    3. Provide a concise summary of the meeting.
    4. List key action items and decisions made.
    
    Format your response in Markdown with the following sections:
    # Transcript
    [The full transcription with speaker labels, e.g., **Speaker 1**: "Hello everyone..."]
    
    # Summary
    [The concise summary]
    
    # Action Items
    [Bullet points of action items]
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: audioBlob.type,
              data: base64Data,
            },
          },
        ],
      },
    ],
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
