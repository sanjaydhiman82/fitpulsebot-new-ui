import React from 'react';
import { useApp } from '../App';
import { ArrowLeft, Shield, Lock, Eye, Trash2, Globe, Mail } from 'lucide-react';
import styles from './StaticPage.module.css';

const SECTIONS = [
  {
    icon: Shield,
    title: '1. Information We Collect',
    body: [
      'We collect information you provide directly when you create an account, complete onboarding, or use the app. This includes:',
      '• **Account data** – name, email address, password (hashed), Google OAuth identity.',
      '• **Health & fitness data** – activity logs, food intake, water consumption, sleep records, weight entries, and AI-generated insights.',
      '• **Device & usage data** – browser type, IP address, pages visited, feature interactions, and crash reports.',
      '• **Payment data** – subscription tier and transaction status. We do not store raw card numbers; payments are processed via Razorpay.',
    ],
  },
  {
    icon: Eye,
    title: '2. How We Use Your Information',
    body: [
      'We use your data to:',
      '• Provide, maintain, and improve FitPulseBot features and AI insights.',
      '• Send transactional emails (password reset, subscription receipts) and in-app notifications you enable.',
      '• Detect and prevent fraud, abuse, or security incidents.',
      '• Comply with applicable Indian laws, including the Digital Personal Data Protection Act, 2023 (DPDPA).',
      'We do **not** sell your personal data to third parties, and we do not use your health data for advertising.',
    ],
  },
  {
    icon: Globe,
    title: '3. Data Sharing',
    body: [
      'We share data only in these limited circumstances:',
      '• **Service providers** – AWS (cloud hosting, India region ap-south-1), OpenAI (AI processing for nutrition/activity insights), Razorpay (payments). Each provider processes data solely on our behalf.',
      '• **Legal obligations** – when required by a court order, government authority, or to protect the rights of FitPulseBot and its users.',
      '• **Business transfers** – in the event of a merger or acquisition, your data may be transferred with prior notice.',
    ],
  },
  {
    icon: Lock,
    title: '4. Data Security',
    body: [
      'We apply industry-standard safeguards including:',
      '• AES-256 encryption at rest and TLS 1.2+ in transit.',
      '• JWT-based authentication with short-lived access tokens and refresh-token rotation.',
      '• Regular vulnerability assessments and dependency audits.',
      'While we take every reasonable precaution, no system is perfectly secure. Please keep your credentials confidential and notify us immediately at security@fitpulsebot.fit if you suspect unauthorised access.',
    ],
  },
  {
    icon: Trash2,
    title: '5. Data Retention & Deletion',
    body: [
      'We retain your account data for as long as your account is active or as needed to provide services. You may:',
      '• **Export** your health data at any time from Settings → Data & Privacy → Export.',
      '• **Delete** your account and all associated data permanently from Settings → Data & Privacy → Delete Account. Deletion is irreversible and takes effect within 30 days.',
      'Aggregated, anonymised analytics derived from your data may be retained after deletion.',
    ],
  },
  {
    icon: Shield,
    title: '6. Your Rights (DPDPA 2023)',
    body: [
      'As a data principal under the DPDPA, you have the right to:',
      '• **Access** a summary of your personal data we process.',
      '• **Correction** – request rectification of inaccurate data.',
      '• **Erasure** – request deletion of your personal data.',
      '• **Grievance redressal** – raise a complaint with our Data Protection Officer.',
      'To exercise any of these rights, email privacy@fitpulsebot.fit with the subject "Data Rights Request".',
    ],
  },
  {
    icon: Mail,
    title: '7. Cookies & Tracking',
    body: [
      'FitPulseBot uses essential cookies for authentication (JWT in httpOnly cookies) and localStorage for theme preferences. We do not use advertising trackers, cross-site tracking pixels, or third-party analytics SDKs that identify you personally.',
    ],
  },
  {
    icon: Globe,
    title: '8. Children\'s Privacy',
    body: [
      'FitPulseBot is not directed at children under 18. We do not knowingly collect personal data from minors. If you believe a child has provided us data, contact us at privacy@fitpulsebot.fit and we will delete it promptly.',
    ],
  },
  {
    icon: Shield,
    title: '9. Changes to This Policy',
    body: [
      'We may update this Privacy Policy to reflect changes in our practices or legal requirements. We will notify you via email or an in-app banner at least 14 days before material changes take effect. Continued use after that date constitutes acceptance.',
    ],
  },
];

export default function PrivacyPolicy() {
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
          <div className={styles.heroIcon}><Shield size={28} /></div>
          <h1 className={styles.heroTitle}>Privacy Policy</h1>
          <p className={styles.heroSub}>
            We believe your health data is deeply personal. Here's exactly how we handle it.
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
            <h3>Contact Our Privacy Team</h3>
            <p>For any privacy-related queries or to exercise your rights under DPDPA 2023, please reach out:</p>
            <div className={styles.contactRow}>
              <Mail size={15} />
              <a href="mailto:privacy@fitpulsebot.fit">privacy@fitpulsebot.fit</a>
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
