import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { ref, onValue, set } from 'firebase/database';

function App() {
  const [kapasitas, setKapasitas] = useState(0);
  const [statusServo, setStatusServo] = useState(0);

  useEffect(() => {
    onValue(ref(db, 'kapasitas'), (snap) => setKapasitas(snap.val() || 0));
    onValue(ref(db, 'servo'), (snap) => setStatusServo(snap.val() || 0));
  }, []);

  const handleKontrol = (nilai) => set(ref(db, 'servo'), nilai);
  const statusColor = kapasitas > 80 ? '#ff4757' : kapasitas > 50 ? '#ffa502' : '#00e676';

  return (
    <div style={containerStyle}>
      <div style={contentWrapper}>
        <header style={headerStyle}>
          <h1 style={mainTitle}>
            <span style={{ color: '#ffffff' }}>SMART TRASH</span> <span style={{ color: '#38bdf8' }}>PRO</span>
          </h1>
          <p style={kelompokText}>KELOMPOK 4 • T4F D3 TEKNOLOGI INFORMASI</p>
          <div style={onlineBadge}>
            <span style={pulsingDot}></span> SYSTEM LIVE
          </div>
        </header>

        <main style={mainGrid}>
          <section style={fixedCard}>
            <p style={cardLabel}>KAPASITAS</p>
            <div style={{ ...valueDisplay, color: statusColor }}>{kapasitas}%</div>
            <div style={progressBase}>
              <div style={{ ...progressFill, width: `${kapasitas}%`, backgroundColor: statusColor }}></div>
            </div>
            <p style={{ ...statusText, color: statusColor }}>{kapasitas > 80 ? '⚠️ FULL' : '✅ AVAILABLE'}</p>
          </section>

          <section style={fixedCard}>
            <p style={cardLabel}>KONTROL SISTEM</p>
            <div style={iconBox}>{statusServo === 1 ? '🔓' : '🔒'}</div>
            <div style={statusBadge(statusServo)}>{statusServo === 1 ? 'OPEN' : 'CLOSED'}</div>
            <div style={buttonGroup}>
              <button onClick={() => handleKontrol(1)} style={btnOpen}>Open</button>
              <button onClick={() => handleKontrol(0)} style={btnClose}>Close</button>
            </div>
          </section>
        </main>
        <footer style={footerStyle}>© 2026 Smart City IoT • Universitas Brawijaya</footer>
      </div>
    </div>
  );
}

const containerStyle = {
  width: '100vw', minHeight: '100vh', background: '#040b1a', color: '#ffffff',
  fontFamily: "sans-serif", margin: 0, padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center'
};

const contentWrapper = { width: '90%', maxWidth: '1000px', padding: '40px 10px' };

const headerStyle = { 
  textAlign: 'center', 
  marginBottom: '60px', 
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const mainTitle = { fontSize: 'clamp(2.2rem, 8vw, 3.2rem)', fontWeight: '900', margin: 0 };

const kelompokText = {
  fontSize: '1rem',
  color: '#a1a1aa',
  letterSpacing: '3px',
  marginTop: '20px',
  fontWeight: 'bold'
};

const onlineBadge = {
  display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px',
  background: 'rgba(0, 230, 118, 0.1)', borderRadius: '100px', color: '#00e676',
  fontSize: '0.75rem', fontWeight: 'bold', marginTop: '20px'
};

const pulsingDot = { width: '8px', height: '8px', background: '#00e676', borderRadius: '50%' };

const mainGrid = { 
  display: 'grid', 
  width: '100%', 
  gap: '30px', 
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
};

const fixedCard = {
  background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '35px', padding: '30px', textAlign: 'center', display: 'flex',
  flexDirection: 'column', justifyContent: 'space-between', minHeight: '400px'
};

const cardLabel = { fontSize: '0.75rem', color: '#64748b', letterSpacing: '2px', fontWeight: 'bold' };
const valueDisplay = { fontSize: '5.5rem', fontWeight: '900', lineHeight: 1 };
const iconBox = { fontSize: '5rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const progressBase = { width: '100%', height: '10px', background: '#1e293b', borderRadius: '10px' };
const progressFill = { height: '100%', transition: '1s' };
const statusText = { fontSize: '0.9rem', fontWeight: 'bold' };

const statusBadge = (s) => ({
  padding: '6px 16px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold',
  background: s === 1 ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 71, 87, 0.1)',
  color: s === 1 ? '#00e676' : '#ff4757', marginBottom: '15px'
});

const buttonGroup = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', width: '100%' };
const baseBtn = { padding: '16px', border: 'none', borderRadius: '15px', color: 'white', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' };
const btnOpen = { ...baseBtn, background: '#22c55e' };
const btnClose = { ...baseBtn, background: '#ef4444' };
const footerStyle = { marginTop: '50px', color: '#334155', fontSize: '0.8rem', textAlign: 'center' };

export default App;