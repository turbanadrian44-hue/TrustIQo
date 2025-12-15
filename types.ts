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