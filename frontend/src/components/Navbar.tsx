import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Shield, Eye, Flame, Activity, FileText, Settings, Globe, PlayCircle, Database, Video } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userPoints: number;
  hasActiveReview: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, userPoints, hasActiveReview }) => {
  const { t, language, setLanguage, isRtl } = useLanguage();

  const navItems = [
    { id: 'home', label: t.navHome, icon: Eye },
    { id: 'match', label: t.navMatchCenter, icon: PlayCircle },
    { id: 'referee', label: t.navReferee, icon: Shield, badge: hasActiveReview ? 'VAR' : undefined },
    { id: 'video-analysis', label: (t as any).navVideoAnalysis || 'Video Analysis', icon: Video, badge: 'NEW' },
    { id: 'explainer', label: t.navExplainer, icon: FileText },
    { id: 'fan', label: t.navFanArena, icon: Flame, points: `${userPoints} pts` },
    { id: 'analytics', label: t.navAnalytics, icon: Activity },
    { id: 'transparency', label: (t as any).navTransparency || 'Data & Transparency', icon: Database },
    { id: 'report', label: t.navReport, icon: FileText },
    { id: 'settings', label: t.navSettings, icon: Settings },
  ];

  return (
    <header style={{
      backgroundColor: '#070b15',
      borderBottom: '1px solid #1e293b',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(8px)'
    }}>
      {/* Top Banner: Responsible AI Disclaimer */}
      <div style={{
        backgroundColor: '#0d1527',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '4px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        color: '#94a3b8'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#00FF87'
          }} />
          <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{t.hackathonTag}</span>
          <span style={{ color: '#475569' }}>|</span>
          <span>{t.nonAuthoritativeBadge}</span>
        </div>

        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: '#e2e8f0',
            cursor: 'pointer',
            padding: '2px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: 500
          }}
          title="Switch Language / تغيير اللغة"
        >
          <Globe size={12} />
          <span>{language === 'en' ? 'العربية (RTL)' : 'English (LTR)'}</span>
        </button>
      </div>

      {/* Main Navbar */}
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '8px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        {/* Brand */}
        <div
          onClick={() => setActiveTab('home')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #00FF87 0%, #1e3a8a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0, 255, 135, 0.3)'
          }}>
            <Shield size={20} color="#0A0E1A" />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px', color: '#FFFFFF' }}>
              {t.brandName}
            </div>
            <div style={{ fontSize: '10px', color: '#00FF87', fontWeight: 500, letterSpacing: '0.2px' }}>
              {t.tagline}
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: isActive ? '1px solid #00FF87' : '1px solid transparent',
                  backgroundColor: isActive ? 'rgba(0, 255, 135, 0.12)' : 'transparent',
                  color: isActive ? '#00FF87' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                <Icon size={15} />
                <span>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: '9px',
                    backgroundColor: '#ff0055',
                    color: '#fff',
                    padding: '1px 5px',
                    borderRadius: '10px',
                    fontWeight: 700
                  }}>
                    {item.badge}
                  </span>
                )}
                {item.points && (
                  <span style={{
                    fontSize: '10px',
                    backgroundColor: 'rgba(255, 215, 0, 0.2)',
                    color: '#FFD700',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontWeight: 600
                  }}>
                    {item.points}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
