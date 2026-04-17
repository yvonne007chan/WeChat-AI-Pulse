import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const MODELS = {
  flash: "gemini-3-flash-preview",
  pro: "gemini-3.1-pro-preview",
  image: "gemini-2.5-flash-image",
};

export interface ArticleSection {
  title: string;
  content: string;
}

export interface GeneratedArticle {
  title: string;
  introduction: string;
  sections: ArticleSection[];
  conclusion: string;
  cta: string;
}

export interface ViralAnalysis {
  titleScore: number;
  hookScore: number;
  structureScore: number;
  viralScore: number;
  patterns: string[];
  suggestions: string[];
  improvedTitles: string[];
}

export interface CoverOption {
  prompt: string;
  style: string;
  colorPalette: string[];
  textPlacement: {
    title: string;
    subtitle: string;
  };
  reasoning: string;
}

export const generateArticle = async (prompt: string): Promise<GeneratedArticle> => {
  const result = await ai.models.generateContent({
    model: MODELS.flash,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          introduction: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
              },
              required: ["title", "content"],
            },
          },
          conclusion: { type: Type.STRING },
          cta: { type: Type.STRING },
        },
        required: ["title", "introduction", "sections", "conclusion", "cta"],
      },
      systemInstruction: "You are a professional WeChat Official Account content creator. Generate a structured article based on the user's prompt. Use a viral, engaging tone common on WeChat. Ensure clearly separated sections.",
    },
  });

  return JSON.parse(result.text);
};

export const analyzeArticle = async (content: string): Promise<ViralAnalysis> => {
   const result = await ai.models.generateContent({
    model: MODELS.flash,
    contents: `Analyze this content for its viral potential on WeChat Official Accounts: \n\n ${content}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          titleScore: { type: Type.NUMBER },
          hookScore: { type: Type.NUMBER },
          structureScore: { type: Type.NUMBER },
          viralScore: { type: Type.NUMBER },
          patterns: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvedTitles: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["titleScore", "hookScore", "structureScore", "viralScore", "patterns", "suggestions", "improvedTitles"],
      },
      systemInstruction: "You are a content viral expert. Analyze WeChat articles based on title hooks, structure, emotional triggers, and rhythm. Provide a score out of 100 for each dimension.",
    },
  });

  return JSON.parse(result.text);
};

export const generateCoverDesignOptions = async (title: string, content: string): Promise<CoverOption[]> => {
  const result = await ai.models.generateContent({
    model: MODELS.pro,
    contents: `Title: ${title}\nContent: ${content.substring(0, 1000)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING },
            style: { type: Type.STRING },
            colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
            textPlacement: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                subtitle: { type: Type.STRING },
              },
              required: ["title", "subtitle"],
            },
            reasoning: { type: Type.STRING },
          },
          required: ["prompt", "style", "colorPalette", "textPlacement", "reasoning"],
        },
      },
      systemInstruction: "You are a specialized WeChat cover image designer and viral strategist. Create 3 distinct cover image designs for the given article. For each, provide a detailed AI image generation prompt, a visual style (e.g., Minimalist, 3D Render, Cyberpunk), a color palette (hex codes), and guidance on where to place text to maximize Click-Through Rate (CTR).",
    },
  });

  return JSON.parse(result.text);
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: MODELS.image,
    contents: [{ text: prompt }],
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: "1K"
      }
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image generated");
};
