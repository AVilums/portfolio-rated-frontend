import type { z } from 'zod';
import type { reportSchema } from './schemas';

export interface PortfolioPosition {
  ticker: string;
  allocation: number;
  average_price: number;
}
export interface SavedPortfolioPosition {
  ticker: string;
  allocation: number;
  average_price: number | null;
}
export interface PortfolioAnalysisRequest {
  positions: PortfolioPosition[];
}
export type PortfolioAnalysisResponse = z.infer<typeof reportSchema>;
