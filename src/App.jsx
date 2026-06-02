import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

// Konfigurasi Firebase asli
const firebaseConfig = {
  apiKey: "AIzaSyDA9qLczJ-mwqhelB0pTzE9SybeXBDuXI1",
  authDomain: "smarttrash-5e85a.firebaseapp.com",
  databaseURL: "https://smarttrash-5e85a-default-rtdb.firebaseio.com",
  projectId: "smarttrash-5e85a",
  storageBucket: "smarttrash-5e85a.firebasestorage.app",
  messagingSenderId: "716460196564",
  appId: "1:716460196564:web:a088a9db9c958ff44f141",
  measurementId: "G-57MDRKQC69"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [firebaseKapasitas, setFirebaseKapasitas] = useState(0); 
  const [firebaseServo, setFirebaseServo] = useState(0); 

  // State kanggo deteksi layar HP secara real-time
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 

    const kapasitasRef = ref(db, 'kapasitas');
    const unsubscribeKapasitas = onValue(kapasitasRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null) setFirebaseKapasitas(Number(data));
    });

    const servoRef = ref(db, 'servo');
    const unsubscribeServo = onValue(servoRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null) setFirebaseServo(Number(data));
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      unsubscribeKapasitas();
      unsubscribeServo();
    };
  }, []);

  const daftarTempatSampah = [
    {
      id: 'TRASH-01',
      lokasi: 'LAB IoT - UTAMA',
      kapasitas: firebaseKapasitas, 
      servo: firebaseServo,         
      isFirebase: true
    },
    {
      id: 'TRASH-02',
      lokasi: 'KORIDOR GEDUNG D3',
      kapasitas: 45, 
      servo: 0,
      isFirebase: false
    },
    {
      id: 'TRASH-03',
      lokasi: 'LAB KOMPUTER 2',
      kapasitas: 85, 
      servo: 1,
      isFirebase: false
    }
  ];

  const dataTerpilih = daftarTempatSampah.find(
    trash => trash.id.toLowerCase() === searchQuery.trim().toLowerCase()
  ) || daftarTempatSampah[0]; 

  const handleKontrol = (nilai) => {
    if (dataTerpilih.isFirebase) {
      set(ref(db, 'servo'), nilai)
        .then(() => console.log("Firebase servo diupdate ke: " + nilai))
        .catch((err) => console.error(err));
    } else {
      alert(`Simulasi: Mengirim perintah servo ${nilai === 1 ? 'BUKA' : 'TUTUP'} ke ${dataTerpilih.id}`);
    }
  };

  const statusColor = dataTerpilih.kapasitas > 80 ? '#ff4757' : dataTerpilih.kapasitas > 50 ? '#ffa502' : '#00e676';

  // --- DYNAMIC RESPONSIVE STYLES ---
  const dynamicHeaderStyle = {
    ...headerStyle,
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'stretch' : 'flex-start',
    gap: isMobile ? '24px' : '0px',
    marginBottom: isMobile ? '30px' : '20px'
  };

  const dynamicSearchInput = {
    ...searchInput,
    width: isMobile ? '100%' : '310px'
  };

  const dynamicMainGrid = {
    ...mainGrid,
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: isMobile ? '24px' : '40px'
  };

  const dynamicFixedCard = {
    ...fixedCard,
    padding: isMobile ? '30px 20px' : '50px 40px',
    minHeight: isMobile ? 'auto' : '440px'
  };

  const dynamicValueDisplay = {
    ...valueDisplay,
    fontSize: isMobile ? '4.5rem' : '6.5rem',
    margin: isMobile ? '20px 0' : '0'
  };

  // Iki sing wingi tugel cok, saiki wes jangkep string-e!
  const statusBadgeStyle = {
    width: '100%',
    padding: '12px 0',
    borderRadius: '12px',
    fontSize: '0.95rem',
    fontWeight: '700',
    background: dataTerpilih.servo === 1 ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 71, 87, 0.08)',
    color: dataTerpilih.servo === 1 ? '#00e676' : '#ff4757',
    marginBottom: '20px',
    boxSizing: 'border-box'
  };

  return (
    <div style={containerStyle}>
      <div style={contentWrapper}>
        
        {/* HEADER */}
        <header style={dynamicHeaderStyle}>
          <div style={headerLeft}>
            <h1 style={{...mainTitle, fontSize: isMobile ? '2rem' : '2.6rem'}}>
              <span style={{ color: '#ffffff' }}>SMART TRASH</span> <span style={{ color: '#38bdf8' }}>PRO</span>
            </h1>
            <p style={kelompokText}>KELOMPOK 4 • T4F D3 TEKNOLOGI INFORMASI</p>
            <div style={onlineBadge}>
              <span style={pulsingDot}></span> SYSTEM LIVE
            </div>
          </div>

          {/* BAR PENCARIAN */}
          <div style={{...searchContainer, width: isMobile ? '100%' : 'auto'}}>
            <span style={searchIcon}>🔍</span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik: TRASH-01, TRASH-02, TRASH-03" 
              style={dynamicSearchInput}
            />
          </div>
        </header>

        {/* SUB-INFO INDIKATOR ID */}
        <div style={{...idIndicator, textAlign: isMobile ? 'center' : 'left'}}>
          Menampilkan Data: <strong style={{color: '#38bdf8'}}>{dataTerpilih.id}</strong> ({dataTerpilih.lokasi})
        </div>

        {/* UTAMA GRID */}
        <main style={dynamicMainGrid}>
          <section style={dynamicFixedCard}>
            <p style={cardLabel}>KAPASITAS ({dataTerpilih.id})</p>
            <div style={{ ...dynamicValueDisplay, color: statusColor }}>{dataTerpilih.kapasitas}%</div>
            <div style={progressBase}>
              <div style={{ ...progressFill, width: `${Math.min(dataTerpilih.kapasitas, 100)}%`, backgroundColor: statusColor }}></div>
            </div>
            <p style={{ ...statusText, color: statusColor }}>{dataTerpilih.kapasitas > 80 ? '⚠️ FULL' : '✅ AVAILABLE'}</p>
          </section>

          <section style={dynamicFixedCard}>
            <p style={cardLabel}>KONTROL SISTEM</p>
            
            <div style={iconBox}>
              {dataTerpilih.servo === 1 ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={isMobile ? "80" : "100"} height={isMobile ? "80" : "100"}>
                  <path d="M14 16 L32 6 L50 14 L14 16" fill="none" stroke="#00e676" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 22 L21 54 C21 56, 23 58, 25 58 L39 58 C41 58, 43 56, 43 54 L46 22 Z" fill="none" stroke="#00e676" strokeWidth="3" strokeLinejoin="round"/>
                  <line x1="26" y1="28" x2="28" y2="52" stroke="#00e676" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="32" y1="28" x2="32" y2="52" stroke="#00e676" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="38" y1="28" x2="36" y2="52" stroke="#00e676" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M29 58 L35 58 L37 61 L27 61 Z" fill="none" stroke="#00e676" strokeWidth="2"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={isMobile ? "80" : "100"} height={isMobile ? "80" : "100"}>
                  <path d="M14 18 L50 18 L46 14 L18 14 Z" fill="none" stroke="#ff4757" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M28 14 L36 14 L35 11 L29 11 Z" fill="none" stroke="#ff4757" strokeWidth="2"/>
                  <path d="M16 20 L20 54 C20 56, 22 58, 24 58 L40 58 C42 58, 44 56, 44 54 L48 20 Z" fill="none" stroke="#ff4757" strokeWidth="3" strokeLinejoin="round"/>
                  <line x1="25" y1="26" x2="27" y2="52" stroke="#ff4757" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="32" y1="26" x2="32" y2="52" stroke="#ff4757" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="39" y1="26" x2="37" y2="52" stroke="#ff4757" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M29 58 L35 58 L37 61 L27 61 Z" fill="none" stroke="#ff4757" strokeWidth="2"/>
                </svg>
              )}
            </div>

            <div style={statusBadgeStyle}>{dataTerpilih.servo === 1 ? 'TERBUKA' : 'TERTUTUP'}</div>
            <div style={buttonGroup}>
              <button onClick={() => handleKontrol(1)} style={btnOpen}>Membuka</button>
              <button onClick={() => handleKontrol(0)} style={btnClose}>Menutup</button>
            </div>
          </section>
        </main>
        <footer style={{...footerStyle, marginTop: isMobile ? '50px' : '100px'}}>© 2026 Smart City IoT • Universitas Brawijaya</footer>
      </div>
    </div>
  );
}

// --- CSS STYLES BASE ---
const containerStyle = { width: '100vw', minHeight: '100vh', background: '#040b1a', color: '#ffffff', fontFamily: "sans-serif", margin: 0, padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflowX: 'hidden', boxSizing: 'border-box' };
const contentWrapper = { width: '100%', maxWidth: '1300px', padding: '20px 24px 60px 24px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', width: '100%', flexWrap: 'nowrap', boxSizing: 'border-box' };
const headerLeft = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' };
const mainTitle = { fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '1px' };
const kelompokText = { fontSize: '0.85rem', color: '#a1a1aa', letterSpacing: '2px', margin: '0 0 16px 0', fontWeight: '600' };
const onlineBadge = { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(0, 230, 118, 0.1)', borderRadius: '100px', color: '#00e676', fontSize: '0.75rem', fontWeight: 'bold' };
const pulsingDot = { width: '8px', height: '8px', background: '#00e676', borderRadius: '50%' };
const searchContainer = { position: 'relative', display: 'flex', alignItems: 'center', boxSizing: 'border-box' };
const searchIcon = { position: 'absolute', left: '14px', fontSize: '14px' };
const searchInput = { background: 'rgba(255, 255, 255, 0.05)', border: '1px solid #38bdf8', borderRadius: '10px', padding: '12px 15px 12px 42px', color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
const idIndicator = { width: '100%', marginBottom: '30px', fontSize: '0.95rem', color: '#a1a1aa' };
const mainGrid = { display: 'grid', width: '100%', boxSizing: 'border-box' };
const fixedCard = { background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '28px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' };
const cardLabel = { fontSize: '0.8rem', color: '#64748b', letterSpacing: '2px', fontWeight: '700', margin: '0 0 20px 0' };
const valueDisplay = { fontWeight: '900', lineHeight: '1', flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const iconBox = { flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0' }; 
const progressBase = { width: '100%', height: '10px', background: '#1e293b', borderRadius: '10px', overflow: 'hidden', margin: '25px 0' };
const progressFill = { height: '100%', transition: '0.8s ease-out' };
const statusText = { fontSize: '0.9rem', fontWeight: '700', margin: '10px 0 0 0', letterSpacing: '0.5px' };
const buttonGroup = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%' };
const baseBtn = { padding: '16px', border: 'none', borderRadius: '12px', color: 'white', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', transition: '0.2s' };
const btnOpen = { ...baseBtn, background: '#00e676' };
const btnClose = { ...baseBtn, background: '#ff4757' };
const footerStyle = { color: '#334155', fontSize: '0.75rem', textAlign: 'center', width: '100%' };

export default App;