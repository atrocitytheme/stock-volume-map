import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Financial Disclaimer | AeroTrade',
  description: 'Important financial disclaimers, terms of use, and risk warnings for AeroTrade users. Market data accuracy, no investment recommendations, and risk of loss.',
};

export default function DisclaimerPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
      {/* Header */}
      <header style={{ 
        padding: '16px 24px', 
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-surface-glass)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, var(--color-accent), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.5px' }}>
            Aero<span style={{ color: 'var(--text-muted)' }}>Trade</span>
          </span>
        </div>
        <Link href="/" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none' }}>
          Back to Dashboard
        </Link>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Warning Banner */}
          <div style={{ 
            backgroundColor: 'rgba(245, 158, 11, 0.1)', 
            borderLeft: '4px solid #f59e0b',
            padding: '16px 20px',
            borderRadius: '0 8px 8px 0',
            marginBottom: '32px',
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-start'
          }}>
            <svg style={{ minWidth: '24px', color: '#f59e0b', marginTop: '2px' }} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: '#b45309', fontSize: '16px', fontWeight: 700 }}>IMPORTANT RISK WARNING</h3>
              <p style={{ margin: 0, color: '#92400e', fontSize: '14px', lineHeight: 1.6 }}>
                Trading and investing in financial markets involves a high degree of risk, including the risk of losing some or all of your initial investment. The content provided on AeroTrade is for informational and educational purposes only and does not constitute financial, investment, legal, or tax advice. You should carefully consider your financial situation and consult with a licensed professional before making any investment decisions.
              </p>
            </div>
          </div>

          <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '24px', letterSpacing: '-1px' }}>Financial Disclaimer</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.7, marginBottom: '32px' }}>
            Last Updated: August 13, 2026
          </p>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>1. General Disclaimer: No Financial Advice</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '12px' }}>
              AeroTrade ("we," "us," or "our") operates this website and provides market macro indexes tracking, risk appetite dashboards, and related informational services (collectively, the "Services"). By accessing or using our Services, you acknowledge and agree that <strong>we are not registered investment advisors, broker-dealers, financial analysts, financial banks, securities brokers, or financial planners.</strong>
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '12px' }}>
              All information, content, tools, indicators, data, and materials presented on AeroTrade are provided strictly for informational, educational, and entertainment purposes. None of the content published on our platform constitutes a recommendation, endorsement, solicitation, or offer by AeroTrade or any third-party service provider to buy, sell, or hold any security, cryptocurrency, financial product, or instrument.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '12px' }}>
              You should not construe any such data or information as investment, financial, tax, legal, or other forms of advice. Every investment decision you make is your own responsibility. You alone assume the sole responsibility of evaluating the merits and risks associated with the use of any information or other content on AeroTrade before making any decisions based on such information or other content.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>2. Market Data Accuracy and Delays</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '12px' }}>
              The financial data, charts, statistics, and indicators displayed on AeroTrade are sourced from various third-party data providers, including but not limited to the Finnhub API, Alpha Vantage, and other public market data feeds. While we strive to present accurate and timely information, we do not verify this data and we disclaim any obligation to do so.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '12px' }}>
              Market data is subject to inherent delays, errors, interruptions, and inaccuracies. Quotes, volume metrics, price movements, and macroeconomic indicators may be delayed by 15 minutes or more, or may be calculated based on end-of-day or delayed tick data depending on the specific asset class and exchange rules. 
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '12px' }}>
              AeroTrade and its third-party data providers make no representations or warranties, express or implied, regarding the accuracy, completeness, timeliness, reliability, or suitability of the information provided. You agree that AeroTrade shall not be held liable for any decisions you make based on this data, nor for any losses, damages, or missed opportunities resulting from data delays, omissions, or inaccuracies.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>3. Calculated Indexes and Custom Methodologies</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '12px' }}>
              AeroTrade features proprietary and customized calculations, including but not limited to the Risk Appetite Index, TACO (Tactical Asset Class Oscillator), CAPE equivalents, sector heatmaps, and aggregate macroeconomic metrics. 
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '12px' }}>
              <strong>These calculated indexes are derived indicators based on publicly available methodologies and theoretical frameworks. They are NOT proprietary trading signals.</strong> They are mathematical visualizations of historical and current market data designed to summarize broad market sentiment and momentum.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '12px' }}>
              The formulas used to generate these indexes may contain flaws, assumptions, or oversimplifications that do not accurately reflect real-world market dynamics. A "High Risk Appetite" reading does not mean it is safe to invest, just as a "Low Risk Appetite" reading does not mean a market crash is imminent. These tools should be used merely as starting points for your own independent research and analysis, not as definitive triggers for executing trades.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>4. Past Performance and Future Results</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '12px' }}>
              A core principle of investing that applies universally to all content on AeroTrade is: <strong>Past performance is not indicative of future results.</strong> 
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '12px' }}>
              Any historical data, back-tested results, or historical trends shown on our charts are for illustrative purposes only. The financial markets are complex, unpredictable, and influenced by a myriad of economic, political, and social factors that cannot be fully captured by historical models or current indicators. Do not assume that any indicator that successfully predicted a market movement in the past will do so again in the future.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>5. User Responsibility and Due Diligence</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '12px' }}>
              By using AeroTrade, you acknowledge that you are a self-directed investor who assumes full responsibility for all of your investment decisions. We strongly encourage all users to:
            </p>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '12px', paddingLeft: '24px' }}>
              <li style={{ marginBottom: '8px' }}>Conduct their own comprehensive due diligence and fundamental analysis before executing any trades.</li>
              <li style={{ marginBottom: '8px' }}>Verify all data, pricing, and information through independent, authoritative sources (e.g., direct exchange feeds, official company filings, SEC EDGAR database).</li>
              <li style={{ marginBottom: '8px' }}>Consult with a qualified, licensed financial advisor, tax professional, or legal counsel regarding their specific financial circumstances and risk tolerance.</li>
              <li style={{ marginBottom: '8px' }}>Never invest money that they cannot afford to lose entirely.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>6. Limitation of Liability</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '12px' }}>
              To the maximum extent permitted by applicable law, AeroTrade, its founders, affiliates, employees, agents, and data providers shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages, including without limitation, lost profits, capital losses, data loss, or other intangible losses, resulting from:
            </p>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '12px', paddingLeft: '24px' }}>
              <li style={{ marginBottom: '8px' }}>Your access to, use of, or inability to access or use the Services;</li>
              <li style={{ marginBottom: '8px' }}>Any conduct or content of any third party on the Services;</li>
              <li style={{ marginBottom: '8px' }}>Any content, data, or indicators obtained from the Services;</li>
              <li style={{ marginBottom: '8px' }}>Unauthorized access, use, or alteration of your transmissions or content.</li>
            </ul>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '12px' }}>
              This limitation of liability applies whether a claim is based on warranty, contract, tort (including negligence), or any other legal theory, even if we have been informed of the possibility of such damage.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>7. Regulatory Disclaimer</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '12px' }}>
              AeroTrade is a technology and software platform. We are not regulated by the Securities and Exchange Commission (SEC), the Financial Industry Regulatory Authority (FINRA), the Commodity Futures Trading Commission (CFTC), the Financial Conduct Authority (FCA), or any other financial regulatory body in any jurisdiction. No regulatory agency has endorsed, reviewed, or approved the tools, content, or services offered on this platform.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>8. Contact Information</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '12px' }}>
              If you have any questions, concerns, or require further clarification regarding this Financial Disclaimer or our data practices, please contact us at:
            </p>
            <p style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600, marginTop: '16px' }}>
              Email: <a href="mailto:contact@aerotrade.app" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>contact@aerotrade.app</a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ 
        padding: '32px 24px', 
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-surface)',
        marginTop: 'auto'
      }}>
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px' }}>
            <Link href="/" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
            <Link href="/about" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}>About</Link>
            <Link href="/disclaimer" style={{ color: 'var(--text-primary)', fontSize: '14px', textDecoration: 'none', fontWeight: 600 }}>Disclaimer</Link>
            <Link href="/terms" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}>Terms</Link>
            <Link href="/privacy" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}>Privacy</Link>
            <Link href="/contact" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}>Contact</Link>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
            &copy; {new Date().getFullYear()} AeroTrade. All rights reserved. Data provided for informational purposes only.
          </div>
        </div>
      </footer>
    </div>
  );
}
