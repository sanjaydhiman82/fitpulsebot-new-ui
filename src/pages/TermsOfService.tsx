import React from 'react';
import { useApp } from '../App';
import { ArrowLeft, FileText, AlertCircle, CreditCard, Ban, Scale, RefreshCw, Globe, Mail } from 'lucide-react';
import styles from './StaticPage.module.css';

const SECTIONS = [
  {
    icon: FileText,
    title: '1. Acceptance of Terms',
    body: [
      'By creating an account or using FitPulseBot ("Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.',
      'These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Bengaluru, Karnataka.',
    ],
  },
  {
    icon: Globe,
    title: '2. Eligibility',
    body: [
      'You must be at least 18 years of age and capable of entering into a legally binding contract under Indian law. By using the Service, you represent and warrant that you meet these requirements.',
      'If you are using the Service on behalf of an organisation, you represent that you are authorised to bind that organisation to these Terms.',
    ],
  },
  {
    icon: FileText,
    title: '3. Account Responsibilities',
    body: [
      'You are responsible for:',
      '• Maintaining the confidentiality of your login credentials.',
      '• All activity that occurs under your account, whether authorised or not.',
      '• Providing accurate and up-to-date registration information.',
      '• Notifying us immediately at security@fitpulsebot.fit if you suspect unauthorised access.',
      'We reserve the right to suspend or terminate accounts found to be in violation of these Terms.',
    ],
  },
  {
    icon: CreditCard,
    title: '4. Subscriptions & Payments',
    body: [
      '**Free (Start) Plan** – Available at no cost with core features. No credit card required.',
      '**Pro Plan (₹199/month)** & **Elite Plan (₹299/month)** – Billed monthly via Razorpay. Prices are inclusive of applicable taxes.',
      'Payments are non-refundable except as required by applicable Indian consumer protection laws. If you believe you have been charged in error, contact billing@fitpulsebot.fit within 7 days.',
      'Subscriptions auto-renew each month. You may cancel at any time from Settings → Subscription; cancellation takes effect at the end of the current billing period.',
    ],
  },
  {
    icon: AlertCircle,
    title: '5. Health Disclaimer',
    body: [
      'FitPulseBot is a wellness tracking tool and **does not provide medical advice, diagnosis, or treatment**. The AI insights and recommendations are for informational purposes only and are not a substitute for professional medical advice.',
      'Always consult a qualified healthcare professional before making significant changes to your diet, exercise routine, or health regimen. Do not disregard or delay seeking professional medical advice because of something you read or inferred in the app.',
    ],
  },
  {
    icon: Ban,
    title: '6. Acceptable Use',
    body: [
      'You agree not to:',
      '• Reverse-engineer, decompile, or attempt to extract the source code of the Service.',
      '• Use automated bots, scrapers, or crawlers against the API or frontend.',
      '• Upload malicious code, spam, or content that violates applicable law.',
      '• Impersonate another person or misrepresent your affiliation.',
      '• Attempt to circumvent authentication, rate limits, or access controls.',
      'Violations may result in immediate suspension or permanent termination of your account.',
    ],
  },
  {
    icon: FileText,
    title: '7. Intellectual Property',
    body: [
      'All content, branding, software, and AI models within FitPulseBot are the exclusive intellectual property of FitPulseBot and its licensors, protected under Indian copyright and trademark law.',
      'You retain ownership of all personal data and health information you submit. By using the Service, you grant FitPulseBot a limited, non-exclusive licence to process that data solely to provide and improve the Service.',
    ],
  },
  {
    icon: RefreshCw,
    title: '8. Service Availability & Modifications',
    body: [
      'We aim for 99.5% uptime but do not guarantee uninterrupted availability. Planned maintenance windows will be communicated via in-app banners with at least 24 hours\' notice where possible.',
      'We reserve the right to modify, suspend, or discontinue any feature or the entire Service with reasonable notice. We will not be liable for any loss caused by changes or downtime.',
    ],
  },
  {
    icon: Scale,
    title: '9. Limitation of Liability',
    body: [
      'To the maximum extent permitted by applicable law, FitPulseBot and its affiliates shall not be liable for:',
      '• Indirect, incidental, special, or consequential damages.',
      '• Loss of health outcomes, data loss, or personal injury arising from reliance on AI insights.',
      '• Damages exceeding the amount you paid us in the 3 months preceding the claim.',
      'Some jurisdictions do not allow limitation of liability for personal injury; in such cases, the limitation shall apply to the fullest extent permitted by law.',
    ],
  },
  {
    icon: FileText,
    title: '10. Termination',
    body: [
      'You may delete your account at any time from Settings → Data & Privacy → Delete Account.',
      'We may suspend or terminate your account immediately if you breach these Terms, engage in fraudulent activity, or pose a security risk. Upon termination, your right to use the Service ceases immediately, and we may delete your data as described in our Privacy Policy.',
    ],
  },
  {
    icon: RefreshCw,
    title: '11. Changes to These Terms',
    body: [
      'We may revise these Terms to reflect changes in law, business practices, or new features. We will notify you by email and in-app notification at least 14 days before material changes take effect. Continued use of the Service after that date constitutes acceptance of the revised Terms.',
    ],
  },
];

export default function TermsOfService() {
  const { setPage, theme } = useApp();

  return (
    <div data-theme={theme} className={styles.pageRoot}>
      <nav className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => setPage('landing')}>
          <ArrowLeft size={17} /> Back
        </button>
        <span className={styles.topBarBrand}>FitPulseBot</span>
        <span />
      </nav>

      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.heroIcon} style={{ background: 'rgba(45,111,214,.13)', color: '#2d6fd6', border: '1.5px solid rgba(45,111,214,.28)' }}>
            <Scale size={28} />
          </div>
          <h1 className={styles.heroTitle}>Terms of Service</h1>
          <p className={styles.heroSub}>
            Please read these terms carefully before using FitPulseBot.
          </p>
          <p className={styles.heroMeta}>Last updated: 23 May 2025 · Effective: 1 June 2025</p>
        </div>

        <div className={styles.content}>
          {SECTIONS.map((sec, i) => {
            const Icon = sec.icon;
            return (
              <div key={i} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionIconWrap}><Icon size={18} /></span>
                  <h2 className={styles.sectionTitle}>{sec.title}</h2>
                </div>
                <div className={styles.sectionBody}>
                  {sec.body.map((line, j) => (
                    <p key={j} className={styles.para} dangerouslySetInnerHTML={{
                      __html: line
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/^•\s/, '<span class="bullet">•</span> ')
                    }} />
                  ))}
                </div>
              </div>
            );
          })}

          <div className={styles.contactCard}>
            <h3>Questions About These Terms?</h3>
            <p>If you have any questions or concerns about these Terms of Service, please contact us:</p>
            <div className={styles.contactRow}>
              <Mail size={15} />
              <a href="mailto:legal@fitpulsebot.fit">legal@fitpulsebot.fit</a>
            </div>
            <div className={styles.contactRow}>
              <Globe size={15} />
              <span>FitPulseBot · Bengaluru, Karnataka, India</span>
            </div>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>© 2025 FitPulseBot · All rights reserved.</p>
        <div className={styles.footerLinks}>
          <button onClick={() => setPage('privacy' as any)}>Privacy Policy</button>
          <button onClick={() => setPage('terms' as any)}>Terms of Service</button>
          <a href="mailto:info@fitpulsebot.fit">Contact</a>
        </div>
      </footer>
    </div>
  );
}
