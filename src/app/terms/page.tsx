import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | AeroTrade",
  description: "Terms of Service for AeroTrade - read our conditions and financial data disclaimer.",
};

export default function TermsOfService() {
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
          <h1 style={{ fontSize: "2rem", marginBottom: "8px", fontWeight: "bold", letterSpacing: "-0.025em" }}>Terms of Service</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "32px", fontSize: "0.875rem" }}>Last Updated: August 13, 2026</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
            
            <section>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "12px", fontWeight: "600" }}>1. Acceptance of Terms</h2>
              <p>By accessing and using AeroTrade ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using this Service, you shall be subject to any posted guidelines or rules applicable to such services.</p>
              <p style={{ marginTop: "12px" }}>ANY PARTICIPATION IN THIS SERVICE WILL CONSTITUTE ACCEPTANCE OF THIS AGREEMENT. IF YOU DO NOT AGREE TO ABIDE BY THE ABOVE, PLEASE DO NOT USE THIS SERVICE.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "12px", fontWeight: "600" }}>2. Description of Service</h2>
              <p>AeroTrade is an informational platform providing a real-time market macro indexes tracker and risk appetite dashboard. We aggregate, visualize, and present financial data, sector heatmaps, and macro indicators to help users monitor global exchange activities and overall market sentiment.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "12px", fontWeight: "600" }}>3. Financial Data Disclaimer</h2>
              <p style={{ fontWeight: "600", color: "var(--color-loss-bright)" }}>NOT FINANCIAL ADVICE</p>
              <p style={{ marginTop: "8px" }}>The information provided on AeroTrade is for educational and informational purposes only and does not constitute financial, investment, or trading advice. You should not make any financial, investment, trading or other decisions based on any of the information presented on this platform without undertaking independent due diligence and consultation with a professional broker or competent financial advisor.</p>
              <p style={{ marginTop: "12px" }}>We do not guarantee the accuracy, completeness, or timeliness of the financial data presented. Trading in financial markets involves a high degree of risk, and you could lose some or all of your initial investment.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "12px", fontWeight: "600" }}>4. Intellectual Property</h2>
              <p>The Service and its original content, features, design system, and functionality are owned by AeroTrade and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.</p>
              <p style={{ marginTop: "12px" }}>You may not modify, reproduce, distribute, create derivative works or adaptations of, publicly display or in any way exploit any of the content, software, or materials available on the Service in whole or in part except as expressly authorized by us.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "12px", fontWeight: "600" }}>5. User Responsibilities</h2>
              <p>As a user of the Service, you agree not to:</p>
              <ul style={{ paddingLeft: "24px", marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>Use the Service in any way that violates any applicable national or international law or regulation.</li>
                <li>Attempt to interfere with or disrupt the operation of the Service or the servers/networks connected to the Service.</li>
                <li>Engage in unauthorized scraping, data extraction, or harvesting of financial data from the platform.</li>
                <li>Use the platform to distribute malicious software, spam, or engage in any harmful digital activities.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "12px", fontWeight: "600" }}>6. Third-Party Links and Data Sources</h2>
              <p>Our Service may contain links to third-party web sites or services that are not owned or controlled by AeroTrade. We also source our market data from third-party APIs.</p>
              <p style={{ marginTop: "12px" }}>AeroTrade has no control over, and assumes no responsibility for, the content, privacy policies, data accuracy, or practices of any third party web sites, APIs, or services. You further acknowledge and agree that AeroTrade shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, goods or services available on or through any such web sites or services.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "12px", fontWeight: "600" }}>7. Limitation of Liability</h2>
              <p>In no event shall AeroTrade, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:</p>
              <ul style={{ paddingLeft: "24px", marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>Your access to or use of or inability to access or use the Service;</li>
                <li>Any conduct or content of any third party on the Service;</li>
                <li>Any content obtained from the Service; and</li>
                <li>Unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "12px", fontWeight: "600" }}>8. Modifications to Terms</h2>
              <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
              <p style={{ marginTop: "12px" }}>By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Service.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "12px", fontWeight: "600" }}>9. Governing Law</h2>
              <p>These Terms shall be governed and construed in accordance with the laws of the applicable jurisdiction, without regard to its conflict of law provisions.</p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "12px", fontWeight: "600" }}>10. Contact Information</h2>
              <p>If you have any questions about these Terms, please contact us at:</p>
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
