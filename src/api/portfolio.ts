import { request } from './client';
import { portfolioSchema, reportSchema } from '../features/portfolio/schemas';
import type {
  PortfolioAnalysisRequest,
  PortfolioAnalysisResponse,
} from '../features/portfolio/types';

export async function analysePortfolio(
  input: PortfolioAnalysisRequest,
): Promise<PortfolioAnalysisResponse> {
  const body = JSON.stringify(portfolioSchema.parse(input));
  return reportSchema.parse(await request('/portfolio/analyse', { method: 'POST', body }));
}
export async function getLatestReport(
  signal?: AbortSignal,
): Promise<PortfolioAnalysisResponse | null> {
  return reportSchema.nullable().parse(await request('/portfolio/latest', { signal }));
}
