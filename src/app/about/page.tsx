import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | AeroTrade",
  description: "Learn about AeroTrade, the mission, data tracked, and macro indexes explained.",
};

export default function AboutPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <header style={{ 
        padding: '16px 24px', 
        borderBottom: '1px solid var(--border-color)', 
        backgroundColor: 'var(--bg-surface-glass)',
        backdropFilter: 'var(--glass-blur)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <Link href="/" style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', textDecoration: 'none' }}>
          AeroTrade
        </Link>
        <nav style={{ display: 'flex', gap: '16px' }}>
          <Link href="/about" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>About</Link>
          <Link href="/contact" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Contact</Link>
        </nav>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px 24px', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '16px', fontWeight: 800 }}>About AeroTrade</h1>
        
        <section className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--text-primary)' }}>What is AeroTrade?</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
            AeroTrade is a state-of-the-art real-time market macro indexes tracker and risk appetite dashboard. 
            In today's interconnected financial ecosystem, understanding the broader macroeconomic environment is critical for navigating volatile markets. 
            AeroTrade aggregates and analyzes vast amounts of financial data to provide users with a clear, concise, and actionable view of global market conditions.
            Whether you are tracking sector rotations, monitoring global exchange volumes, or gauging the market's underlying risk appetite, AeroTrade offers the insights you need to stay ahead of the curve.
            Our platform is designed to distill complex macroeconomic indicators into intuitive visual representations, enabling you to make informed decisions with confidence.
          </p>
        </section>

        <section className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--text-primary)' }}>Our Mission</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
            Our mission is simple yet ambitious: making institutional-grade macro market data accessible to everyone.
            For decades, high-level macroeconomic indicators and proprietary risk models have been locked behind the walled gardens of elite financial institutions and costly terminal subscriptions.
            We believe that every trader, investor, and financial enthusiast deserves access to the same quality of data and analytical tools.
            By democratizing access to these powerful insights, we aim to level the playing field, empowering our users to analyze market trends, assess risk, and identify opportunities with the same rigor as Wall Street professionals.
            AeroTrade is built on the principles of transparency, accessibility, and precision.
          </p>
        </section>

        <section className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--text-primary)' }}>What Data We Track</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
            AeroTrade monitors a comprehensive suite of global market indicators to provide a holistic view of the financial landscape.
            Our tracking includes major global indices such as the S&P 500, NASDAQ 100, DOW JONES Industrial Average, FTSE 100, and NIKKEI 225.
            Beyond broad market averages, we dive deep into sector performance with interactive sector heatmaps that highlight capital flows and rotational trends across industries.
            We also track global exchange volume, providing a geographic perspective on where trading activity is concentrated.
            This multi-faceted approach ensures that our users can see both the forest and the trees, understanding overarching global trends while keeping a pulse on specific market segments.
          </p>
        </section>

        <section className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--text-primary)' }}>The Macro Indexes Explained</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
            At the core of AeroTrade are our specialized macro indexes, carefully constructed to distill complex market dynamics into clear signals:
          </p>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li><strong>Risk Appetite Index:</strong> Based on the renowned Goldman Sachs methodology, this index measures the market's willingness to take on risk. It aggregates various cross-asset indicators to gauge whether investors are in a risk-on or risk-off regime.</li>
            <li><strong>TACO Index (Treasury-Adjusted Credit Overlay):</strong> This proprietary indicator evaluates credit spreads relative to Treasury yields, offering deep insights into corporate credit health and systemic financial stress.</li>
            <li><strong>Real Yield Tracker:</strong> By stripping out inflation expectations from nominal yields, this tracker reveals the true cost of capital and its profound impact on asset valuations, particularly in growth equities and precious metals.</li>
            <li><strong>CAPE Ratio (Cyclically Adjusted Price-to-Earnings):</strong> We track this classic valuation metric to provide a long-term perspective on market expensiveness, smoothing out short-term earnings volatility.</li>
            <li><strong>Market Leverage Indicators:</strong> These metrics monitor margin debt and options positioning to assess the level of speculative leverage embedded in the market.</li>
            <li><strong>IAK Recommendation Index:</strong> A synthesized directional indicator that combines multiple macro inputs to provide a streamlined market stance recommendation.</li>
          </ul>
        </section>

        <section className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--text-primary)' }}>How the Dashboard Works</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
            AeroTrade is engineered for speed and clarity. Our dashboard leverages real-time data feeds powered by the Finnhub API, ensuring that the insights you see reflect the market's current state up to the millisecond.
            The user interface features interactive treemaps that allow you to visually explore market capitalization and sector performance at a glance.
            Our global exchange maps provide a spatial understanding of trading volumes, illustrating how liquidity shifts across different time zones and markets throughout the trading day.
            The dashboard is highly customizable, enabling users to focus on the specific metrics and geographic regions that matter most to their investment strategy.
            All of this is presented in a sleek, dark-themed interface designed to minimize eye strain during long trading sessions.
          </p>
        </section>

        <section className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--text-primary)' }}>Who It's For</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
            AeroTrade is built for anyone who needs to understand the "why" behind the market's movements. 
            Active day traders use our real-time heatmaps and risk appetite gauges to time their entries and exits.
            Long-term investors rely on our CAPE ratio and Real Yield trackers to optimize their portfolio allocations and manage macroeconomic risks.
            Financial analysts leverage our comprehensive data aggregation to quickly compile research and generate market commentary.
            Macro enthusiasts and students of economics find AeroTrade to be an invaluable educational tool, bridging the gap between economic theory and real-world market action.
            Whether you are managing millions of dollars or simply managing your own retirement account, AeroTrade provides the professional-grade perspective you need.
          </p>
        </section>

        <section className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--text-primary)' }}>Technology Used</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
            Under the hood, AeroTrade is powered by a modern, high-performance tech stack. 
            The application is built on Next.js, utilizing server-side rendering and static generation to ensure blazing fast load times and optimal search engine visibility.
            We rely on real-time market data feeds from top-tier providers, seamlessly integrated via robust APIs.
            The frontend leverages advanced CSS architectures and React-based charting libraries to deliver smooth, responsive data visualizations that perform flawlessly across desktop and mobile devices.
            Our commitment to technical excellence ensures that AeroTrade remains reliable, scalable, and continuously evolving to meet the demands of modern financial analysis.
          </p>
        </section>

      </main>

      {/* Footer */}
      <footer style={{ 
        padding: '32px 24px', 
        borderTop: '1px solid var(--border-color)', 
        backgroundColor: 'var(--bg-surface)',
        marginTop: 'auto'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>&copy; {new Date().getFullYear()} AeroTrade. All rights reserved.</p>
          <nav style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px' }}>Home</Link>
            <Link href="/about" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px' }}>About</Link>
            <Link href="/contact" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px' }}>Contact</Link>
            <Link href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px' }}>Privacy</Link>
            <Link href="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px' }}>Terms</Link>
            <Link href="/disclaimer" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px' }}>Disclaimer</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
