import React from 'react';
import { ChevronRight } from 'lucide-react';
import { filterAllowedCards } from '../services/permissionService';

export function SectionLandingPage({ title, subtitle, icon: HeaderIcon, items, onSelectModule, currentUser }) {
  const displayItems = currentUser ? filterAllowedCards(currentUser, items) : items;
  const lower = title.toLowerCase();
  const theme = lower.includes('report') ? 'reports' : lower.includes('entr') ? 'entries' : lower.includes('quick') ? 'quick' : 'masters';

  return (
    <div className={`section-landing section-landing--${theme}`}>
      <div className="crud-header-card section-landing-header">
        <div className="crud-header-left">
          {HeaderIcon && (
            <div className="crud-header-icon crud-header-icon--solid">
              <HeaderIcon size={22} />
            </div>
          )}
          <div>
            <h2 className="crud-header-title">{title}</h2>
            <p className="crud-header-sub">{subtitle}</p>
          </div>
        </div>
        <div className="section-count">{displayItems.length} modules</div>
      </div>

      <div className="section-landing-grid">
        {displayItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button type="button" key={item.id} onClick={() => onSelectModule(item.id)} className="landing-card">
              <div className="landing-card-top">
                <div className="landing-card-icon">
                  {IconComponent ? <IconComponent size={20} /> : <span>{item.emoji || '📁'}</span>}
                </div>
                {item.badge && <span className="landing-card-badge">{item.badge}</span>}
              </div>
              <h3 className="landing-card-title">{item.label}</h3>
              <p className="landing-card-desc">{item.description || `Manage and view ${item.label.toLowerCase()} entries`}</p>
              <div className="landing-card-foot">
                <span>{item.actionLabel || 'Open'}</span>
                <ChevronRight size={15} className="card-arrow" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
