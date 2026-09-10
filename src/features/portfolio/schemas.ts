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

export const reportSchema = z.object({
  id: z.uuid(),
  created_at: z.iso.datetime({ offset: true }),
  positions: portfolioSchema.shape.positions,
  analysis: z.object({
    method: z.literal('allocation-v1'),
    concentration: z.number().min(0).max(100),
    effective_positions: z.number().min(1).max(MAX_POSITIONS),
    largest_allocation: z.number().positive().max(100),
    position_count: z.number().int().min(1).max(MAX_POSITIONS),
    observations: z.array(z.string()),
  }),
});
