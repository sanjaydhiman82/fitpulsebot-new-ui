import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../App';
import {
  LayoutDashboard, Activity, Droplets, UtensilsCrossed, Moon, Scale,
  Bell, BarChart2, Settings, LogOut, Sun, Menu, X, User,
  MessageSquare, HeadphonesIcon, Sparkles
} from 'lucide-react';
import styles from './Dashboard.module.css';
import { api } from '../api';
import DashboardHome from '../components/DashboardHome';
import ActivityLog from '../components/ActivityLog';
import NutritionLog from '../components/NutritionLog';
import HydrationLog from '../components/HydrationLog';
import SleepLog from '../components/SleepLog';
import WeightLog from '../components/WeightLog';
import ReportsPage from '../components/ReportsPage';
import UserProfilePage from '../components/UserProfilePage';
import NotificationsPage from '../components/NotificationsPage';
import SupportPage from '../components/SupportPage';
import MessagesPage from '../components/MessagesPage';
import SettingsPage from '../components/SettingsPageFull';

export type DashTab = 'home' | 'activity' | 'nutrition' | 'hydration' | 'sleep' | 'weight'
  | 'reports' | 'profile' | 'notifications' | 'support' | 'messages' | 'settings';

const NAV_ITEMS: { id: DashTab; icon: any; label: string; group?: string }[] = [
  { id: 'home', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'activity', icon: Activity, label: 'Activity', group: 'Tracking' },
  { id: 'nutrition', icon: UtensilsCrossed, label: 'Nutrition', group: 'Tracking' },
  { id: 'hydration', icon: Droplets, label: 'Hydration', group: 'Tracking' },
  { id: 'sleep', icon: Moon, label: 'Sleep', group: 'Tracking' },
  { id: 'weight', icon: Scale, label: 'Weight', group: 'Tracking' },
  { id: 'reports', icon: BarChart2, label: 'Reports', group: 'Insights' },
  { id: 'profile', icon: User, label: 'Profile', group: 'Account' },
  { id: 'notifications', icon: Bell, label: 'Notifications', group: 'Account' },
  { id: 'support', icon: HeadphonesIcon, label: 'Support', group: 'Account' },
  { id: 'messages', icon: MessageSquare, label: 'Messages', group: 'Account' },
  { id: 'settings', icon: Settings, label: 'Settings', group: 'Account' },
];

const GROUPS = ['', 'Tracking', 'Insights', 'Account'];

interface UserCredit {
  allocatedCredit: number;
  availableCredit: number;
  allocatedCreditDate: string;
}

export default function Dashboard() {
  const { setPage, toggleTheme, theme, user, requestLogout } = useApp();
  const [tab, setTab] = useState<DashTab>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [credit, setCredit] = useState<UserCredit | null>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

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

  const currentLabel = NAV_ITEMS.find(n => n.id === tab)?.label || '';
  const avatarUrl = typeof user?.avatarUrl === 'string' ? user.avatarUrl : '';
  const avatarFallback = (user?.firstName || user?.userName || 'U').charAt(0).toUpperCase();
  const logoSrc = theme === 'dark' ? '/logo2.png' : '/logo.png';

  useEffect(() => {
    if (user?.userId) {
      api.subscription.getUserCredit(user.userId)
        .then(setCredit)
        .catch(() => setCredit(null));
      
      refreshUnreadCount();
    }
  }, [user?.userId, refreshUnreadCount]);

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarTop}>
          <div className={styles.logo}>
            <img src={logoSrc} alt="FitPulseBot" className={styles.logoImg} onError={e => (e.currentTarget.style.display='none')} />
          </div>
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
            const items = NAV_ITEMS.filter(n => (n.group || '') === group);
            if (!items.length) return null;
            return (
              <React.Fragment key={group}>
                {group && <div className={styles.navGroup}>{group}</div>}
                {items.map(item => (
                  <button key={item.id} className={`${styles.navItem} ${tab === item.id ? styles.navActive : ''}`}
                    onClick={() => { setTab(item.id); setSidebarOpen(false); }}>
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
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <h1 className={styles.pageTitle}>{currentLabel}</h1>
          <div className={styles.topbarRight}>
            {credit && (
              <div className={styles.creditBadge} title={`AI Credit: ${credit.availableCredit.toFixed(2)} / ${credit.allocatedCredit} remaining`}>
                <Sparkles size={14} />
                <span>{credit.availableCredit.toFixed(1)}</span>
              </div>
            )}
            <button className={styles.iconBtn} onClick={() => { setTab('notifications'); setSidebarOpen(false); setAccountMenuOpen(false); }} title="Notifications"><Bell size={18} /></button>
            <button 
              className={styles.iconBtn} 
              onClick={() => { setTab('messages'); setSidebarOpen(false); setAccountMenuOpen(false); refreshUnreadCount(); }} 
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
                title="Account menu"
              >
                {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : avatarFallback}
              </button>
              {accountMenuOpen && (
                <div className={styles.accountMenu} role="menu">
                  <button
                    className={styles.accountMenuItem}
                    role="menuitem"
                    onClick={() => { setTab('profile'); setSidebarOpen(false); setAccountMenuOpen(false); }}
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
          {tab === 'home' && <DashboardHome setTab={setTab} />}
          {tab === 'activity' && <ActivityLog />}
          {tab === 'nutrition' && <NutritionLog />}
          {tab === 'hydration' && <HydrationLog />}
          {tab === 'sleep' && <SleepLog />}
          {tab === 'weight' && <WeightLog />}
          {tab === 'reports' && <ReportsPage />}
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
