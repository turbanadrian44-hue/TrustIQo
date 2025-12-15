import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, Coordinates } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const findTrustworthyMechanics = async (
  problem: string,
  location: Coordinates,
  radiusKm: number
): Promise<AnalysisResult> => {
  if (!apiKey) {
    throw new Error("Hiányzik az API kulcs. Kérlek ellenőrizd a környezeti beállításokat.");
  }

  const modelId = "gemini-2.5-flash"; // Efficient for tool use

  // Prompt engineering translated to Hungarian focusing on trust and STRUCTURED LIST output with CONTACT DETAILS
  const prompt = `
    Megbízható autószerelőt keresek a közelemben.
    Az autóm problémája: "${problem}".
    
    Kérlek, keress 3-5 magasan értékelt autószervizt ${radiusKm} km-es körzetben.
    
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
    2. Ne írj olyat, hogy "Nincs adat" vagy "Nem található". Egyszerűen hagyd ki azt a sort.
    3. A cím és a Térkép link (Google Maps) KÖTELEZŐ (használd a tools outputot).
    4. A sorok elején csak az emojik legyenek (📍, 📞, 🌐, 🗺️), ne írd ki szöveggel, hogy "Cím:" vagy "Telefon:".
    
    TARTALMI UTASÍTÁSOK:
    1. Részesítsd előnyben a magas értékelésű (4.5+ csillag) helyeket.
    2. Keress kulcsszavakat: "becsületes", "korrekt ár", "nem vert át".
    
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
    
    // Extract grounding chunks to display structured cards
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return {
      text,
      shops: groundingChunks
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Nem sikerült elemezni a szerelőket.");
  }
};