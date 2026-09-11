import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../api/client';
import { analysePortfolio } from '../../api/portfolio';
import { MAX_POSITIONS, allocationUnits, portfolioSchema } from './schemas';
import type { PortfolioAnalysisResponse, PortfolioPosition, SavedPortfolioPosition } from './types';

interface Props {
  initialPositions: SavedPortfolioPosition[];
  onAnalysed: (positions: PortfolioPosition[], report: PortfolioAnalysisResponse) => void;
}
export function PortfolioInput({ initialPositions, onAnalysed }: Props) {
  const [rows, setRows] = useState(() =>
    (initialPositions.length
      ? initialPositions
      : [{ ticker: '', allocation: '', average_price: '' }]
    ).map((position, id) => ({
      id,
      ticker: position.ticker,
      allocation: String(position.allocation),
      average_price: position.average_price == null ? '' : String(position.average_price),
    })),
  );
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const nextId = useRef(rows.length);
  const form = useRef<HTMLFormElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const parsed = portfolioSchema.safeParse({
    positions: rows.map(({ ticker, allocation, average_price }) => ({
      ticker,
      allocation: allocation.trim() === '' ? NaN : Number(allocation),
      average_price: average_price.trim() === '' ? NaN : Number(average_price),
    })),
  });
  const total =
    rows.reduce(
      (sum, row) =>
        sum +
        (Number.isFinite(Number(row.allocation)) ? allocationUnits(Number(row.allocation)) : 0),
      0,
    ) / 100;
  const fieldError = (index: number, field: string) =>
    submitted && !parsed.success
      ? parsed.error.issues.find((issue) => issue.path[1] === index && issue.path[2] === field)
          ?.message
      : undefined;
  const totalError =
    submitted && !parsed.success
      ? parsed.error.issues.find((issue) => issue.path.length === 1)?.message
      : undefined;
  function update(id: number, field: 'ticker' | 'allocation' | 'average_price', value: string) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
    setError('');
  }
  function focusTicker(id: number) {
    requestAnimationFrame(() => document.getElementById(`ticker-${id}`)?.focus());
  }
  return (
    <section>
      <h1 tabIndex={-1}>Portfolio input</h1>
      <p className="intro">
        Add your ETFs, their share of the portfolio and your average purchase price. Allocations
        must total 100%.
      </p>
      <form
        ref={form}
        noValidate
        aria-busy={pending}
        onSubmit={async (event) => {
          event.preventDefault();
          if (pending) return;
          setSubmitted(true);
          setError('');
          if (!parsed.success) {
            requestAnimationFrame(() => {
              const invalid = form.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
              (invalid ?? document.getElementById('total-error'))?.focus();
            });
            return;
          }
          setPending(true);
          try {
            const result = await analysePortfolio(parsed.data);
            if (active.current) onAnalysed(parsed.data.positions, result);
          } catch (error) {
            setError(
              error instanceof ApiError && error.status === 401
                ? 'Session expired. Sign out, then sign in again.'
                : 'Unable to save the report. Your inputs are still here. Please try again.',
            );
            setPending(false);
          }
        }}
      >
        <fieldset disabled={pending}>
          <legend className="section-heading">
            Positions{' '}
            <span className="muted">
              {rows.length} / {MAX_POSITIONS}
            </span>
          </legend>
          <div className="positions">
            {rows.map((row, index) => (
              <div className="position-row" key={row.id}>
                <span className="row-number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="field">
                  <label htmlFor={`ticker-${row.id}`}>
                    ETF ticker <span className="sr-only">{index + 1}</span>
                  </label>
                  <input
                    id={`ticker-${row.id}`}
                    value={row.ticker}
                    onChange={(event) => update(row.id, 'ticker', event.target.value)}
                    maxLength={20}
                    placeholder="e.g. QQQ"
                    autoCapitalize="characters"
                    spellCheck={false}
                    aria-invalid={!!fieldError(index, 'ticker')}
                    aria-describedby={
                      fieldError(index, 'ticker') ? `ticker-error-${row.id}` : undefined
                    }
                  />
                  {fieldError(index, 'ticker') && (
                    <p className="error" id={`ticker-error-${row.id}`}>
                      {fieldError(index, 'ticker')}
                    </p>
                  )}
                </div>
                <div className="field">
                  <label htmlFor={`allocation-${row.id}`}>
                    Weight (%) <span className="sr-only">{index + 1}</span>
                  </label>
                  <input
                    id={`allocation-${row.id}`}
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    max="100"
                    step="0.01"
                    value={row.allocation}
                    onChange={(event) => update(row.id, 'allocation', event.target.value)}
                    placeholder="0"
                    aria-invalid={!!fieldError(index, 'allocation')}
                    aria-describedby={
                      fieldError(index, 'allocation') ? `allocation-error-${row.id}` : undefined
                    }
                  />
                  {fieldError(index, 'allocation') && (
                    <p className="error" id={`allocation-error-${row.id}`}>
                      {fieldError(index, 'allocation')}
                    </p>
                  )}
                </div>
                <div className="field">
                  <label htmlFor={`average-price-${row.id}`}>
                    Average price <span className="sr-only">{index + 1}</span>
                  </label>
                  <input
                    id={`average-price-${row.id}`}
                    type="number"
                    inputMode="decimal"
                    min="0.00000001"
                    step="any"
                    value={row.average_price}
                    onChange={(event) => update(row.id, 'average_price', event.target.value)}
                    placeholder="0.00"
                    aria-invalid={!!fieldError(index, 'average_price')}
                    aria-describedby={
                      fieldError(index, 'average_price')
                        ? `average-price-error-${row.id}`
                        : undefined
                    }
                  />
                  {fieldError(index, 'average_price') && (
                    <p className="error" id={`average-price-error-${row.id}`}>
                      {fieldError(index, 'average_price')}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="quiet remove"
                  aria-label={`Remove position ${index + 1}`}
                  disabled={rows.length === 1}
                  onClick={() => {
                    const remaining = rows.filter((item) => item.id !== row.id);
                    setRows(remaining);
                    setError('');
                    focusTicker(remaining[Math.min(index, remaining.length - 1)].id);
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="add-position"
            disabled={rows.length >= MAX_POSITIONS}
            onClick={() => {
              const id = nextId.current++;
              setRows([...rows, { id, ticker: '', allocation: '', average_price: '' }]);
              setError('');
              focusTicker(id);
            }}
          >
            + Add position
          </button>
          <p className="small muted">
            Up to {MAX_POSITIONS} unique ETFs. Weight means current portfolio allocation; average
            price should use the ETF listing currency.
          </p>
          <div className="allocation-summary" aria-live="polite">
            <span>Total allocation</span>
            <strong className={total === 100 ? 'complete' : ''}>
              {total.toLocaleString('en', { maximumFractionDigits: 2 })}%{' '}
              <span className="muted">/ 100%</span>
            </strong>
          </div>
          {totalError && (
            <p id="total-error" tabIndex={-1} role="alert" className="error">
              {totalError}
            </p>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="form-actions">
            <span className="small muted">Reports are saved to your account.</span>
            <button className="primary">{pending ? 'Analysing…' : 'Analyse portfolio'}</button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
