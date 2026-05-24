import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { api } from '../api';
import {
  Sun, Moon, Zap, Activity, Droplets, Brain, ArrowRight, Check, Menu, X,
  Star, TrendingUp, Shield, Smartphone, Target, Bell,
  ChevronDown, ChevronUp, Users, Flame
} from 'lucide-react';
import styles from './LandingPage.module.css';
import siteVersion from '../config/site-version.json';

const FEATURES = [
  { icon: Activity, title: 'Activity Tracking', desc: 'Log workouts, track calories burned, set daily step goals and monitor intensity trends.', color: '#3dbf96', metric: '12M+ workouts logged' },
  { icon: '🥗', title: 'AI Nutrition', desc: 'Smart food recognition, macro tracking and personalised meal suggestions powered by AI.', color: '#5bc8e0', metric: '200+ food items recognized' },
  { icon: Droplets, title: 'Hydration Monitor', desc: 'Smart water reminders, multi-drink logging and daily hydration progress visualisation.', color: '#2d6fd6', metric: '98% reminder accuracy' },
  { icon: '⚖️', title: 'Weight Management', desc: 'Track trends, BMI, set targets and celebrate milestones on your journey.', color: '#9f7aea', metric: 'Avg 6.2kg lost in 90 days' },
  { icon: '😴', title: 'Sleep Tracking', desc: 'Monitor sleep quality and patterns with personalised improvement suggestions.', color: '#ed8936', metric: '+42 min avg sleep gain' },
  { icon: Brain, title: 'AI Insights', desc: 'Personalised health recommendations, trend alerts and adaptive goal strategies.', color: '#e53e3e', metric: '1.2M insights generated' },
];

const PLANS = [
  { name: 'Start', price: '₹0', period: 'monthly', description: 'Perfect for getting started with basic health tracking', popular: false, cta: 'Start Free',
    features: ['Basic activity tracking', 'Water intake monitoring', 'Meal logging', 'Sleep tracking', 'Standard notifications', 'Essential health reports'] },
  { name: 'Pro', price: '₹199', period: 'monthly', description: 'Advanced features for serious health enthusiasts', popular: true, cta: 'Start Pro Trial',
    features: ['All Start features', 'Weight tracking', 'AI nutrition tips', 'Advanced health reports', 'Comparative analytics', 'Priority notifications', 'Enhanced goal customization'] },
  { name: 'Elite', price: '₹299', period: 'monthly', description: 'Complete health management solution', popular: false, cta: 'Start Premium',
    features: ['All Pro features', 'Personal coach alerts', 'Premium AI insights', 'Custom health strategies', 'Early feature access', 'Exclusive wellness content', 'Priority support'] },
];

const STATS = [
  { value: '50K+', label: 'Active Users', icon: Users },
  { value: '4.9★', label: 'App Rating', icon: Star },
  { value: '12M+', label: 'Workouts Logged', icon: Flame },
  { value: '98%', label: 'Goal Achievement', icon: Target },
];

const TESTIMONIALS = [
  { name: 'Priya M.', role: 'Software Engineer, Bengaluru', text: 'FitPulseBot helped me lose 8kg in 3 months. The AI tips are incredibly accurate and motivating!', rating: 5, avatar: 'P' },
  { name: 'Arjun K.', role: 'Fitness Enthusiast, Mumbai', text: "Best all-in-one health app I've ever used. The hydration reminders genuinely changed my daily routine.", rating: 5, avatar: 'A' },
  { name: 'Sneha R.', role: 'Working Professional, Delhi', text: "Finally an app that doesn't overwhelm me. Clean, simple and the AI insights are spot-on for my goals.", rating: 5, avatar: 'S' },
  { name: 'Rahul T.', role: 'Marathon Runner, Pune', text: "The activity tracking is incredibly detailed. I can finally see patterns in my training performance.", rating: 5, avatar: 'R' },
  { name: 'Kavya P.', role: 'Nutritionist, Hyderabad', text: "I recommend FitPulseBot to all my clients. The nutrition module is the most comprehensive I've seen.", rating: 5, avatar: 'K' },
  { name: 'Vikram S.', role: 'Startup Founder, Chennai', text: "Busy schedule means I forget basics. FitPulse's smart reminders keep me on track without being annoying.", rating: 5, avatar: 'V' },
];

const COMPARISON = [
  { feature: 'Activity Tracking', fitpulse: true, app1: true, app2: false },
  { feature: 'AI Nutrition Tips', fitpulse: true, app1: false, app2: false },
  { feature: 'Hydration Monitoring', fitpulse: true, app1: false, app2: true },
  { feature: 'Sleep Tracking', fitpulse: true, app1: true, app2: false },
  { feature: 'Weight Management', fitpulse: true, app1: true, app2: true },
  { feature: 'Personalised AI Insights', fitpulse: true, app1: false, app2: false },
  { feature: 'Smart Notifications', fitpulse: true, app1: true, app2: false },
  { feature: 'Free Tier Available', fitpulse: true, app1: false, app2: true },
  { feature: 'Macro Nutrient Tracking', fitpulse: true, app1: false, app2: false },
  { feature: 'BMI & Health Indicators', fitpulse: true, app1: true, app2: false },
];

const FAQS = [
  { q: 'Is FitPulseBot really free to start?', a: 'Yes! Our Start plan is completely free with no credit card required. You get full access to activity tracking, water monitoring, meal logging and sleep tracking. Upgrade only when you need advanced AI features.' },
  { q: 'How does the AI nutrition tracking work?', a: 'Our AI-powered food recognition lets you log meals quickly with text or photos. It identifies macronutrients automatically — calories, protein, carbs, fats, fiber, sugar and sodium — and suggests personalised meal plans based on your goals.' },
  { q: 'Can I use FitPulseBot on mobile?', a: 'Absolutely! FitPulseBot is fully responsive and optimized for iOS and Android browsers. A dedicated mobile app is on our roadmap for Q3 2025 with push notifications and wearable integration.' },
  { q: 'Is my health data private and secure?', a: 'Your health data is handled with bank-grade AES-256 encryption. We never sell your data to third parties. You own your data and can export or delete it at any time from the settings panel.' },
  { q: 'Can I cancel my Pro or Elite subscription?', a: 'Yes — cancel any time with no penalties. Your plan stays active until the end of the billing period, then reverts to the free Start plan. No hidden fees, no long-term commitments.' },
  { q: 'How accurate are the AI health insights?', a: 'Our AI model is trained on millions of health data points and continuously improves. Insights are personalised to your specific goals, activity patterns and nutritional habits — not generic advice.' },
];

const ROADMAP = [
  { quarter: 'Q2 2025', status: 'live', label: 'Live Now', items: ['AI Nutrition Tracking', 'Smart Hydration Reminders', 'Sleep Pattern Analysis', 'Pro & Elite Plans'] },
  { quarter: 'Q3 2025', status: 'building', label: 'Building', items: ['iOS & Android App', 'Wearable Device Sync', 'Social Challenges', 'Advanced Streak System'] },
  { quarter: 'Q4 2025', status: 'planned', label: 'Planned', items: ['Telehealth Integration', 'AI Personal Coach', 'Community Forums', 'Gamification Rewards'] },
  { quarter: '2026', status: 'vision', label: 'Vision', items: ['Global Wellness Hub', 'Multi-language Support', 'Health Insurance Tie-ins', 'Predictive Health Alerts'] },
];

const HEALTH_METRICS = [
  { icon: '🏃', label: 'Avg Steps/Day', value: '8,420', change: '+12%', color: '#3dbf96' },
  { icon: '💧', label: 'Hydration Rate', value: '87%', change: '+8%', color: '#5bc8e0' },
  { icon: '😴', label: 'Sleep Quality', value: '7.4h', change: '+18min', color: '#ed8936' },
  { icon: '🔥', label: 'Calories Burned', value: '2,140', change: '+320', color: '#e53e3e' },
];

export default function LandingPage() {
  const { toggleTheme, theme, setPage } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [plans, setPlans] = useState<any[]>(PLANS);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const logoSrc = '/coach.png';

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    let alive = true;
    api.subscription.getPlans()
      .then(res => {
        if (!alive) return;
        const livePlans = res?.plans || (Array.isArray(res) ? res : []);
        if (livePlans.length) setPlans(livePlans);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <div className={styles.page}>
      {/* NAV */}
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
        <div className={styles.navInner}>
          <div className={styles.logoWrap}>
            <img src={logoSrc} alt="FitPulseBot" className={styles.logoImg} onError={e => (e.currentTarget.style.display='none')} />
            <div>
              <div className={styles.logoName}>FitPulseBot</div>
              <div className={styles.logoTagline}>Stay in Pulse</div>
            </div>
          </div>
          <div className={styles.navLinks}>
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
            <a href="#testimonials" onClick={() => setMenuOpen(false)}>Reviews</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
          </div>
          <div className={styles.navActions}>
            <button className="theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button className="btn-outline" onClick={() => setPage('auth')}>Sign In</button>
            <button className="btn-primary" onClick={() => setPage('auth')}>Get Started <ArrowRight size={13} /></button>
          </div>
          <button className={styles.hamburger} onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <div className={styles.mobileMenu}>
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
            <a href="#testimonials" onClick={() => setMenuOpen(false)}>Reviews</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
            <div className={styles.mobileMenuActions}>
              <button className="btn-outline" style={{width:'100%',justifyContent:'center'}} onClick={() => { setPage('auth'); setMenuOpen(false); }}>Sign In</button>
              <button className="btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={() => { setPage('auth'); setMenuOpen(false); }}>Get Started <ArrowRight size={13} /></button>
              <button className="theme-btn" style={{alignSelf:'center'}} onClick={toggleTheme}>
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        {/* Decorative blobs */}
        <div className={styles.heroBlob1} />
        <div className={styles.heroBlob2} />
        <div className={styles.heroBlob3} />

        <div className={styles.heroContent}>
          {/* Pill badge */}
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            <Zap size={12} /> AI-Powered Health OS &nbsp;·&nbsp; Free to Start
          </div>

          {/* Headline */}
          <h1 className={styles.heroTitle}>
            <span className={styles.heroTitleLine1}>Stay on Track,</span>
            <br />
            <span className={styles.heroTitleLine2}>
              Stay in <span className={styles.heroGradient}>Pulse<span className={styles.heroPulseRing} />.</span>
            </span>
          </h1>

          {/* Sub-headline */}
          <p className={styles.heroDesc}>
            FitPulseBot unifies your <strong>activity</strong>, <strong>nutrition</strong>, <strong>hydration</strong>, <strong>sleep</strong> and <strong>weight</strong> — one intelligent platform that learns and adapts to <em>you</em>.
          </p>

          {/* CTA row */}
          <div className={styles.heroCta}>
            <button className={styles.heroPrimaryBtn} onClick={() => setPage('auth')}>
              <span>Start Free Today</span>
              <span className={styles.heroBtnArrow}><ArrowRight size={16} /></span>
            </button>
            <button className={styles.heroSecondaryBtn} onClick={() => setPage('auth')}>
              Sign In <ArrowRight size={14} />
            </button>
          </div>

          {/* Trust micro-line */}
          <div className={styles.heroTrustLine}>
            <span><Shield size={12} /> No credit card</span>
            <span className={styles.heroTrustDot}>·</span>
            <span>Cancel anytime</span>
            <span className={styles.heroTrustDot}>·</span>
            <span>50K+ users</span>
          </div>

          {/* Stats row */}
          <div className={styles.heroStats}>
            {STATS.map((s, i) => (
              <div key={s.label} className={styles.heroStat}>
                <span className={styles.heroStatVal}>{s.value}</span>
                <span className={styles.heroStatLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Visual side */}
        <div className={styles.heroVisual}>
          <div className={styles.heroGlowRing} />
          <div className={styles.heroFloatBadge1}><Activity size={11} color="#3dbf96" /> 2,140 kcal burned</div>
          <div className={styles.heroFloatBadge2}>🔥 14-day streak!</div>
          <div className={styles.heroFloatBadge3}><Brain size={11} color="#5bc8e0" /> AI insight ready</div>
          <HeroCard />
        </div>
      </section>

      {/* TRUST BAR */}
      <div className={styles.trustBar}>
        <div className={styles.trustInner}>
          {[Shield, Smartphone, Zap, Star].map((Icon, i) => (
            <div key={i} className={styles.trustItem}>
              <Icon size={16} />
              <span>{['Bank-grade security', 'iOS & Android ready', 'Real-time AI insights', '4.9★ rated'][i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* LIVE HEALTH METRICS TICKER */}
      <div className={styles.metricsTicker}>
        <div className={styles.metricsTickerInner}>
          <div className={styles.metricsTickerLabel}><Activity size={13} /> Community Health Pulse — Live</div>
          <div className={styles.metricsTickerItems}>
            {HEALTH_METRICS.map((m, i) => (
              <div key={i} className={styles.metricsTickerItem}>
                <span className={styles.metricsTickerEmoji}>{m.icon}</span>
                <span className={styles.metricsTickerKey}>{m.label}</span>
                <span className={styles.metricsTickerVal} style={{ color: m.color }}>{m.value}</span>
                <span className={styles.metricsTickerChange}>↑ {m.change}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>Everything You Need</div>
          <h2 className={styles.sectionTitle}>Health tracking,<br className={styles.brHide} /> reimagined with AI</h2>
          <p className={styles.sectionDesc}>Six powerful modules that work together seamlessly — no more juggling multiple apps.</p>
          <div className={styles.featureGrid}>
            {FEATURES.map((f, i) => (
              <div key={i} className={styles.featureCard} style={{ '--fc': f.color } as any}>
                <div className={styles.featureIconWrap} style={{ background: f.color + '18', border: `1px solid ${f.color}30` }}>
                  {typeof f.icon === 'string'
                    ? <span style={{ fontSize: 22 }}>{f.icon}</span>
                    : <f.icon size={22} color={f.color} />}
                </div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
                <div className={styles.featureMetric} style={{ color: f.color, borderColor: f.color + '30', background: f.color + '10' }}>
                  <TrendingUp size={11} /> {f.metric}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className={styles.howSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>Simple Process</div>
          <h2 className={styles.sectionTitle}>Up and running in 3 minutes</h2>
          <p className={styles.sectionDesc}>No complex setup. No confusing menus. Just you and your health data, beautifully organized.</p>
          <div className={styles.steps}>
            {[
              { num: 1, title: 'Create your profile', desc: 'Tell us your goals, current stats and preferred lifestyle. Takes under 2 minutes.', icon: '👤' },
              { num: 2, title: 'Set your goals', desc: 'Choose targets for calories, steps, water, sleep and weight. AI refines them for you.', icon: '🎯' },
              { num: 3, title: 'Track & improve', desc: 'Log daily activity via our intuitive interface. Watch your streaks grow and health improve.', icon: '📈' },
            ].map((s, i) => (
              <div key={i} className={styles.step}>
                <div className={styles.stepNum}>{s.num}</div>
                <div className={styles.stepEmoji}>{s.icon}</div>
                <div className={styles.stepText}>{s.title}</div>
                <div className={styles.stepDesc}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY FITPULSEBOT — COMPARISON */}
      <section className={styles.comparisonSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>Why Us</div>
          <h2 className={styles.sectionTitle}>The all-in-one advantage</h2>
          <p className={styles.sectionDesc}>Most fitness apps do one thing well. FitPulseBot does everything — intelligently.</p>
          <div className={styles.comparisonWrap}>
            <table className={styles.compTable}>
              <thead>
                <tr>
                  <th className={styles.compFeatureCol}>Feature</th>
                  <th className={styles.compFitpulse}><span className={styles.compBrand}>FitPulseBot</span></th>
                  <th className={styles.compOther}>Typical App A</th>
                  <th className={styles.compOther}>Typical App B</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? styles.compRowEven : ''}>
                    <td className={styles.compFeatureCell}>{row.feature}</td>
                    <td className={styles.compFitpulseCell}>{row.fitpulse ? <span className={styles.compYes}>✓</span> : <span className={styles.compNo}>✗</span>}</td>
                    <td className={styles.compOtherCell}>{row.app1 ? <span className={styles.compPartial}>✓</span> : <span className={styles.compNo}>✗</span>}</td>
                    <td className={styles.compOtherCell}>{row.app2 ? <span className={styles.compPartial}>✓</span> : <span className={styles.compNo}>✗</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.compNote}>* Based on publicly available feature sets of leading health tracking applications as of 2025.</div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>Simple Pricing</div>
          <h2 className={styles.sectionTitle}>Choose your journey</h2>
          <p className={styles.sectionDesc}>Start free. Upgrade when you're ready. No hidden fees, no contracts.</p>
          <div className={styles.pricingGrid}>
            {plans.map(plan => {
              const features = Array.isArray(plan.features) ? plan.features : [];
              const popular = Boolean(plan.popular || plan.highlight);
              return (
              <div key={plan.name} className={`${styles.pricingCard} ${popular ? styles.pricingHL : ''}`}>
                {popular && <div className={styles.pricingBadge}>Most Popular</div>}
                <div className={styles.pricingName}>{plan.name}</div>
                {plan.description && <p className={styles.pricingDesc}>{plan.description}</p>}
                <div className={styles.pricingPriceRow}>
                  <span className={styles.pricingAmount}>{plan.price}</span>
                  <span className={styles.pricingPeriod}>/{plan.period || 'monthly'}</span>
                </div>
                <ul className={styles.pricingList}>
                  {(features.length ? features : ['Personal dashboard', 'Goal tracking', 'Progress insights']).map((f: string, i: number) => (
                    <li key={i}><Check size={13} className={styles.checkIcon} /> {f}</li>
                  ))}
                </ul>
                <button
                  className={popular ? 'btn-primary' : 'btn-outline'}
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setPage('onboarding')}
                >
                  {plan.cta || 'Get Started'}
                </button>
              </div>
            );})}
          </div>
          <div className={styles.pricingFootnote}>
            <Shield size={14} /> All plans include a 7-day free trial. Cancel anytime. No credit card required for Start plan.
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>Real Stories</div>
          <h2 className={styles.sectionTitle}>Loved by thousands</h2>
          <p className={styles.sectionDesc}>Real users, real results — from fitness beginners to seasoned athletes.</p>
          <div className={styles.testimonialGrid}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className={styles.testimonialCard}>
                <div className={styles.tStars}>{'★'.repeat(t.rating)}</div>
                <p className={styles.tText}>"{t.text}"</p>
                <div className={styles.tAuthor}>
                  <div className={styles.tAvatar}>{t.avatar}</div>
                  <div>
                    <div className={styles.tName}>{t.name}</div>
                    <div className={styles.tRole}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.testimonialCta}>
            <div className={styles.testimonialCtaText}>
              <div className={styles.testimonialAvatarRow}>
                {['P','A','S','R','K'].map((l,i) => <div key={i} className={styles.testimonialMiniAvatar}>{l}</div>)}
                <span className={styles.testimonialMoreText}>+50,000 users</span>
              </div>
              <span>Join a growing community of health-conscious Indians transforming their lives.</span>
            </div>
            <button className="btn-primary-lg" onClick={() => setPage('auth')}>
              Join Free Today <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ROADMAP */}
      <section className={styles.roadmapSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>What's Coming</div>
          <h2 className={styles.sectionTitle}>Built for the long run</h2>
          <p className={styles.sectionDesc}>We're constantly shipping. Here's what we're working on to make FitPulseBot even better.</p>
          <div className={styles.roadmapGrid}>
            {ROADMAP.map((phase, i) => (
              <div key={i} className={`${styles.roadmapCard} ${styles['roadmap_' + phase.status]}`}>
                <div className={styles.roadmapHeader}>
                  <span className={styles.roadmapQuarter}>{phase.quarter}</span>
                  <span className={`${styles.roadmapStatus} ${styles['roadmapStatus_' + phase.status]}`}>{phase.label}</span>
                </div>
                <ul className={styles.roadmapList}>
                  {phase.items.map((item, j) => (
                    <li key={j} className={styles.roadmapItem}>
                      <span className={styles.roadmapDot} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={styles.faqSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>FAQ</div>
          <h2 className={styles.sectionTitle}>Got questions? We've got answers.</h2>
          <div className={styles.faqList}>
            {FAQS.map((faq, i) => (
              <div key={i} className={`${styles.faqItem} ${openFaq === i ? styles.faqOpen : ''}`}>
                <button className={styles.faqQuestion} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {openFaq === i && <div className={styles.faqAnswer}>{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaBg} />
        <div className={styles.ctaInner}>
          <img src={logoSrc} alt="" className={styles.ctaLogo} onError={e => (e.currentTarget.style.display='none')} />
          <h2 className={styles.ctaTitle}>Ready to transform your health?</h2>
          <p className={styles.ctaDesc}>Join 50,000+ users who've taken control of their wellness journey with FitPulseBot.</p>
          <div className={styles.ctaButtons}>
            <button className="btn-primary-lg" onClick={() => setPage('onboarding')}>
              Start Free — No Credit Card <ArrowRight size={16} />
            </button>
            <button className="btn-ghost-lg" onClick={() => setPage('auth')}>
              Already have an account? Sign in →
            </button>
          </div>
          <div className={styles.ctaTrustRow}>
            {['Bank-grade encryption', 'No spam, ever', 'Cancel anytime', '24/7 support'].map((t, i) => (
              <div key={i} className={styles.ctaTrustItem}><Check size={13} /> {t}</div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <img src={logoSrc} alt="FitPulseBot" className={styles.footerLogoImg} onError={e => (e.currentTarget.style.display='none')} />
              <div className={styles.footerLogoText}>
                <div className={styles.logoName}>FitPulseBot</div>
                <div className={styles.logoTagline}>Stay on Track, Stay in Pulse</div>
              </div>
              <p className={styles.tagline}>Stay on Track, Stay in Pulse.</p>
              <p className={styles.footerBrandDesc}>Empowering 50,000+ Indians to live healthier, happier lives through intelligent fitness tracking.</p>
            </div>
            <div className={styles.footerCols}>
              <div className={styles.footerCol}>
                <div className={styles.footerColTitle}>Product</div>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#how-it-works">How It Works</a>
                <a href="#faq">FAQ</a>
              </div>
              <div className={styles.footerCol}>
                <div className={styles.footerColTitle}>Company</div>
                <a href="https://fitpulsebot.fit">Website</a>
                <a href="mailto:info@fitpulsebot.fit">Contact Us</a>
                <button style={{background:'none',border:'none',padding:0,cursor:'pointer',color:'inherit',fontFamily:'inherit',fontSize:'inherit',textAlign:'left'}} onClick={() => setPage('privacy' as any)}>Privacy Policy</button>
                <button style={{background:'none',border:'none',padding:0,cursor:'pointer',color:'inherit',fontFamily:'inherit',fontSize:'inherit',textAlign:'left'}} onClick={() => setPage('terms' as any)}>Terms of Service</button>
              </div>
              <div className={styles.footerCol}>
                <div className={styles.footerColTitle}>Get Started</div>
                <button className="btn-primary" style={{justifyContent:'center'}} onClick={() => setPage('auth')}>Start Free</button>
                <button className="btn-outline" style={{justifyContent:'center', marginTop: 8}} onClick={() => setPage('auth')}>Sign In</button>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p className={styles.footerCopy}>
              © 2025 FitPulseBot · info@fitpulsebot.fit · All rights reserved.
              <span className={styles.footerVersion}>v{siteVersion.version}</span>
            </p>
            <div className={styles.footerBottomLinks}>
              <button style={{background:'none',border:'none',cursor:'pointer',color:'inherit',fontFamily:'inherit',fontSize:'inherit',padding:0}} onClick={() => setPage('privacy' as any)}>Privacy</button>
              <button style={{background:'none',border:'none',cursor:'pointer',color:'inherit',fontFamily:'inherit',fontSize:'inherit',padding:0}} onClick={() => setPage('terms' as any)}>Terms</button>
              <a href="/play-store.html" target="_blank" rel="noopener">Play Store</a>
              <a href="mailto:info@fitpulsebot.fit">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeroCard() {
  return (
    <div className={styles.heroCard}>
      <div className={styles.heroCardHeader}>
        <div className={styles.heroCardUser}>
          <div className={styles.heroCardAvatar}>S</div>
          <div>
            <div className={styles.heroCardName}>Sanjay</div>
            <div className={styles.heroCardDate}>Monday, May 4 · 🔥 Day 14</div>
          </div>
        </div>
        <div className={styles.heroCardStreak}>🔥 14d</div>
      </div>
      <div className={styles.heroRings}>
        <Ring label="Calories" value={1840} max={2200} color="#3dbf96" unit="kcal" pct={84} />
        <Ring label="Steps" value={7240} max={10000} color="#5bc8e0" unit="k" pct={72} />
        <Ring label="Water" value={1.8} max={2.5} color="#2d6fd6" unit="L" pct={72} />
      </div>
      <div className={styles.heroMetrics}>
        <Metric emoji="😴" label="Sleep" value="7h 20m" color="#ed8936" />
        <Metric emoji="⚖️" label="Weight" value="72.4kg" color="#9f7aea" />
        <Metric emoji="💪" label="Streak" value="14 days" color="#3dbf96" />
      </div>
      <div className={styles.heroAiTip}>
        <div className={styles.heroAiHeader}><Brain size={12} color="#3dbf96" /> AI Insight</div>
        <div className={styles.heroAiText}>You're 260 kcal away from your goal. A 30-min walk will close the gap!</div>
      </div>
      <div className={styles.heroCardActions}>
        <div className={styles.heroCardAction}>
          <Activity size={12} color="#3dbf96" /> Log Workout
        </div>
        <div className={styles.heroCardAction}>
          <Droplets size={12} color="#5bc8e0" /> Add Water
        </div>
        <div className={styles.heroCardAction}>
          <Bell size={12} color="#ed8936" /> Reminders
        </div>
      </div>
    </div>
  );
}

function Ring({ label, value, max, color, unit, pct }: any) {
  const r = 30, cx = 38, cy = 38, c = 2 * Math.PI * r;
  return (
    <div className={styles.ring}>
      <svg width="76" height="76" viewBox="0 0 76 76">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="5.5" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="5.5"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
          strokeLinecap="round" transform="rotate(-90 38 38)" />
        <text x="50%" y="54%" textAnchor="middle" fill={color} fontSize="11" fontWeight="700" fontFamily="Plus Jakarta Sans">{pct}%</text>
      </svg>
      <span className={styles.ringLabel}>{label}</span>
      <span className={styles.ringVal} style={{ color }}>{value}{unit === 'kcal' ? '' : unit === 'L' ? 'L' : ''}</span>
    </div>
  );
}

function Metric({ emoji, label, value, color }: any) {
  return (
    <div className={styles.heroMetric}>
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <span className={styles.heroMetricLabel}>{label}</span>
      <span className={styles.heroMetricVal} style={{ color }}>{value}</span>
    </div>
  );
}
