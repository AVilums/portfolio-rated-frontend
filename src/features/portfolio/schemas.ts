import { z } from 'zod';

export const MAX_POSITIONS = 20;
export const allocationUnits = (allocation: number) => Math.round(allocation * 100);
export const portfolioSchema = z
  .object({
    positions: z
      .array(
        z.object({
          ticker: z
            .string()
            .trim()
            .toUpperCase()
            .regex(
              /^[A-Z0-9][A-Z0-9.:-]{0,19}$/,
              'Enter an asset symbol (1–20 letters, numbers, dots, colons or hyphens).',
            ),
          allocation: z
            .number({ error: 'Enter a valid allocation.' })
            .gt(0, 'Allocation must be greater than 0%.')
            .max(100, 'Allocation cannot exceed 100%.')
            .refine(
              (value) => Math.abs(value * 100 - allocationUnits(value)) < 1e-8,
              'Use at most 2 decimal places.',
            ),
          average_price: z
            .number({ error: 'Enter a valid average price.' })
            .positive('Average price must be greater than zero.')
            .finite('Enter a valid average price.')
            .max(1_000_000_000, 'Average price is too large.')
            .refine(
              (value) => Math.abs(value * 100_000_000 - Math.round(value * 100_000_000)) < 1e-4,
              'Use at most 8 decimal places.',
            ),
        }),
      )
      .min(1, 'Add at least one position.')
      .max(MAX_POSITIONS, `Use at most ${MAX_POSITIONS} positions.`),
  })
  .superRefine(({ positions }, ctx) => {
    if (
      positions.reduce((sum, position) => sum + allocationUnits(position.allocation), 0) !== 10000
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['positions'],
        message: 'Allocations must total exactly 100% before analysis.',
      });
    }
    const seen = new Set<string>();
    positions.forEach((position, index) => {
      if (seen.has(position.ticker))
        ctx.addIssue({
          code: 'custom',
          path: ['positions', index, 'ticker'],
          message: 'This asset is already included. Combine its allocations.',
        });
      seen.add(position.ticker);
    });
  });

const savedPositionSchema = portfolioSchema.shape.positions.element.extend({
  average_price: z.number().positive().nullable(),
});

export const reportSchema = z.object({
  id: z.uuid(),
  created_at: z.iso.datetime({ offset: true }),
  positions: z.array(savedPositionSchema).min(1).max(MAX_POSITIONS),
  analysis: z.object({
    method: z.enum(['allocation-v1', 'etf-v1']),
    concentration: z.number().min(0).max(100),
    effective_positions: z.number().min(1).max(MAX_POSITIONS),
    largest_allocation: z.number().positive().max(100),
    position_count: z.number().int().min(1).max(MAX_POSITIONS),
    observations: z.array(z.string()),
    data_coverage: z.number().min(0).max(100),
    etfs: z.array(
      z.object({
        ticker: z.string(),
        status: z.enum(['available', 'stale', 'unavailable']),
        message: z.string(),
        snapshot_id: z.uuid().nullable(),
        source: z.string().nullable(),
        as_of: z.iso.datetime({ offset: true }).nullable(),
        currency: z.string().nullable(),
        current_price: z.number().positive().nullable(),
        price_change: z.number().nullable(),
        expense_ratio: z.number().min(0).max(100).nullable(),
        holdings_coverage: z.number().min(0).max(100).nullable(),
        top_holdings: z.array(
          z.object({
            name: z.string(),
            fund_weight: z.number().min(0).max(100),
            portfolio_exposure: z.number().min(0).max(100),
          }),
        ),
      }),
    ),
    underlying_exposure: z.array(
      z.object({
        name: z.string(),
        portfolio_exposure: z.number().min(0).max(100),
      }),
    ),
  }),
});
