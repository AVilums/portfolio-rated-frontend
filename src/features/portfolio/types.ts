import type { z } from 'zod';
import type { reportSchema } from './schemas';

export interface PortfolioPosition {
  ticker: string;
  allocation: number;
}
export interface PortfolioAnalysisRequest {
  positions: PortfolioPosition[];
}
export type PortfolioAnalysisResponse = z.infer<typeof reportSchema>;
