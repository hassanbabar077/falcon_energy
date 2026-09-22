import React, { useEffect, useState } from 'react';
import { dbService } from '../services/db';

export function SplashScreen({ onFinish }) {
  const company = dbService.getCompanyInfo();
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('logo'); // logo → tagline → ready

  useEffect(() => {
    // Loading progress bar (3 seconds total)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 3.4;
      });
    }, 100);

    // Phase transitions optimized for 3 seconds
    const t1 = setTimeout(() => setPhase('tagline'), 100);
    const t2 = setTimeout(() => setPhase('ready'), 2100);
    const t3 = setTimeout(() => onFinish(), 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'linear-gradient(135deg, #0f172a 0%, #0d2a2a 40%, #042f2e 70%, #0f172a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Ambient Glow Circles */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-5%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(13,148,136,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        right: '-5%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Animated grid overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(13,148,136,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(13,148,136,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      {/* Main Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
        position: 'relative',
        animation: 'splashFadeIn 0.8s ease-out',
      }}>

        {/* Logo / Icon */}
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '28px',
          background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 60px rgba(13,148,136,0.5), 0 20px 60px rgba(0,0,0,0.4)',
          animation: 'logoFloat 3s ease-in-out infinite',
          flexShrink: 0,
        }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 3h15v13H1z"/>
            <path d="M16 8h4l3 3v5h-7V8z"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        </div>

        {/* Company Name */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: '42px',
            fontWeight: '900',
            color: '#f8fafc',
            letterSpacing: '-1px',
            lineHeight: 1.1,
            margin: 0,
            textShadow: '0 4px 30px rgba(0,0,0,0.3)',
          }}>
            {company.name}
          </h1>

          <div style={{
            display: 'inline-block',
            marginTop: '10px',
            padding: '4px 16px',
            borderRadius: '999px',
            background: 'rgba(13,148,136,0.15)',
            border: '1px solid rgba(13,148,136,0.4)',
            color: '#2dd4bf',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            opacity: phase === 'logo' ? 0 : 1,
            transition: 'opacity 0.8s ease',
          }}>
            {company.system_name || 'Transport Management System'}
          </div>
        </div>

        {/* Divider */}
        <div style={{
          width: '80px',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #0d9488, transparent)',
          borderRadius: '2px',
          opacity: phase === 'logo' ? 0 : 1,
          transition: 'opacity 0.8s ease 0.2s',
        }} />

        {/* Info Row */}
        <div style={{
          display: 'flex',
          gap: '32px',
          opacity: phase === 'logo' ? 0 : 1,
          transition: 'opacity 0.8s ease 0.4s',
        }}>
          {[
            { label: 'Version', value: '12.0 Enterprise' },
            { label: 'Database', value: 'SQLite / Offline' },
            { label: 'Fleet Modules', value: '28 Tables' },
          ].map(item => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div style={{ color: '#0d9488', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {item.label}
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: '600', marginTop: '2px' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '320px',
          height: '3px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '4px',
          overflow: 'hidden',
          opacity: phase === 'logo' ? 0 : 1,
          transition: 'opacity 0.5s ease',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(progress, 100)}%`,
            background: 'linear-gradient(90deg, #0d9488, #14b8a6, #2dd4bf)',
            borderRadius: '4px',
            transition: 'width 0.1s linear',
            boxShadow: '0 0 12px rgba(13,148,136,0.7)',
          }} />
        </div>

        {/* Status Text */}
        <div style={{
          color: '#64748b',
          fontSize: '11px',
          fontWeight: '500',
          letterSpacing: '1px',
          opacity: phase === 'logo' ? 0 : 1,
          transition: 'opacity 0.5s ease',
        }}>
          {phase === 'ready'
            ? '✓  All systems ready — launching...'
            : 'Initializing offline database...'}
        </div>
      </div>

      {/* Bottom footer */}
      <div style={{
        position: 'absolute',
        bottom: '28px',
        color: '#334155',
        fontSize: '10px',
        fontWeight: '500',
        letterSpacing: '1px',
        textTransform: 'uppercase',
      }}>
        Noor LPG • Enterprise Transport Suite • {new Date().getFullYear()}
      </div>

      <style>{`
        @keyframes splashFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
