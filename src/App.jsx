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

// --- CSS IN JS YANG SUDAH DIRAPIKAN TOTAL ---
const containerStyle = {
  width: '100%',             
  minHeight: '100vh',
  background: '#040b1a',     
  color: '#ffffff',
  fontFamily: "sans-serif",
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',      
  justifyContent: 'center',   // Menjaga seluruh dashboard seimbang di tengah layar (vertikal)
  overflowX: 'hidden',
  boxSizing: 'border-box'
};

const contentWrapper = { 
  width: '100%', 
  maxWidth: '950px',         // Lebar maksimal grid diperkecil sedikit agar visualnya lebih padat
  padding: '40px 24px',    
  boxSizing: 'border-box',
  display: 'flex',           
  flexDirection: 'column',
  alignItems: 'center'
};

const headerStyle = { 
  textAlign: 'center', 
  marginBottom: '40px', 
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%'
};

const mainTitle = { 
  fontSize: 'clamp(2.2rem, 5vw, 3rem)', 
  fontWeight: '900', 
  margin: '0 0 12px 0',       // Mengurangi margin bawah judul agar teks kelompok tidak terlalu jauh
  letterSpacing: '1px'
};

const kelompokText = {
  fontSize: '0.95rem',
  color: '#a1a1aa',
  letterSpacing: '2px',
  margin: '0 0 16px 0',       // Mengunci jarak yang rapi menuju badge live
  fontWeight: '600',
  textAlign: 'center'
};

const onlineBadge = {
  display: 'inline-flex', 
  alignItems: 'center', 
  gap: '8px', 
  padding: '6px 14px',
  background: 'rgba(0, 230, 118, 0.1)', 
  borderRadius: '100px', 
  color: '#00e676',
  fontSize: '0.75rem', 
  fontWeight: 'bold', 
  margin: '0'                 // Reset margin otomatis agar konstan di tengah
};

const pulsingDot = { width: '8px', height: '8px', background: '#00e676', borderRadius: '50%' };

const mainGrid = { 
  display: 'grid', 
  width: '100%', 
  gap: '30px', 
  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
  boxSizing: 'border-box',
  alignItems: 'stretch'       // MEMAKSA kedua kartu memiliki tinggi yang sama persis
};

const fixedCard = {
  background: 'rgba(255, 255, 255, 0.03)', 
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '28px',       // Kelengkungan sudut diperhalus agar lebih modern
  padding: '35px 30px', 
  textAlign: 'center', 
  display: 'flex',
  flexDirection: 'column', 
  justifyContent: 'space-between', // Membagi ruang atas-tengah-bawah secara adil
  boxSizing: 'border-box'
};

const cardLabel = { 
  fontSize: '0.75rem', 
  color: '#64748b', 
  letterSpacing: '2px', 
  fontWeight: '700',
  margin: '0 0 20px 0' 
};

const valueDisplay = { 
  fontSize: '5.5rem', 
  fontWeight: '900', 
  lineHeight: '1', 
  flex: '1',                  // Mengambil sisa ruang tengah agar sejajar secara horizontal
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const iconBox = { 
  fontSize: '4.5rem', 
  flex: '1', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center' 
};

const progressBase = { 
  width: '100%', 
  height: '8px',              // Ketebalan progress bar dibuat lebih tipis & clean
  background: '#1e293b', 
  borderRadius: '10px', 
  overflow: 'hidden',
  margin: '20px 0'
};

const progressFill = { height: '100%', transition: '0.8s ease-out' };

const statusText = { 
  fontSize: '0.85rem', 
  fontWeight: '700', 
  margin: '10px 0 0 0',
  letterSpacing: '0.5px'
};

const statusBadge = (s) => ({
  width: '100%',              // Dibuat lebar penuh agar sejajar rapi dengan tombol di bawahnya
  padding: '10px 0', 
  borderRadius: '12px', 
  fontSize: '0.9rem', 
  fontWeight: '700',
  background: s === 1 ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 71, 87, 0.08)',
  color: s === 1 ? '#00e676' : '#ff4757', 
  marginBottom: '16px', 
  boxSizing: 'border-box'
});

const buttonGroup = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', width: '100%' };
const baseBtn = { padding: '14px', border: 'none', borderRadius: '12px', color: 'white', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', transition: '0.2s' };
const btnOpen = { ...baseBtn, background: '#22c55e' };
const btnClose = { ...baseBtn, background: '#ef4444' };
const footerStyle = { marginTop: '60px', color: '#334155', fontSize: '0.75rem', textAlign: 'center', width: '100%', letterSpacing: '0.5px' };

export default App;