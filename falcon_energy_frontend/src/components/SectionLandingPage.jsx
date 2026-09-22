import React from 'react';
import { ChevronRight } from 'lucide-react';
import { filterAllowedCards } from '../services/permissionService';

export function SectionLandingPage({ title, subtitle, icon: HeaderIcon, items, onSelectModule, currentUser }) {
  const displayItems = currentUser ? filterAllowedCards(currentUser, items) : items;
  const sectionTheme = title.toLowerCase().includes('report') ? 'reports' : title.toLowerCase().includes('entr') ? 'entries' : 'masters';

  return (
    <div className="section-landing">
      {/* Section Header Banner */}
      <div 
        className={`crud-header-card section-landing-header section-landing-header--${sectionTheme}`}
        style={{ 
          color: '#000000',
          marginBottom: '16px',
          padding: '16px 20px'
        }}
      >
        <div className="crud-header-left">
          {HeaderIcon && (
            <div className="crud-header-icon" style={{ background: '#0d9488', color: '#ffffff' }}>
              <HeaderIcon size={22} />
            </div>
          )}
          <div>
            <h2 className="crud-header-title" style={{ color: '#000000', fontSize: '20px' }}>{title}</h2>
            <p className="crud-header-sub" style={{ color: '#000000', fontSize: '13px' }}>{subtitle}</p>
          </div>
        </div>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#0d9488', background: 'rgba(13, 148, 136, 0.15)', padding: '6px 14px', borderRadius: '99px', border: '1px solid rgba(13, 148, 136, 0.3)' }}>
          {displayItems.length} Modules Available
        </div>
      </div>

      {/* Premium Cards Grid */}
      <div className="section-landing-grid">
        {displayItems.map((item) => {
          const IconComponent = item.icon;
          const cardColor = '#0d9488';
          const cardBg = '#0f172a';
          const borderColor = '#0f766e';

          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              className="landing-card"
              style={{
                '--card-color': cardColor,
                '--card-bg': cardBg,
                '--card-border': borderColor,
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 48%, #0f172a 100%)',
                border: `1px solid ${cardColor}`,
                borderRadius: '14px',
                padding: '18px',
                cursor: 'pointer',
                transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
                textAlign: 'left'
              }}
            >
              {/* Subtle colored accent line at top */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                background: 'linear-gradient(90deg, #2dd4bf 0%, #0d9488 52%, #0f172a 100%)',
                opacity: 0.85
              }} />

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.18)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.28)',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)'
                  }}>
                    {IconComponent ? <IconComponent size={20} /> : <span style={{ fontSize: '18px' }}>{item.emoji || '📁'}</span>}
                  </div>
                  {item.badge && (
                    <span className="badge" style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '3px 9px',
                      borderRadius: '99px',
                      background: 'rgba(255, 255, 255, 0.18)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.28)'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', margin: '0 0 6px 0', lineHeight: '1.3', letterSpacing: '-0.2px' }}>
                  {item.label}
                </h3>
                <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.82)', margin: 0, lineHeight: '1.45', minHeight: '34px', fontWeight: '500' }}>
                  {item.description || `Manage and view ${item.label.toLowerCase()} entries`}
                </p>
              </div>

              <div style={{
                marginTop: '16px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                fontWeight: '800',
                color: '#ffffff'
              }}>
                <span>{item.actionLabel || 'Manage'}</span>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.28)'
                }}>
                  <ChevronRight size={14} className="card-arrow" style={{ transition: 'transform 0.2s ease', color: '#ffffff' }} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
