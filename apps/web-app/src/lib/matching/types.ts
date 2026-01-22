/**
 * 回答者マッチングの型定義
 */

export interface ResponderCandidate {
  userId: string;
  score: number;
  matchedTags: string[];
}

export interface MatchingInput {
  threadId: string;
  categories: string[];
  estimatedLevel: string;
}

export interface MatchingResult {
  candidates: ResponderCandidate[];
  assignedCount: number;
}
