import type { PortfolioAnalysisResponse } from './types';

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
              <th scope="col">Asset</th>
              <th scope="col">Allocation</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <tr key={position.ticker}>
                <th scope="row">{position.ticker}</th>
                <td>{position.allocation}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              <td>100%</td>
            </tr>
          </tfoot>
        </table>
      </section>
      <details className="methodology">
        <summary>How this is calculated</summary>
        <p>
          Concentration is the sum of squared allocation weights, multiplied by 100. Effective
          positions is the reciprocal of that sum.
        </p>
        <p>
          Based on entered allocations only. Fund overlap, geography and market risk are not
          assessed.
        </p>
      </details>
    </section>
  );
}
