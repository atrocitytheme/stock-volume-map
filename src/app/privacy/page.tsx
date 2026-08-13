import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | AeroTrade",
  description: "Privacy policy for AeroTrade - learn how we collect, use, and protect your data.",
};

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Simple Header */}
      <header className="glass-panel" style={{ padding: "16px 24px", margin: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ textDecoration: "none", color: "var(--text-primary)", fontWeight: "bold", fontSize: "1.25rem", letterSpacing: "-0.025em" }}>
          AeroTrade
        </Link>
        <nav>
          <Link href="/" style={{ textDecoration: "none", color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500 }}>
            Back to Dashboard
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "32px 16px", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
        <div className="glass-panel" style={{ padding: "40px", borderRadius: "16px" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "8px", fontWeight: "bold", letterSpacing: "-0.025em" }}>Privacy Policy</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "32px", fontSize: "0.875rem" }}>Last Updated: August 13, 2026</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
            
            <section>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "12px", fontWeight: "600" }}>1. Introduction</h2>
              <p>Welcome to AeroTrade ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy applies to all information collected through our website (aerotrade.app), as well as any related services, sales, marketing, or events (collectively referred to as the "Services").</p>
              <p style={{ marginTop: "12px" }}>By using AeroTrade, you agree to the collection and use of information in accordance with this policy. If there are any terms in this privacy policy that you do not agree with, please discontinue use of our Services immediately.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "12px", fontWeight: "600" }}>2. Information We Collect</h2>
              <p>We collect personal information that you voluntarily provide to us when you express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.</p>
              <ul style={{ paddingLeft: "24px", marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><strong>Usage Data:</strong> We may collect data regarding how you access and interact with our Services. This usage data may include information such as your device's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Services that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers and other diagnostic data.</li>
                <li><strong>Cookies and Tracking Technologies:</strong> We use cookies and similar tracking technologies to track the activity on our Services and hold certain information.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "12px", fontWeight: "600" }}>3. Google AdSense & Advertising Cookies</h2>
              <p>We use Google AdSense to display advertisements on our Services. Google uses cookies to serve ads based on a user's prior visits to AeroTrade or other websites.</p>
              <ul style={{ paddingLeft: "24px", marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our site and/or other sites on the Internet.</li>
                <li>Users may opt out of personalized advertising by visiting <a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)" }}>Google Ads Settings</a>.</li>
                <li>Alternatively, you can opt out of a third-party vendor's use of cookies for personalized advertising by visiting <a href="https://youradchoices.com/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)" }}>www.aboutads.info</a>.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "12px", fontWeight: "600" }}>4. Analytics and Third-Party Services</h2>
              <p>We may use third-party Service Providers to monitor and analyze the use of our Services.</p>
              <ul style={{ paddingLeft: "24px", marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><strong>Google Analytics / Vercel Analytics:</strong> We use analytics services to track website traffic and user engagement. These tools collect information such as how often users visit our site, what pages they visit, and what other sites they used prior to coming to our site.</li>
                <li><strong>Financial Data Providers:</strong> We utilize third-party APIs (such as Finnhub) to provide real-time market data. While we do not share personal identifying information with these providers, your interactions with the data visualization components may trigger anonymous requests to these services.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "12px", fontWeight: "600" }}>5. Cookie Policy and Management</h2>
              <p>Cookies are files with a small amount of data which may include an anonymous unique identifier. Cookies are sent to your browser from a website and stored on your device.</p>
              <p style={{ marginTop: "12px" }}>You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Services.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "12px", fontWeight: "600" }}>6. Data Retention</h2>
              <p>We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy policy, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements).</p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "12px", fontWeight: "600" }}>7. Your Privacy Rights (GDPR & CCPA)</h2>
              <p>Depending on your location, you may have certain rights regarding your personal information:</p>
              <ul style={{ paddingLeft: "24px", marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>The right to access, update, or delete the information we have on you.</li>
                <li>The right of rectification (to fix incorrect or incomplete data).</li>
                <li>The right to object to or restrict processing of your personal data.</li>
                <li>The right to data portability.</li>
                <li>The right to withdraw consent at any time.</li>
              </ul>
              <p style={{ marginTop: "12px" }}>To exercise these rights, please contact us using the information provided below.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "12px", fontWeight: "600" }}>8. Children's Privacy</h2>
              <p>Our Services do not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13. If you are a parent or guardian and you are aware that your child has provided us with personal data, please contact us. If we become aware that we have collected personal data from anyone under the age of 13 without verification of parental consent, we take steps to remove that information from our servers.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "12px", fontWeight: "600" }}>9. Contact Information</h2>
              <p>If you have any questions or comments about this policy, you may email us at:</p>
              <p style={{ marginTop: "8px", fontWeight: "bold", color: "var(--text-primary)" }}>contact@aerotrade.app</p>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ marginTop: "auto", borderTop: "1px solid var(--border-color)", padding: "32px 16px", textAlign: "center" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "24px", marginBottom: "16px" }}>
          <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.875rem" }}>Home</Link>
          <Link href="/privacy" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.875rem" }}>Privacy Policy</Link>
          <Link href="/terms" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.875rem" }}>Terms of Service</Link>
          <Link href="/about" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.875rem" }}>About</Link>
          <Link href="/contact" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.875rem" }}>Contact</Link>
          <Link href="/disclaimer" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.875rem" }}>Disclaimer</Link>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
          &copy; {new Date().getFullYear()} AeroTrade. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
