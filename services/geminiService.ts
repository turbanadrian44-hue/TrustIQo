
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, Coordinates, QuoteAnalysisResult, DiagnosticResult, AdAnalysisResult, PredictionResult } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const modelId = "gemini-2.5-flash"; 

interface ImageFile {
  data: string;
  mimeType: string;
}

// --- Existing Function (unchanged as it uses Tools) ---
export const findTrustworthyMechanics = async (
  problem: string,
  location: Coordinates,
  radiusKm: number
): Promise<AnalysisResult> => {
  if (!apiKey) throw new Error("Hiányzik az API kulcs.");

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

  return JSON.parse(response.text || "{}");
};

export const diagnoseCar = async (description: string, image?: ImageFile): Promise<DiagnosticResult> => {
  if (!apiKey) throw new Error("Hiányzik az API kulcs.");

  const parts: any[] = [{ text: `
    Autószerelő vagy. Diagnosztizáld a hibát a leírás alapján.
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

  return JSON.parse(response.text || "{}");
};

export const analyzeAd = async (adText: string): Promise<AdAnalysisResult> => {
  if (!apiKey) throw new Error("Hiányzik az API kulcs.");

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts: [{ text: `
      Használt autó kereskedő szakértő vagy. Elemezd ezt a hirdetést.
      Szöveg: "${adText}"
      
      Értékelj szigorúan. Keress rejtett hibákra utaló jeleket.
    `}]},
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          trustScore: { type: Type.INTEGER, description: "0-100 közötti pontszám" },
          verdictShort: { type: Type.STRING, description: "Egy ütős főcím" },
          redFlags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Gyanús jelek" },
          greenFlags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Pozitívumok" },
          questionsToAsk: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Mit kérdezzen telefonon" }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
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

  return JSON.parse(response.text || "{}");
};
