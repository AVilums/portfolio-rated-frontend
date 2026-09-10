import type { PortfolioAnalysisResponse } from '../src/features/portfolio/types';
export const user = { id: '11111111-1111-4111-8111-111111111111', email: 'demo@example.com' };
export const report: PortfolioAnalysisResponse = {
  id: '22222222-2222-4222-8222-222222222222',
  created_at: '2026-09-10T12:00:00Z',
  positions: [
    { ticker: 'AVWC', allocation: 60 },
    { ticker: 'AVWS', allocation: 40 },
  ],
  analysis: {
    method: 'allocation-v1',
    concentration: 52,
    effective_positions: 1.92,
    largest_allocation: 60,
    position_count: 2,
    observations: ['AVWC is the largest position at 60%.'],
  },
};
