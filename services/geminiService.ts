import { GoogleGenAI, Type } from "@google/genai";
import { GeminiModel, ImageSize } from "../types";

/**
 * Ensures the API key selection dialog is triggered if needed.
 * Adheres to the guideline: Assume success after triggering openSelectKey.
 */
export const ensureApiKeySelected = async (): Promise<void> => {
  const win = window as any;
  if (win.aistudio && typeof win.aistudio.hasSelectedApiKey === 'function') {
    const hasKey = await win.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await win.aistudio.openSelectKey();
      // Guideline: Assume successful after triggering openSelectKey
      return;
    }
  }
};

/**
 * Generates an image using Gemini 3 Pro Image Preview.
 */
export const generateCoverImage = async (prompt: string, size: ImageSize = '1K'): Promise<string> => {
  await ensureApiKeySelected();
  // Create fresh instance to ensure newest key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: GeminiModel.IMAGE_GEN,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          imageSize: size,
          aspectRatio: '1:1'
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated.");
  } catch (error: any) {
    if (error?.message?.includes("Requested entity was not found")) {
        const win = window as any;
        if (win.aistudio?.openSelectKey) await win.aistudio.openSelectKey();
    }
    console.error("Image Gen Error", error);
    throw error;
  }
};

/**
 * Edits an image using Gemini 2.5 Flash Image.
 */
export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = base64Image.split(',')[1] || base64Image;

  try {
    const response = await ai.models.generateContent({
      model: GeminiModel.IMAGE_EDIT,
      contents: {
        parts: [
            {
                inlineData: {
                    mimeType: 'image/png',
                    data: base64Data
                }
            },
            { text: prompt }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No edited image returned.");
  } catch (error) {
    console.error("Image Edit Error", error);
    throw error;
  }
};

/**
 * Analyzes an image using Gemini 3 Pro Preview to describe it.
 */
export const analyzeImage = async (base64Image: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = base64Image.split(',')[1] || base64Image;

  try {
    const response = await ai.models.generateContent({
      model: GeminiModel.IMAGE_ANALYSIS,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Data
            }
          },
          { text: "Describe this image in detail. Focus on the visual elements, mood, and setting. Keep it under 50 words." }
        ]
      }
    });
    return response.text || "Could not analyze image.";
  } catch (error) {
    console.error("Analysis Error", error);
    return "Analysis failed.";
  }
};

/**
 * Uses Search Grounding to find innocuous trending topics.
 */
export const getCoverStoryIdeas = async (): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: GeminiModel.TEXT_SEARCH,
      contents: "Find 3 trending, innocuous, and boring news topics from today (e.g. weather, local charity, mild science news) that would make a good cover story for a social media photo. Return only the topics as a JSON array of strings.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
      }
    });
    
    try {
        const text = response.text || "[]";
        return JSON.parse(text);
    } catch (e) {
        return ["A quiet morning hike", "New botanical garden opening", "Record rain levels this month"];
    }

  } catch (error) {
    console.error("Search Error", error);
    return ["A quiet day at the park", "My new cat", "Beautiful sunset"];
  }
};