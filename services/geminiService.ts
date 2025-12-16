import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, Coordinates, QuoteAnalysisResult, DiagnosticResult, AdAnalysisResult, PredictionResult } from "../types";

// Biztonságos API kulcs kiolvasás Vite és Node környezetben is
const getApiKey = () => {
  let key = '';
  // 1. Próbáljuk meg Vite módon (import.meta.env)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    key = (import.meta as any).env.VITE_API_KEY || (import.meta as any).env.API_KEY || '';
  }
  // 2. Ha még nincs meg, és létezik a process (pl. Node build), próbáljuk onnan
  if (!key && typeof process !== 'undefined' && process.env) {
    key = process.env.API_KEY || '';
  }
  return key;
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

const modelId = "gemini-2.5-flash"; 

interface ImageFile {
  data: string;
  mimeType: string;
}

// --- Robust Helper to clean JSON from Markdown ---
const parseJsonFromMarkdown = (text: string): any => {
  if (!text) return {};
  try {
    // 1. Távolítsuk el a Markdown kódblokkokat (```json ... ```)
    let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // 2. Keresünk egy JSON-szerű blokkot (kapcsos zárójelek között)
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }
    
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Error (Gemini response was invalid):", e);
    console.debug("Raw text was:", text);
    // Visszatérünk egy üres objektummal, hogy ne omoljon össze az UI
    return {};
  }
};

// --- Existing Function (unchanged as it uses Tools) ---
export const findTrustworthyMechanics = async (
  problem: string,
  location: Coordinates,
  radiusKm: number
): Promise<AnalysisResult> => {
  if (!apiKey) throw new Error("Hiányzik az API kulcs (VITE_API_KEY vagy API_KEY).");

  const prompt = `
    Megbízható autószerelőt keresek a közelemben.
    Az autóm problémája: "${problem}".
    
    Kérlek, keress 3-5 magasan értékelt autószervizt ${radiusKm} km-es körzetben.
    
    RENDEZÉSI SZABÁLY (FONTOS):
    A listát rendezd szigorúan CSÖKKENŐ sorrendbe a "Bizalmi Index" alapján. 
    A legjobb legyen legelöl! A rangsorolás alapja: Értékelés (csillagok) ÉS a Vélemények száma együttesen. (Pl. egy 4.9-es, 500 véleményes hely előzze meg az 5.0-ás, 10 véleményes helyet).
    
    KRITIKUS UTASÍTÁSOK A FORMÁZÁSHOZ:
    1. A válaszod KIZÁRÓLAG egy Markdown listából álljon. Ne írj bevezetőt.
    2. Használj bullet points (lista) formátumot.
    3. Minden lista elem kövesse PONTOSAN EZT A STRUKTÚRÁT:
       
       * **Szerviz Neve**
         > [Itt írd le az elemzést, hogy miért ajánlod ezt a helyet...]
         >
         > 📍 [Pontos cím]
         > 📞 [Telefonszám]
         > 🌐 [Weboldal URL]
         > 🗺️ [Google Maps URL]
    
    SZIGORÚ ADATKEZELÉSI SZABÁLYOK:
    1. Ha egy adat (pl. telefonszám vagy weboldal) NEM érhető el, **NE ÍRD KI A SORT**.
    2. A cím és a Térkép link (Google Maps) KÖTELEZŐ (használd a tools outputot).
    3. A sorok elején csak az emojik legyenek (📍, 📞, 🌐, 🗺️).
    
    A válaszod MAGYAR nyelven írd.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude
            }
          }
        }
      }
    });

    const text = response.text || "Nem sikerült részletes elemzést készíteni.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text, shops: groundingChunks };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Nem sikerült elemezni a szerelőket.");
  }
};

// --- New Structured AI Functions ---

export const analyzeQuote = async (description: string, price: string, image?: ImageFile, carDetails?: string, mileage?: string): Promise<QuoteAnalysisResult> => {
  if (!apiKey) throw new Error("Hiányzik az API kulcs.");

  const mileageInfo = mileage ? `, Futásteljesítmény: ${mileage} km` : "";
  const carContext = carDetails ? `Jármű adatok: ${carDetails}${mileageInfo}` : "Jármű: Nincs specifikálva (általános piaci árakkal számolj)";

  const parts: any[] = [{ text: `
    Autószerelő árszakértő vagy. Elemezd ezt az ajánlatot.
    ${carContext}
    Leírás: ${description}
    Kapott ajánlott ár: ${price} HUF
    
    Magyarországi átlagárakkal számolj és vedd figyelembe a konkrét autótípus alkatrészárait és szervizigényét!
    Ha megadtam a futásteljesítményt, vizsgáld meg, hogy az adott km-nél reális-e ez a javítás (pl. vezérlés intervallum).
  `}];

  if (image) {
    parts.unshift({ inlineData: { mimeType: image.mimeType, data: image.data } });
  }

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          verdict: { type: Type.STRING, enum: ["Fair", "Overpriced", "Suspiciously Low", "Unclear"] },
          marketPriceRange: { type: Type.STRING, description: "Pl. 100.000 - 130.000 HUF" },
          summary: { type: Type.STRING, description: "Rövid, 1 mondatos összefoglaló" },
          redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
          advice: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["verdict", "marketPriceRange", "summary", "advice"]
      }
    }
  });

  return parseJsonFromMarkdown(response.text || "{}");
};

export const diagnoseCar = async (description: string, image?: ImageFile, carDetails?: string): Promise<DiagnosticResult> => {
  if (!apiKey) throw new Error("Hiányzik az API kulcs.");

  const carContext = carDetails ? `Jármű adatok: ${carDetails}` : "Jármű: Nincs specifikálva (általános diagnosztikát végezz)";

  const parts: any[] = [{ text: `
    Autószerelő vagy. Diagnosztizáld a hibát a leírás alapján.
    ${carContext}
    
    Vedd figyelembe az adott autótípusra jellemző típushibákat!
    Leírás: ${description}
  `}];

  if (image) {
    parts.unshift({ inlineData: { mimeType: image.mimeType, data: image.data } });
  }

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          urgencyLevel: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
          estimatedCostRange: { type: Type.STRING },
          possibleCauses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                cause: { type: Type.STRING },
                probability: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          },
          nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  return parseJsonFromMarkdown(response.text || "{}");
};

export const analyzeAd = async (adText: string, images: ImageFile[] = []): Promise<AdAnalysisResult> => {
  if (!apiKey) throw new Error("Hiányzik az API kulcs.");

  const parts: any[] = [{ text: `
    Használt autó kereskedő szakértő vagy. Elemezd ezt a hirdetést.
    
    Bemenet (szöveg vagy link): "${adText}"
    
    FELADAT:
    1. Ha a bemenet egy LINK (pl. hasznaltauto.hu, mobile.de), HASZNÁLD a Google Search eszközt a link tartalmának, az autó adatainak (ár, évjárat, leírás) felkutatására.
    2. Ha szöveg, elemezd a szöveget.
    3. Ha vannak képek, vesd össze őket a talált adatokkal (pl. sérülések, felszereltség).
    
    KIMENETI FORMÁTUM (KÖTELEZŐ):
    A válaszod KIZÁRÓLAG egy valid JSON objektum legyen (markdown kódblokkban vagy anélkül), az alábbi struktúrával:
    {
      "trustScore": number (0-100),
      "verdictShort": "string (Rövid, ütős főcím)",
      "redFlags": ["string", "string"],
      "greenFlags": ["string", "string"],
      "questionsToAsk": ["string", "string"]
    }
    
    Ne írj magyarázó szöveget a JSON elé vagy mögé.
  `}];

  if (images.length > 0) {
    images.forEach(img => {
      parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
    });
  }

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts },
    config: {
      // Fontos: Google Search használatakor NEM használhatunk responseMimeType: 'application/json'-t.
      // Ezért manuálisan parszoljuk a kimenetet.
      tools: [{ googleSearch: {} }], 
    }
  });

  const rawText = response.text || "{}";
  return parseJsonFromMarkdown(rawText);
};

export const predictCosts = async (carModel: string, mileage: string): Promise<PredictionResult> => {
  if (!apiKey) throw new Error("Hiányzik az API kulcs.");

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts: [{ text: `
      Autófenntartási szakértő vagy.
      Típus: ${carModel}
      Futás: ${mileage} km
      
      Adj konkrét előrejelzést.
    `}]},
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          carSummary: { type: Type.STRING },
          annualCostEstimate: { type: Type.STRING },
          upcomingMaintenance: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                item: { type: Type.STRING },
                dueInKm: { type: Type.STRING },
                estimatedCost: { type: Type.STRING }
              }
            }
          },
          commonFaults: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                fault: { type: Type.STRING },
                riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
              }
            }
          }
        }
      }
    }
  });

  return parseJsonFromMarkdown(response.text || "{}");
};