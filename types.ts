
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeId?: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        content: string;
      }[];
    };
  };
}

export interface AnalysisResult {
  text: string;
  shops: GroundingChunk[];
}

export enum LoadingState {
  IDLE = 'IDLE',
  GETTING_LOCATION = 'GETTING_LOCATION',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface SearchParams {
  problem: string;
  radius: number; // in km
}

// --- New Types for Auth & Dashboard ---

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface ServiceRecord {
  id: string;
  date: string;
  serviceName: string;
  description: string;
  cost: number;
}

export interface Car {
  id: string;
  make: string; // Márka (pl. Ford)
  model: string; // Típus (pl. Focus)
  year: string; // Évjárat
  plate?: string; // Rendszám (opcionális)
  color?: string; // UI színkódhoz vagy névhez
  records: ServiceRecord[];
}

export enum DashboardView {
  HOME = 'HOME',
  QUOTE_ANALYZER = 'QUOTE_ANALYZER',
  SERVICE_LOG = 'SERVICE_LOG',
  DIAGNOSTICS = 'DIAGNOSTICS',
  AD_ANALYZER = 'AD_ANALYZER',
  PREDICTIONS = 'PREDICTIONS',
  FIND_MECHANIC = 'FIND_MECHANIC'
}

// --- Structured AI Responses ---

export interface QuoteAnalysisResult {
  verdict: "Fair" | "Overpriced" | "Suspiciously Low" | "Unclear";
  marketPriceRange: string; // e.g. "120.000 - 150.000 HUF"
  summary: string;
  redFlags: string[];
  advice: string[];
}

export interface DiagnosticResult {
  urgencyLevel: "Low" | "Medium" | "High" | "Critical";
  possibleCauses: {
    cause: string;
    probability: string; // e.g. "Magas (80%)"
    description: string;
  }[];
  estimatedCostRange: string;
  nextSteps: string[];
}

export interface AdAnalysisResult {
  trustScore: number; // 0-100
  verdictShort: string;
  redFlags: string[]; // Bad signs
  greenFlags: string[]; // Good signs
  questionsToAsk: string[];
}

export interface PredictionResult {
  carSummary: string;
  upcomingMaintenance: {
    item: string;
    dueInKm: string;
    estimatedCost: string;
  }[];
  commonFaults: {
    fault: string;
    riskLevel: "Low" | "Medium" | "High";
  }[];
  annualCostEstimate: string;
}
