import type { PortfolioAnalysisResponse } from './types';

const number = (value: number, digits = 2) =>
  value.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: digits });

export function PortfolioReport({
  report,
  onEdit,
}: {
  report: PortfolioAnalysisResponse;
  onEdit: () => void;
}) {
  const { analysis, positions } = report;
  return (
    <section>
      <div className="page-heading">
        <h1 tabIndex={-1}>Portfolio report</h1>
        <button onClick={onEdit}>Edit portfolio</button>
      </div>
      <p className="intro">Saved {new Date(report.created_at).toLocaleString()}</p>
      <div className="report-overview">
        <div className="rating">
          <h2>Concentration</h2>
          <p>
            <strong>{analysis.concentration}</strong>
            <span> / 100</span>
          </p>
          <span className="small muted">Lower means more evenly spread.</span>
        </div>
        <dl className="metrics">
          <div>
            <dt>Positions</dt>
            <dd>{analysis.position_count}</dd>
          </div>
          <div>
            <dt>Largest allocation</dt>
            <dd>{analysis.largest_allocation}%</dd>
          </div>
          <div>
            <dt>Effective positions</dt>
            <dd>{analysis.effective_positions}</dd>
          </div>
          <div>
            <dt>ETF data coverage</dt>
            <dd>{number(analysis.data_coverage)}%</dd>
          </div>
        </dl>
      </div>
      <section className="report-section">
        <h2>Observations</h2>
        <ul className="observations">
          {analysis.observations.map((observation) => (
            <li key={observation}>{observation}</li>
          ))}
        </ul>
      </section>
      <section className="report-section">
        <h2>Allocation</h2>
        <table>
          <caption className="sr-only">Assets and allocations used for this report</caption>
          <thead>
            <tr>
              <th scope="col">ETF</th>
              <th scope="col">Weight</th>
              <th scope="col">Average price</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <tr key={position.ticker}>
                <th scope="row">{position.ticker}</th>
                <td>{position.allocation}%</td>
                <td>
                  {position.average_price == null
                    ? 'Not recorded'
                    : number(position.average_price, 8)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              <td>100%</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </section>
      <section className="report-section">
        <h2>ETF data</h2>
        <p className="small muted">
          Market data is captured with this report. Price change compares the latest closing price
          with your average price; it excludes distributions, fees and taxes.
        </p>
        <div className="etf-results">
          {analysis.etfs.map((etf) => (
            <article className="etf-card" key={etf.ticker}>
              <div className="etf-heading">
                <h3>{etf.ticker}</h3>
                <span className={`data-status ${etf.status}`}>{etf.status}</span>
              </div>
              {etf.current_price == null ? (
                <p className="small muted">{etf.message}</p>
              ) : (
                <>
                  <dl className="etf-metrics">
                    <div>
                      <dt>Latest close</dt>
                      <dd>
                        {etf.currency && etf.currency !== 'XXX' ? `${etf.currency} ` : ''}
                        {number(etf.current_price, 8)}
                      </dd>
                    </div>
                    <div>
                      <dt>Since average price</dt>
                      <dd
                        className={
                          etf.price_change != null && etf.price_change < 0 ? 'negative' : ''
                        }
                      >
                        {etf.price_change == null
                          ? 'Unavailable'
                          : `${etf.price_change > 0 ? '+' : ''}${number(etf.price_change)}%`}
                      </dd>
                    </div>
                    <div>
                      <dt>Expense ratio</dt>
                      <dd>
                        {etf.expense_ratio == null
                          ? 'Unavailable'
                          : `${number(etf.expense_ratio)}%`}
                      </dd>
                    </div>
                    <div>
                      <dt>Holdings covered</dt>
                      <dd>
                        {etf.holdings_coverage == null
                          ? 'Unavailable'
                          : `${number(etf.holdings_coverage)}%`}
                      </dd>
                    </div>
                  </dl>
                  <p className="data-note">
                    {etf.message}
                    {etf.as_of ? ` Observed ${new Date(etf.as_of).toLocaleString()}.` : ''}
                  </p>
                  {etf.top_holdings.length > 0 && (
                    <details>
                      <summary>Top holdings available ({etf.top_holdings.length})</summary>
                      <table>
                        <thead>
                          <tr>
                            <th scope="col">Holding</th>
                            <th scope="col">Fund weight</th>
                            <th scope="col">Portfolio exposure</th>
                          </tr>
                        </thead>
                        <tbody>
                          {etf.top_holdings.map((holding, index) => (
                            <tr key={`${etf.ticker}-${holding.name}-${index}`}>
                              <th scope="row">{holding.name}</th>
                              <td>{number(holding.fund_weight)}%</td>
                              <td>{number(holding.portfolio_exposure)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </details>
                  )}
                </>
              )}
            </article>
          ))}
        </div>
      </section>
      {analysis.underlying_exposure.length > 0 && (
        <section className="report-section">
          <h2>Largest underlying exposures</h2>
          <table>
            <thead>
              <tr>
                <th scope="col">Holding</th>
                <th scope="col">Portfolio exposure</th>
              </tr>
            </thead>
            <tbody>
              {analysis.underlying_exposure.map((holding, index) => (
                <tr key={`${holding.name}-${index}`}>
                  <th scope="row">{holding.name}</th>
                  <td>{number(holding.portfolio_exposure)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      <details className="methodology">
        <summary>How this is calculated</summary>
        <p>
          Concentration is the sum of squared allocation weights, multiplied by 100. Effective
          positions is the reciprocal of that sum.
        </p>
        <p>
          Underlying exposure multiplies each ETF's entered weight by its reported constituent
          weight. Missing holdings remain outside the calculated coverage. This is descriptive
          analysis, not investment advice or a total-return calculation.
        </p>
      </details>
    </section>
  );
}
