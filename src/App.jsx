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
  const [toasts, setToasts] = useState([]);

  // State kanggo deteksi layar HP secara real-time
  const [isMobile, setIsMobile] = useState(false);

  // Helper kanggo nampilake toast notification
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto hapus sawise 4 detik
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

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
    const statusText = nilai === 1 ? 'BUKA' : 'TUTUP';
    if (dataTerpilih.isFirebase) {
      set(ref(db, 'servo'), nilai)
        .then(() => {
          showToast(`Berhasil mengubah status servo ${dataTerpilih.id} menjadi ${statusText}!`, 'success');
        })
        .catch((err) => {
          showToast(`Gagal mengubah status servo: ${err.message}`, 'error');
        });
    } else {
      showToast(`Simulasi: Mengirim perintah servo ${statusText} ke ${dataTerpilih.id}`, 'info');
    }
  };

  const statusColor = dataTerpilih.kapasitas > 80 ? '#ff4757' : dataTerpilih.kapasitas > 50 ? '#ffa502' : '#00e676';

  // --- DYNAMIC RESPONSIVE STYLES ---

  return (
    <div className="app-container">
      <div className="content-wrapper">
        
        {/* HEADER */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1 className="main-title">
              <span style={{ color: '#ffffff' }}>SMART TRASH</span> <span style={{ color: '#38bdf8' }}>PRO</span>
            </h1>
            <p className="kelompok-text">KELOMPOK 4 • T4F D3 TEKNOLOGI INFORMASI</p>
            <div className="online-badge">
              <span className="pulsing-dot"></span> SYSTEM LIVE
            </div>
          </div>

          {/* BAR PENCARIAN */}
          <div className="search-box-container">
            <span className="search-icon-svg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
              </svg>
            </span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik: TRASH-01, TRASH-02, TRASH-03" 
              className="search-input-field"
            />
          </div>
        </header>

        {/* SUB-INFO INDIKATOR ID */}
        <div className="indicator-label" style={{ textAlign: isMobile ? 'center' : 'left' }}>
          Menampilkan Data: <strong style={{color: '#38bdf8'}}>{dataTerpilih.id}</strong> ({dataTerpilih.lokasi})
        </div>

        {/* UTAMA GRID */}
        <main className="dashboard-grid">
          <section className="dashboard-card">
            <p className="card-label">KAPASITAS ({dataTerpilih.id})</p>
            <div className="capacity-value notranslate" translate="no" style={{ color: statusColor, fontSize: isMobile ? '4.2rem' : '7rem' }}>
              {dataTerpilih.kapasitas}%
            </div>
            <div className="progress-track">
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${Math.min(dataTerpilih.kapasitas, 100)}%`, 
                  backgroundColor: statusColor 
                }}
              ></div>
            </div>
            <div className="card-status-text" style={{ color: statusColor }}>
              {dataTerpilih.kapasitas > 80 ? '⚠️ PENUH' : '✅ TERSEDIA'}
            </div>
          </section>

          <section className="dashboard-card">
            <p className="card-label">KONTROL SISTEM</p>
            
            <div className={`servo-icon-wrapper ${dataTerpilih.servo === 1 ? 'open' : 'closed'}`}>
              {dataTerpilih.servo === 1 ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="80" height="80">
                  <path d="M14 16 L32 6 L50 14 L14 16" fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 22 L21 54 C21 56, 23 58, 25 58 L39 58 C41 58, 43 56, 43 54 L46 22 Z" fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinejoin="round"/>
                  <line x1="26" y1="28" x2="28" y2="52" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="32" y1="28" x2="32" y2="52" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="38" y1="28" x2="36" y2="52" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M29 58 L35 58 L37 61 L27 61 Z" fill="none" stroke="#10b981" strokeWidth="2"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="80" height="80">
                  <path d="M14 18 L50 18 L46 14 L18 14 Z" fill="none" stroke="#f43f5e" strokeWidth="3.5" strokeLinecap="round"/>
                  <path d="M28 14 L36 14 L35 11 L29 11 Z" fill="none" stroke="#f43f5e" strokeWidth="2"/>
                  <path d="M16 20 L20 54 C20 56, 22 58, 24 58 L40 58 C42 58, 44 56, 44 54 L48 20 Z" fill="none" stroke="#f43f5e" strokeWidth="3.5" strokeLinejoin="round"/>
                  <line x1="25" y1="26" x2="27" y2="52" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="32" y1="26" x2="32" y2="52" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="39" y1="26" x2="37" y2="52" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M29 58 L35 58 L37 61 L27 61 Z" fill="none" stroke="#f43f5e" strokeWidth="2"/>
                </svg>
              )}
            </div>

            <div className={`status-badge ${dataTerpilih.servo === 1 ? 'open' : 'closed'}`}>
              {dataTerpilih.servo === 1 ? 'TERBUKA' : 'TERTUTUP'}
            </div>
            
            <div className="control-btn-group">
              <button onClick={() => handleKontrol(1)} className="control-btn control-btn-open">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path fillRule="evenodd" d="M14.5 1A1.5 1.5 0 0 0 13 2.5V4H7V2.5A1.5 1.5 0 0 0 5.5 1h-1A1.5 1.5 0 0 0 3 2.5V4h-.5A1.5 1.5 0 0 0 1 5.5v11A1.5 1.5 0 0 0 2.5 18h15a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 17.5 4H17V2.5A1.5 1.5 0 0 0 15.5 1h-1Zm-2 3.5v-2h-3v2h3Z" clipRule="evenodd" />
                </svg>
                Membuka
              </button>
              <button onClick={() => handleKontrol(0)} className="control-btn control-btn-close">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
                Menutup
              </button>
            </div>
          </section>
        </main>
        <footer className="dashboard-footer">© 2026 Smart City IoT • Universitas Brawijaya</footer>
      </div>

      {/* TOAST CONTAINER FOR DYNAMIC ALERTS */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item toast-${toast.type}`}>
            <div className="toast-icon">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'info' && 'i'}
            </div>
            <div className="toast-content">
              <div className="toast-title">
                {toast.type === 'success' && 'BERHASIL'}
                {toast.type === 'error' && 'GAGAL'}
                {toast.type === 'info' && 'SIMULASI'}
              </div>
              <div className="toast-message">{toast.message}</div>
            </div>
            <button 
              className="toast-close" 
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            >
              &times;
            </button>
            <div className="toast-progress-bar"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;