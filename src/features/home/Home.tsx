interface HomeProps {
  onLogin: () => void;
  onSignUp: () => void;
}

export function Home({ onLogin, onSignUp }: HomeProps) {
  return (
    <section className="home-page">
      <div className="home-hero">
        <p className="eyebrow">Portfolio clarity, in minutes</p>
        <h1 tabIndex={-1}>See how concentrated your portfolio really is.</h1>
        <p className="home-intro">
          Add ETF tickers, portfolio weights and average prices. See allocation, price and
          underlying-holdings data in one saved report.
        </p>
        <div className="home-actions">
          <button className="primary" onClick={onSignUp}>
            Rate my portfolio
          </button>
          <button onClick={onLogin}>Log in</button>
        </div>
      </div>
      <div className="home-points" aria-label="How it works">
        <article>
          <span>01</span>
          <h2>Add your assets</h2>
          <p>Enter each ETF, its current portfolio weight and your average purchase price.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Review ETF data</h2>
          <p>See concentration, price changes, fees and available underlying holdings.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Refine over time</h2>
          <p>Return to your saved report and update it whenever you need.</p>
        </article>
      </div>
    </section>
  );
}
