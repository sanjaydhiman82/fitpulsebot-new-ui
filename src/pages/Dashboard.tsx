import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../App';
import {
  LayoutDashboard, Activity, Droplets, UtensilsCrossed, Moon, Scale,
  Bell, BarChart2, Settings, LogOut, Sun, Menu, X, User,
  MessageSquare, HeadphonesIcon, Sparkles, Dumbbell, TestTube2, FileText
} from 'lucide-react';
import styles from './Dashboard.module.css';
import { api } from '../api';
import { normalizeProfileImageUrl } from '../profileImageUrl';
import DashboardHome from '../components/DashboardHome';
import ActivityLog from '../components/ActivityLog';
import NutritionLog from '../components/NutritionLog';
import HydrationLog from '../components/HydrationLog';
import SleepLog from '../components/SleepLog';
import WeightLog from '../components/WeightLog';
import ReportsPage from '../components/ReportsPage';
import MyReportsPage from '../components/MyReportsPage';
import UserProfilePage from '../components/UserProfilePage';
import NotificationsPage from '../components/NotificationsPage';
import SupportPage from '../components/SupportPage';
import MessagesPage from '../components/MessagesPage';
import SettingsPage from '../components/SettingsPageFull';
import JoinGymPage from '../components/JoinGymPage';
import PartnerBranchProfile from '../components/PartnerBranchProfile';
import BioMarkersPage from '../components/BioMarkersPage';
import { useOrgAppFunctions } from '../utils/useOrgAppFunctions';

export type DashTab = string;

const NAV_ITEMS: { id: DashTab; icon: any; label: string; group?: string }[] = [
  { id: 'home', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'activity', icon: Activity, label: 'Activity', group: 'Tracking' },
  { id: 'nutrition', icon: UtensilsCrossed, label: 'Nutrition', group: 'Tracking' },
  { id: 'hydration', icon: Droplets, label: 'Hydration', group: 'Tracking' },
  { id: 'sleep', icon: Moon, label: 'Sleep', group: 'Tracking' },
  { id: 'weight', icon: Scale, label: 'Weight', group: 'Tracking' },
  { id: 'reports', icon: BarChart2, label: '360° HTR', group: 'Insights' },
  { id: 'myReports', icon: FileText, label: 'My Reports', group: 'Insights' },
  { id: 'biomarkers', icon: TestTube2, label: 'BioMarkers', group: 'Insights' },
  { id: 'joinGym', icon: Dumbbell, label: 'Programs', group: 'Our Partners' },
  { id: 'profile', icon: User, label: 'Profile', group: 'Account' },
  { id: 'notifications', icon: Bell, label: 'Reminders', group: 'Account' },
  { id: 'support', icon: HeadphonesIcon, label: 'Support', group: 'Account' },
  { id: 'messages', icon: MessageSquare, label: 'Messages', group: 'Account' },
  { id: 'settings', icon: Settings, label: 'Settings', group: 'Account' },
];

const GROUPS = ['', 'Tracking', 'Insights', 'Our Partners', 'Account'];

interface UserCredit {
  allocatedCredit: number;
  availableCredit: number;
  allocatedCreditDate: string;
}

export default function Dashboard() {
  const { toggleTheme, theme, user, requestLogout } = useApp();
  const [tab, setTab] = useState<DashTab>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [credit, setCredit] = useState<UserCredit | null>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [partnerBranches, setPartnerBranches] = useState<any[]>([]);

  const refreshUnreadCount = useCallback(() => {
    if (user?.userId) {
      api.messages.getUserMessages(user.userId)
        .then((messages: any[]) => {
          const unreadCount = Array.isArray(messages) ? messages.filter(m => !m.is_read).length : 0;
          setUnreadMessagesCount(unreadCount);
        })
        .catch(() => setUnreadMessagesCount(0));
    }
  }, [user?.userId]);

  const { isVisible } = useOrgAppFunctions(user?.organizationId);
  const partnerItems = useMemo(() => isVisible('Programs') ? partnerBranches.map(b => ({
    id: `partner:${b.branch_id || b.branchId}`,
    icon: Dumbbell,
    label: b.branch_name || b.branchName || 'Branch',
    group: 'Our Partners',
  })) : [], [isVisible, partnerBranches]);
  const navItems = useMemo(() => [...NAV_ITEMS.filter(item => isVisible(item.label)), ...partnerItems], [isVisible, partnerItems]);
  const currentLabel = navItems.find(n => n.id === tab)?.label || '';
  const avatarUrl = typeof user?.avatarUrl === 'string' ? normalizeProfileImageUrl(user.avatarUrl) : '';
  const avatarFallback = (user?.firstName || user?.userName || 'U').charAt(0).toUpperCase();
  const logoSrc = '/coach.png';
  const handleTabSelect = (next: DashTab) => {
    setTab(next);
    setSidebarOpen(false);
    setAccountMenuOpen(false);
  };

  useEffect(() => {
    if (user?.userId) {
      api.subscription.getUserCredit(user.userId)
        .then(setCredit)
        .catch(() => setCredit(null));
      
      refreshUnreadCount();
      api.partner.branches().then(d => setPartnerBranches(d.branches || [])).catch(() => setPartnerBranches([]));
    }
  }, [user?.userId, refreshUnreadCount]);

  useEffect(() => {
    if (navItems.length && !navItems.some(item => item.id === tab)) {
      setTab(navItems[0].id);
    }
  }, [navItems, tab]);

  return (
    <div className={styles.layout} data-testid="dashboard" aria-label="Dashboard">
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`} data-testid="sidebar">
        <div className={styles.sidebarTop}>
          <button className={styles.sidebarClose} onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>{avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : avatarFallback}</div>
          <div>
            <div className={styles.userName}>{user?.firstName || user?.userName?.split('@')[0] || 'User'}</div>
            <div className={styles.userPlan}>{user?.plan || 'Start'} Plan</div>
          </div>
        </div>
        <nav className={styles.nav}>
          {GROUPS.map(group => {
            const items = navItems.filter(n => (n.group || '') === group);
            if (!items.length) return null;
            return (
              <React.Fragment key={group}>
                {group && <div className={styles.navGroup}>{group}</div>}
                {items.map(item => (
                  <button key={item.id} className={`${styles.navItem} ${tab === item.id ? styles.navActive : ''}`}
                    onClick={() => handleTabSelect(item.id)}>
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </React.Fragment>
            );
          })}
        </nav>
        <div className={styles.sidebarBottom}>
          <button className={styles.navItem} onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button className={styles.navItem} onClick={requestLogout}>
            <LogOut size={16} /><span>Sign Out</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      <main className={styles.main}>
        <header className={styles.topbar}>
          <button
            className={styles.menuBtn}
            data-testid="mobile-menu"
            aria-label="Open navigation menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className={styles.topbarBrand}>
            <img src={logoSrc} alt="FitPulseBot" className={styles.topbarLogoImg} onError={e => (e.currentTarget.style.display='none')} />
            <div>
              <div className={styles.topbarLogoName}>FitPulseBot</div>
              <div className={styles.topbarLogoTagline}>Stay on Track,Stay in Pulse</div>
            </div>
          </div>
          <h1 className={styles.pageTitle}>{currentLabel}</h1>
          <div className={styles.topbarRight}>
            {credit && (
              <div className={styles.creditBadge} title={`AI Credit: ${credit.availableCredit.toFixed(2)} / ${credit.allocatedCredit} remaining`}>
                <Sparkles size={14} />
                <span>{credit.availableCredit.toFixed(1)}</span>
              </div>
            )}
            <button className={styles.iconBtn} onClick={() => handleTabSelect('notifications')} title="Reminders"><Bell size={18} /></button>
            <button 
              className={styles.iconBtn} 
              onClick={() => { handleTabSelect('messages'); refreshUnreadCount(); }}
              title="Messages"
              style={{ position: 'relative' }}
            >
              <MessageSquare size={18} />
              {unreadMessagesCount > 0 && (
                <span 
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    lineHeight: '1'
                  }}
                >
                  {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                </span>
              )}
            </button>
            <div className={styles.accountMenuWrap}>
              <button
                className={styles.avatarSm}
                onClick={() => setAccountMenuOpen(open => !open)}
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                aria-label="Account"
                title="Account"
              >
                {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : avatarFallback}
              </button>
              {accountMenuOpen && (
                <div className={styles.accountMenu} role="menu">
                  <button
                    className={styles.accountMenuItem}
                    role="menuitem"
                    onClick={() => handleTabSelect('profile')}
                  >
                    <User size={15} />
                    <span>Profile</span>
                  </button>
                  <button
                    className={`${styles.accountMenuItem} ${styles.accountMenuDanger}`}
                    role="menuitem"
                    onClick={() => { setAccountMenuOpen(false); requestLogout(); }}
                  >
                    <LogOut size={15} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className={styles.content}>
          {tab === 'home' && <DashboardHome setTab={handleTabSelect} />}
          {tab === 'activity' && <ActivityLog />}
          {tab === 'nutrition' && <NutritionLog />}
          {tab === 'hydration' && <HydrationLog />}
          {tab === 'sleep' && <SleepLog />}
          {tab === 'weight' && <WeightLog />}
          {tab === 'reports' && <ReportsPage />}
          {tab === 'myReports' && <MyReportsPage />}
          {tab === 'biomarkers' && <BioMarkersPage />}
          {tab === 'joinGym' && <JoinGymPage />}
          {tab.startsWith('partner:') && <PartnerBranchProfile branchId={tab.slice('partner:'.length)} />}
          {tab === 'profile' && <UserProfilePage />}
          {tab === 'notifications' && <NotificationsPage />}
          {tab === 'support' && <SupportPage />}
          {tab === 'messages' && <MessagesPage onMessageRead={refreshUnreadCount} />}
          {tab === 'settings' && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}
