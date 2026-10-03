import { GoogleGenAI } from "@google/genai";

/**
 * GEMINI MULTI-KEY ROTATOR & LOAD BALANCER POOL
 * 
 * Mendukung hingga 5 Gemini API Keys (GEMINI_API_KEY_1 s.d. GEMINI_API_KEY_5)
 * serta GEMINI_API_KEY default.
 * Fitur:
 * 1. Round-Robin Load Balancing untuk meratakan pemakaian kuota RPM/RPD
 * 2. Automatic Fallback saat terkena limit HTTP 429 (Resource Exhausted / Quota Exceeded)
 * 3. Dukungan Custom API Key dari pengguna
 */

export const PRIMARY_GEMINI_MODEL = "gemini-3.8-flash";
export const BACKUP_GEMINI_MODELS = ["gemini-2.5-flash"];

export interface GenerateOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  customApiKey?: string;
}

export interface GenerateResult {
  text: string;
  modelUsed: string;
  keyIndex: number;
  totalKeys: number;
  attemptsUsed: number;
}

/**
 * Mengumpulkan seluruh API Key yang tersedia di server environment & secrets
 */
export function getGeminiKeyPool(customApiKey?: string): string[] {
  const pool: string[] = [];

  // Jika client menyediakan custom key via header, letakkan di urutan prioritas pertama
  if (customApiKey && typeof customApiKey === "string" && customApiKey.trim().length > 10) {
    pool.push(customApiKey.trim());
  }

  // 5 Kunci Gemini khusus dari Cloudflare Secrets / Environment Variables
  const envKeys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY,
    process.env.API_KEY,
  ];

  for (const k of envKeys) {
    if (k && typeof k === "string" && k.trim().length > 10) {
      const clean = k.trim();
      if (!pool.includes(clean)) {
        pool.push(clean);
      }
    }
  }

  return pool;
}

let currentRotatorIndex = 0;

/**
 * Eksekusi generasi AI dengan rotasi key dan fallback otomatis jika terkena HTTP 429
 */
export async function generateWithGeminiPool(options: GenerateOptions): Promise<GenerateResult> {
  const keyPool = getGeminiKeyPool(options.customApiKey);

  if (keyPool.length === 0) {
    throw new Error(
      "Tidak ada Gemini API Key yang tersedia. Harap tentukan GEMINI_API_KEY_1 s.d. GEMINI_API_KEY_5 di environment server/Cloudflare, atau masukkan API Key pribadi di Pengaturan AI Studio."
    );
  }

  // Round-robin load balancing antar pemanggilan
  currentRotatorIndex = (currentRotatorIndex + 1) % keyPool.length;
  const startingIndex = currentRotatorIndex;

  let attempts = 0;
  let lastError: any = null;

  while (attempts < keyPool.length) {
    const keyIdx = (startingIndex + attempts) % keyPool.length;
    const apiKey = keyPool[keyIdx];
    const maskedKey = apiKey.substring(0, 6) + "..." + apiKey.substring(apiKey.length - 4);

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const modelsToTry = [PRIMARY_GEMINI_MODEL, ...BACKUP_GEMINI_MODELS];
      let responseText = "";
      let modelUsed = PRIMARY_GEMINI_MODEL;

      for (const m of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            contents: options.prompt,
            config: {
              systemInstruction: options.systemInstruction,
              temperature: options.temperature ?? 0.7,
            },
          });

          if (response?.text) {
            responseText = response.text;
            modelUsed = m;
            break;
          }
        } catch (mErr: any) {
          const msg = mErr?.message || "";
          const is429 =
            msg.includes("429") ||
            msg.includes("RESOURCE_EXHAUSTED") ||
            msg.toLowerCase().includes("quota") ||
            msg.toLowerCase().includes("rate limit") ||
            mErr?.status === 429;

          // Jika terkena 429, jangan coba model lain pada KEY YANG SAMA, langsung switch ke key berikutnya!
          if (is429) {
            throw mErr;
          }

          console.warn(`[Gemini Model Fallback] Model ${m} gagal pada key #${keyIdx + 1}:`, msg);
          lastError = mErr;
        }
      }

      if (responseText) {
        return {
          text: responseText,
          modelUsed,
          keyIndex: keyIdx,
          totalKeys: keyPool.length,
          attemptsUsed: attempts + 1,
        };
      }
    } catch (err: any) {
      lastError = err;
      attempts++;
      const msg = err?.message || "";
      const is429 =
        msg.includes("429") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.toLowerCase().includes("quota") ||
        msg.toLowerCase().includes("rate limit") ||
        err?.status === 429;

      if (is429 && attempts < keyPool.length) {
        console.warn(
          `[Gemini Multi-Key Rotator] ⚠️ Key #${keyIdx + 1} (${maskedKey}) terkena limit kuota (HTTP 429). Otomatis beralih ke key #${((keyIdx + 1) % keyPool.length) + 1} (Percobaan ${attempts + 1}/${keyPool.length})...`
        );
        continue;
      }

      if (!is429) {
        throw err;
      }
    }
  }

  throw new Error(
    `Seluruh ${keyPool.length} Gemini API Key dalam pool telah mencapai batas kuota (HTTP 429 Rate Limit). Harap tunggu 1 menit sebelum mencoba lagi. Detail: ${lastError?.message || "Quota exceeded"}`
  );
}

/**
 * Status pool untuk monitoring di frontend / healthcheck
 */
export function getGeminiPoolInfo(customApiKey?: string) {
  const pool = getGeminiKeyPool(customApiKey);
  return {
    totalKeys: pool.length,
    activeModel: PRIMARY_GEMINI_MODEL,
    hasServerKeys: pool.length > (customApiKey ? 1 : 0),
    keysMasked: pool.map((k, i) => `Key #${i + 1} (${k.substring(0, 6)}...${k.substring(k.length - 4)})`),
  };
}
