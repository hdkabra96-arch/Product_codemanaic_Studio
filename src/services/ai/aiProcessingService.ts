import { GoogleGenAI } from '@google/genai';

const STORAGE_KEY = 'codemaniac_gemini_api_key';

/**
 * Get active Gemini API Key
 */
export function getSavedGeminiKey(): string {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local && local.trim()) return local.trim();
  } catch {
    // ignore
  }

  // Check Vite env
  try {
    const envKey = (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } }).env?.VITE_GEMINI_API_KEY;
    if (envKey) return envKey;
  } catch {
    // ignore
  }

  return '';
}

/**
 * Save Gemini API Key
 */
export function saveGeminiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, key.trim());
  } catch {
    // ignore
  }
}

/**
 * Get initialized Google Gen AI instance if key is present
 */
export function getGenAIClient(customKey?: string): GoogleGenAI | null {
  const key = customKey || getSavedGeminiKey();
  if (!key) return null;
  try {
    return new GoogleGenAI({ apiKey: key });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
    return null;
  }
}

/**
 * Generic Gemini prompt executor with smart fallback
 */
export async function executeAiPrompt(
  prompt: string,
  systemInstruction?: string,
  apiKey?: string
): Promise<{ text: string; isSimulated: boolean }> {
  const ai = getGenAIClient(apiKey);

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: systemInstruction
          ? {
              systemInstruction,
            }
          : undefined,
      });

      if (response && response.text) {
        return { text: response.text, isSimulated: false };
      }
    } catch (err: unknown) {
      console.warn('Gemini API call failed, falling back to simulated output:', err);
    }
  }

  // Smart simulated fallback mode when key is absent or quota exceeded
  return {
    text: generateSimulatedOutput(prompt),
    isSimulated: true,
  };
}

/**
 * Smart simulated output generator
 */
function generateSimulatedOutput(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes('summarize') || lower.includes('summary')) {
    return `### Executive Document Summary\n\n**Overview:**\nThis document provides key insights into the analyzed subject matter, highlighting strategic objectives, core metrics, and operational milestones.\n\n**Key Takeaways:**\n- **High Performance:** Client-side execution eliminates latency and ensures immediate processing.\n- **Data Sovereignty:** Zero cloud data leakage guarantees compliance with international privacy benchmarks.\n- **Extensibility:** Standardized modular architecture enables rapid scaling across document types.\n\n**Actionable Recommendations:**\n1. Review the primary sections for domain-specific requirements.\n2. Proceed with integration into workflow automation pipelines.`;
  }

  if (lower.includes('question') || lower.includes('quiz')) {
    return `### Generated Practice Questions & Quiz\n\n**Question 1 (Multiple Choice):**\nWhat is the primary benefit of client-side web application processing?\n- A) Requires expensive server farms\n- B) 100% data privacy and zero server bandwidth egress (Correct)\n- C) Relies entirely on slow cloud roundtrips\n- D) None of the above\n\n**Question 2 (Conceptual):**\n*Explain how ISO 32000-1 compliance ensures cross-platform PDF fidelity.*\n**Answer:** It guarantees consistent font metrics, vector path rasterization, and metadata integrity across all PDF readers.\n\n**Question 3 (Flashcard):**\n**Q:** What library is used for high-fidelity audio compression in modern browsers?\n**A:** Web Audio API with LameJS for MP3 bit-depth synthesis.`;
  }

  if (lower.includes('caption') || lower.includes('subtitle')) {
    return `1\n00:00:00,500 --> 00:00:03,200\nWelcome to Codemaniac Studio tools platform.\n\n2\n00:00:03,500 --> 00:00:07,000\nExperience fast, secure, and private digital workflows.\n\n3\n00:00:07,200 --> 00:00:11,500\nAll your media, audio, and PDF needs in one single place.`;
  }

  return `### Codemaniac AI Assistant Result\n\n**Generated Content:**\nCodemaniac Studio brings state-of-the-art digital tools directly to modern creators, developers, and organizations. With 77 specialized tools across PDF, Image, Video, Audio, Utility, and AI processing, workflows are simplified with unmatched speed and privacy.\n\n**Key Highlights:**\n- Zero Server Cost: Entirely processed in your browser sandbox.\n- High Quality: Lossless vector and audio encoding.\n- Ready for Production.`;
}
