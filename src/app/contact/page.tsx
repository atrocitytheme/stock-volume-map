import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact | AeroTrade",
  description: "Get in touch with the AeroTrade team for inquiries, bug reports, and feedback.",
};

export default function ContactPage() {
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
        <h1 style={{ fontSize: '36px', marginBottom: '16px', fontWeight: 800 }}>Contact Us</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginBottom: '40px', lineHeight: 1.6 }}>
          Have questions, feedback, or need support with the AeroTrade dashboard? We are here to help. Reach out to our team below.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '48px' }}>
          
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--text-primary)' }}>Email Contact</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
              For all general inquiries, partnership opportunities, or direct support, please email us at:
            </p>
            <a href="mailto:jcx36283@proton.me" style={{ 
              display: 'inline-block', 
              padding: '12px 24px', 
              backgroundColor: 'var(--color-accent)', 
              color: '#fff', 
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '15px'
            }}>
              jcx36283@proton.me
            </a>
          </div>

          <div className="glass-panel" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--text-primary)' }}>General Inquiries</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Whether you want to learn more about our methodology for calculating the Risk Appetite Index or have questions about how to interpret our TACO index, our research team is always happy to discuss macroeconomics. We aim to respond to all general inquiries within 24-48 business hours.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--text-primary)' }}>Bug Reports & Feedback</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Encountered a glitch in our heatmaps or have a feature request? We value your input heavily as we continuously refine the AeroTrade platform. When reporting bugs, please include your browser version and the specific time you noticed the data anomaly. We prioritize bug fixes based on severity and impact on the data integrity.
            </p>
          </div>
        </div>

        <section className="glass-panel" style={{ padding: '32px', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '24px', color: 'var(--text-primary)' }}>Send us a Message</h2>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} action="mailto:jcx36283@proton.me" method="POST" encType="text/plain">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="name" style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>Name</label>
              <input type="text" id="name" name="name" required style={{ 
                padding: '12px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color)', 
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="email" style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>Email Address</label>
              <input type="email" id="email" name="email" required style={{ 
                padding: '12px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color)', 
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="subject" style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>Subject</label>
              <select id="subject" name="subject" style={{ 
                padding: '12px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color)', 
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}>
                <option value="General Inquiry">General Inquiry</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Data Question">Data Question</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="message" style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>Message</label>
              <textarea id="message" name="message" rows={5} required style={{ 
                padding: '12px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color)', 
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'vertical'
              }}></textarea>
            </div>

            <button type="submit" style={{
              marginTop: '8px',
              padding: '14px',
              backgroundColor: 'var(--color-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}>
              Send Message
            </button>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
              Note: We typically respond within 24-48 hours.
            </p>
          </form>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '24px', color: 'var(--text-primary)' }}>Frequently Asked Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--text-primary)' }}>Where do you source your market data?</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>We aggregate our data primarily from the Finnhub API, supplemented by various public economic data endpoints to ensure our macro models have the most accurate and real-time information possible.</p>
            </div>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--text-primary)' }}>How often is the Risk Appetite Index updated?</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>The Risk Appetite Index is calculated continuously during market hours. We evaluate cross-asset momentum, volatility, and credit spreads to provide an updated reading every 15 minutes.</p>
            </div>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--text-primary)' }}>Can I request a new feature or index?</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>Absolutely! We are actively building out AeroTrade and love hearing from users about what indicators they need. Please use the contact form above and select 'Feature Request'.</p>
            </div>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--text-primary)' }}>Is AeroTrade completely free to use?</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>Currently, AeroTrade is free to use as part of our mission to democratize access to institutional-grade macro data. We may introduce premium features in the future, but our core dashboard will remain accessible.</p>
            </div>
          </div>
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
