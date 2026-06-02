import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

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

function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(value);
  useEffect(() => {
    if (displayValue === value) return;
    const step = value > displayValue ? 1 : -1;
    const diff = Math.abs(value - displayValue);
    const delay = diff > 20 ? 10 : 30;
    const interval = setInterval(() => {
      setDisplayValue(prev => {
        if (prev === value) {
          clearInterval(interval);
          return prev;
        }
        return prev + step;
      });
    }, delay);
    return () => clearInterval(interval);
  }, [value, displayValue]);
  return <span>{displayValue}</span>;
}

function App() {
  
  const [activeTab, setActiveTab] = useState('overview'); 
  const [selectedBinId, setSelectedBinId] = useState('TRASH-01');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);
  const [showNotifBox, setShowNotifBox] = useState(false);
  
  const ambientRef = useRef(null);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'auto';
  });

  const [firebaseKapasitas, setFirebaseKapasitas] = useState(0); 
  const [firebaseServo, setFirebaseServo] = useState(0); 

  const [simKapasitas2, setSimKapasitas2] = useState(45);
  const [simServo2, setSimServo2] = useState(0);
  const [simKapasitas3, setSimKapasitas3] = useState(85);
  const [simServo3, setSimServo3] = useState(1);

  const [simulasiAktif, setSimulasiAktif] = useState(true);

  const [lastEmptied1, setLastEmptied1] = useState(new Date(Date.now() - 1000 * 60 * 60 * 2));
  const [lastEmptied2, setLastEmptied2] = useState(new Date(Date.now() - 1000 * 60 * 45));
  const [lastEmptied3, setLastEmptied3] = useState(new Date(Date.now() - 1000 * 60 * 60 * 5));

  const [logs, setLogs] = useState([
    { time: '22:00:01', type: 'info', msg: 'Smart Trash Pro System Initialized.' },
    { time: '22:00:03', type: 'success', msg: 'FIREBASE: Connected to Realtime Database successfully.' },
    { time: '22:00:04', type: 'info', msg: 'TRASH-01: Real-time sensor monitoring active.' },
    { time: '22:00:05', type: 'info', msg: 'TRASH-02: Simulated monitoring engine initialized.' },
    { time: '22:00:06', type: 'info', msg: 'TRASH-03: Simulated monitoring engine initialized.' }
  ]);
  const [logFilter, setLogFilter] = useState('all');

  const terminalEndRef = useRef(null);

  const getFormattedTime = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  };

  const getTimeAgo = (date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} menit lalu`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} jam ${diffMins % 60} mnt lalu`;
  };

  const addLog = (msg, type = 'info') => {
    const newLog = {
      time: getFormattedTime(),
      type,
      msg
    };
    setLogs((prev) => [...prev, newLog].slice(-100)); 
  };

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const daftarTempatSampah = [
    {
      id: 'TRASH-01',
      lokasi: 'LAB IoT - UTAMA',
      kapasitas: firebaseKapasitas, 
      servo: firebaseServo,         
      isFirebase: true,
      lastEmptied: lastEmptied1
    },
    {
      id: 'TRASH-02',
      lokasi: 'KORIDOR GEDUNG D3',
      kapasitas: simKapasitas2, 
      servo: simServo2,
      isFirebase: false,
      lastEmptied: lastEmptied2
    },
    {
      id: 'TRASH-03',
      lokasi: 'LAB KOMPUTER 2',
      kapasitas: simKapasitas3, 
      servo: simServo3,
      isFirebase: false,
      lastEmptied: lastEmptied3
    }
  ];

  const dataTerpilih = daftarTempatSampah.find(
    trash => trash.id === selectedBinId
  ) || daftarTempatSampah[0];

  const hasWarning = daftarTempatSampah.some(bin => bin.kapasitas > 90);

  useEffect(() => {
    
    const kapasitasRef = ref(db, 'kapasitas');
    const unsubscribeKapasitas = onValue(kapasitasRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null) {
        const val = Number(data);
        setFirebaseKapasitas(val);
        addLog(`TRASH-01: Kapasitas terdeteksi real-time sebesar ${val}%`, val > 80 ? 'warning' : 'info');
      }
    });

    const servoRef = ref(db, 'servo');
    const unsubscribeServo = onValue(servoRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null) {
        const val = Number(data);
        setFirebaseServo(val);
        addLog(`TRASH-01: Pintu Servo terdeteksi ${val === 1 ? 'TERBUKA' : 'TERTUTUP'}`, 'info');
      }
    });

    return () => {
      unsubscribeKapasitas();
      unsubscribeServo();
    };
  }, []);

  useEffect(() => {
    if (!simulasiAktif) return;

    const interval = setInterval(() => {
      
      setSimKapasitas2((prev) => {
        const delta = Math.floor(Math.random() * 5) - 1; 
        const next = Math.max(10, Math.min(98, prev + delta));
        if (delta > 0 && Math.random() > 0.7) {
          addLog(`TRASH-02: Terdeteksi aktivitas pembuangan sampah. Kapasitas: ${next}%`, next > 80 ? 'warning' : 'info');
        }
        return next;
      });

      setSimKapasitas3((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2; 
        const next = Math.max(15, Math.min(99, prev + delta));
        if (delta > 0 && Math.random() > 0.8) {
          addLog(`TRASH-03: Sensor berat mendeteksi peningkatan volume. Kapasitas: ${next}%`, next > 80 ? 'warning' : 'info');
        }
        return next;
      });

      const eventChance = Math.random();
      if (eventChance > 0.8) {
        const randomEvents = [
          { type: 'info', msg: 'SYSTEM: Sinkronisasi status IoT Nodes berhasil dilakukan.' },
          { type: 'info', msg: 'ROUTER: Kecepatan ping gateway IoT 24ms (Stabil).' },
          { type: 'success', msg: 'DATABASE: Backup cache logs disimpan ke local storage.' }
        ];
        const selectedEvent = randomEvents[Math.floor(Math.random() * randomEvents.length)];
        addLog(selectedEvent.msg, selectedEvent.type);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [simulasiAktif]);

  useEffect(() => {
    const applyTheme = (currentTheme) => {
      let resolvedTheme = currentTheme;
      if (currentTheme === 'auto') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      
      const root = document.documentElement;
      if (resolvedTheme === 'light') {
        root.classList.add('light-theme');
        root.classList.remove('dark-theme');
      } else {
        root.classList.add('dark-theme');
        root.classList.remove('light-theme');
      }
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);
    
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('auto');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  useEffect(() => {
    let mouseX = 0;
    let mouseY = 0;
    let ambientX = 0;
    let ambientY = 0;

    const handlePointerMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener('pointermove', handlePointerMove);

    let active = true;
    const updatePosition = () => {
      if (!active) return;

      ambientX += (mouseX - ambientX) * 0.25;
      ambientY += (mouseY - ambientY) * 0.25;

      if (ambientRef.current) {
        ambientRef.current.style.transform = `translate3d(${ambientX - 150}px, ${ambientY - 150}px, 0)`;
      }

      requestAnimationFrame(updatePosition);
    };

    requestAnimationFrame(updatePosition);

    return () => {
      active = false;
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    const match = daftarTempatSampah.find(
      bin => bin.id.toLowerCase() === query
    );
    if (match && match.id !== selectedBinId) {
      setSelectedBinId(match.id);
    }
  }, [searchQuery]);

  const handleSelectBin = (binId) => {
    setSelectedBinId(binId);
    setSearchQuery(binId);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const scrollContainer = document.querySelector('.main-scrollable-content');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }, [activeTab]);

  useEffect(() => {
    const feed = document.querySelector('.terminal-logs-feed');
    if (feed) {
      feed.scrollTop = feed.scrollHeight;
    }
  }, [logs, activeTab]);

  const handleKontrol = (binId, nilai) => {
    const statusText = nilai === 1 ? 'TERBUKA' : 'TERTUTUP';
    const targetBin = daftarTempatSampah.find(b => b.id === binId);
    
    if (!targetBin) return;

    if (targetBin.isFirebase) {
      set(ref(db, 'servo'), nilai)
        .then(() => {
          showToast(`Berhasil mengubah status servo ${binId} menjadi ${statusText}!`, nilai === 1 ? 'success' : 'closed');
          addLog(`USER: Mengirim perintah servo ${statusText} ke ${binId} (Sukses)`, 'success');
        })
        .catch((err) => {
          showToast(`Gagal mengubah status servo: ${err.message}`, 'error');
          addLog(`USER: Perintah servo ${statusText} ke ${binId} (Gagal: ${err.message})`, 'error');
        });
    } else {
      if (binId === 'TRASH-02') {
        setSimServo2(nilai);
      } else if (binId === 'TRASH-03') {
        setSimServo3(nilai);
      }
      showToast(`Simulasi: Mengubah servo ${binId} menjadi ${statusText}!`, nilai === 1 ? 'info' : 'closed');
      addLog(`USER: Simulasi perintah servo ${statusText} dikirim ke ${binId}`, 'info');
    }
  };

  const totalBinsCount = daftarTempatSampah.length;
  const warningBinsCount = daftarTempatSampah.filter(b => b.kapasitas > 80).length;
  const avgKapasitas = Math.round(daftarTempatSampah.reduce((acc, curr) => acc + curr.kapasitas, 0) / totalBinsCount);
  const openServosCount = daftarTempatSampah.filter(b => b.servo === 1).length;

  const getLiquidColor = (pct) => {
    if (pct > 80) return 'var(--status-red)';
    if (pct > 50) return 'var(--status-orange)';
    return 'var(--status-green)';
  };

  const currentLiquidColor = getLiquidColor(dataTerpilih.kapasitas);

  const filteredLogs = logs.filter(log => {
    if (logFilter === 'all') return true;
    return log.type === logFilter;
  });

  return (
    <div className="app-layout">
      <div className="ambient-particles"></div>
      
      <div className="cursor-glow-ambient" ref={ambientRef}></div>

      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2 className="brand-title">
            <span>SMART TRASH </span><span className="brand-pro">PRO</span>
          </h2>
          <p className="brand-sub">KELOMPOK 4 • Internet Of Thing</p>
        </div>

        <nav className="sidebar-menu">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="9" x="3" y="3" rx="1"/>
              <rect width="7" height="5" x="14" y="3" rx="1"/>
              <rect width="7" height="9" x="14" y="12" rx="1"/>
              <rect width="7" height="5" x="3" y="16" rx="1"/>
            </svg>
            <span>Dashboard Overview</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('analytics')} 
            className={`menu-item ${activeTab === 'analytics' ? 'active' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
            </svg>
            <span>Analytics & Tren</span>
          </button>

          <button 
            onClick={() => setActiveTab('logs')} 
            className={`menu-item ${activeTab === 'logs' ? 'active' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
              <path d="m12 3-1.912 5.886a1 1 0 0 1-.95.694H3l5.088 3.696a1 1 0 0 0 .363 1.118L6.538 20.28 12 16.5l5.462 3.78-1.913-5.886a1 1 0 0 0 .363-1.118L21 9.58h-6.138a1 1 0 0 1-.95-.694L12 3Z"/>
            </svg>
            <span>System Logs</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          
          <div className="theme-switcher-box">
            <span className="theme-label">Mode Tampilan</span>
            <div className="theme-options">
              <button 
                onClick={() => {
                  setTheme('light');
                  addLog('THEME: Tampilan diubah ke MODE TERANG.', 'info');
                  showToast('Mode Terang Diaktifkan', 'info');
                }}
                className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                Terang
              </button>
              <button 
                onClick={() => {
                  setTheme('dark');
                  addLog('THEME: Tampilan diubah ke MODE GELAP.', 'info');
                  showToast('Mode Gelap Diaktifkan', 'info');
                }}
                className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                Gelap
              </button>
              <button 
                onClick={() => {
                  setTheme('auto');
                  addLog('THEME: Tampilan diubah ke OTOMATIS (Sistem OS).', 'info');
                  showToast('Mode Otomatis Diaktifkan', 'info');
                }}
                className={`theme-btn ${theme === 'auto' ? 'active' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                Auto
              </button>
            </div>
          </div>

          <div className="sim-switch-box">
            <div className="sim-label-container">
              <span className="sim-title">Simulator IoT</span>
              <span className="sim-desc">Fluktuasi data tiruan</span>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={simulasiAktif} 
                onChange={(e) => {
                  setSimulasiAktif(e.target.checked);
                  addLog(`SYSTEM: Simulasi fluktuasi IoT ${e.target.checked ? 'DIAKTIFKAN' : 'DINONAKTIFKAN'}.`, 'info');
                  showToast(`Simulator IoT ${e.target.checked ? 'Aktif' : 'Nonaktif'}`, 'info');
                }}
              />
              <span className="slider"></span>
            </label>
          </div>


        </div>
      </aside>

      <div className="main-container">

        <header className="main-content" style={{ paddingBottom: 0, flexGrow: 0 }}>
          <div className="top-header">
            <div className="header-title-section">
              <h1>
                {activeTab === 'overview' && 'Dashboard Smart Trash IoT'}
                {activeTab === 'analytics' && 'Analytics & Tren Kapasitas'}
                {activeTab === 'logs' && 'Real-time System Logs Console'}
              </h1>
              <p className="header-subtitle">
                Sampah Cerdas Kita Semua
              </p>
            </div>

            <div className="header-right">
              
              <div 
                className={`notification-bell ${hasWarning ? 'ringing' : ''}`}
                onClick={() => setShowNotifBox(!showNotifBox)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {hasWarning && <span className="notification-dot"></span>}

                {showNotifBox && (
                  <div className="notif-dropdown" onClick={(e) => e.stopPropagation()}>
                    <div className="notif-header">Notifikasi Sistem</div>
                    <div className="notif-body">
                      {daftarTempatSampah.filter(b => b.kapasitas > 90).length > 0 ? (
                        daftarTempatSampah.filter(b => b.kapasitas > 90).map(b => (
                          <div key={b.id} className="notif-item warning">
                            <strong>⚠️ {b.id} ({b.kapasitas}%)</strong><br/>
                            Hampir penuh di lokasi {b.lokasi}! Segera jadwalkan pengangkutan.
                          </div>
                        ))
                      ) : (
                        <div className="notif-item success">
                          ✅ Semua tempat sampah dalam keadaan aman.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

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
                  placeholder="Cari kode bin: TRASH-01..." 
                  className="search-input-field"
                />
              </div>

              <div className="live-status-pill">
                <span className="live-pulse"></span>
                SYSTEM ONLINE
              </div>
            </div>
          </div>
        </header>

        <main className="main-content main-scrollable-content">

          {activeTab === 'overview' && (
            <>
              
              <section className="quick-stats-row">
                <div className="stat-card">
                  <div className="stat-icon-box blue">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Total Node Bin</span>
                    <span className="stat-value">{totalBinsCount} Bins</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-box orange">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Status Penuh (&gt;80%)</span>
                    <span className="stat-value" style={{ color: warningBinsCount > 0 ? 'var(--status-red)' : 'inherit' }}>
                      {warningBinsCount} Bin
                    </span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-box blue">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Rata-Rata Kapasitas</span>
                    <span className="stat-value">{avgKapasitas}%</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-box green">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Servo Terbuka</span>
                    <span className="stat-value">{openServosCount} / {totalBinsCount}</span>
                  </div>
                </div>
              </section>

              <div className="overview-grid">

                <section className="primary-bin-card">
                  <div className="card-title-bar">
                    <div className="bin-meta">
                      <span className="bin-id-tag">{dataTerpilih.id}</span>
                      <h3 className="bin-name">{dataTerpilih.lokasi}</h3>
                      <span className="bin-loc">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                        Gedung D3 TI UB
                      </span>
                    </div>
                    <span className={`badge-source ${dataTerpilih.isFirebase ? 'firebase' : 'simulated'}`}>
                      {dataTerpilih.isFirebase ? '● Live Firebase' : '● Live Simulator'}
                    </span>
                  </div>

                  <div className="trashbin-visualizer-container">
                    <svg viewBox="0 0 160 240" className="trashbin-svg" width="160" height="240">
                      <defs>
                        
                        <clipPath id="bin-body-clip">
                          <path d="M 30,50 L 130,50 L 130,220 C 130,225 125,230 120,230 L 40,230 C 35,230 30,225 30,220 Z" />
                        </clipPath>
                        
                        <linearGradient id="glass-reflect" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="rgba(255,255,255,0.15)"/>
                          <stop offset="30%" stopColor="rgba(255,255,255,0.05)"/>
                          <stop offset="70%" stopColor="rgba(255,255,255,0)"/>
                          <stop offset="100%" stopColor="rgba(255,255,255,0.08)"/>
                        </linearGradient>
                      </defs>

                      <path d="M 30,50 L 130,50 L 130,220 C 130,225 125,230 120,230 L 40,230 C 35,230 30,225 30,220 Z" 
                            fill="var(--bin-body-bg)" 
                            stroke="var(--bin-body-border)" 
                            strokeWidth="3.5" 
                            className={dataTerpilih.kapasitas > 80 ? 'warning-glow-bin' : ''} />

                      <g clipPath="url(#bin-body-clip)">
                        
                        {(() => {
                          const pct = dataTerpilih.kapasitas;
                          const yLevel = 230 - (pct * 1.8);
                          return (
                            <g className="trash-level-group">
                              
                              <path 
                                d={`M -40,${yLevel} 
                                    L 20,${yLevel} 
                                    L 40,${yLevel - 8} 
                                    L 60,${yLevel + 5} 
                                    L 80,${yLevel - 5} 
                                    L 100,${yLevel + 8} 
                                    L 120,${yLevel - 2} 
                                    L 140,${yLevel} 
                                    L 210,${yLevel} 
                                    L 210,240 L -40,240 Z`} 
                                fill={currentLiquidColor} 
                                opacity="0.85" 
                                className="bin-solid-path"
                              />
                              
                              <path 
                                d={`M -40,${yLevel} 
                                    L 30,${yLevel + 5} 
                                    L 50,${yLevel - 5} 
                                    L 70,${yLevel + 10} 
                                    L 90,${yLevel - 8} 
                                    L 110,${yLevel + 5} 
                                    L 130,${yLevel - 2} 
                                    L 150,${yLevel + 5} 
                                    L 210,${yLevel} 
                                    L 210,240 L -40,240 Z`} 
                                fill={currentLiquidColor} 
                                opacity="0.4" 
                                className="bin-solid-path-back"
                              />
                              {pct > 20 && (
                                <g className="trash-debris" fill="rgba(0,0,0,0.12)">
                                  <polygon points={`45,${yLevel+15} 65,${yLevel+5} 75,${yLevel+20} 50,${yLevel+30}`} />
                                  <polygon points={`85,${yLevel+10} 105,${yLevel+2} 115,${yLevel+15} 90,${yLevel+25}`} />
                                  <polygon points={`55,${yLevel+35} 85,${yLevel+25} 95,${yLevel+45} 65,${yLevel+50}`} />
                                  <polygon points={`75,${yLevel+55} 105,${yLevel+45} 120,${yLevel+60} 85,${yLevel+75}`} />
                                  <polygon points={`40,${yLevel+60} 60,${yLevel+50} 70,${yLevel+70} 50,${yLevel+80}`} />
                                </g>
                              )}
                            </g>
                          );
                        })()}
                      </g>

                      <path d="M 55,70 L 55,210 M 80,70 L 80,210 M 105,70 L 105,210" 
                            stroke="var(--bin-rib-stroke)" 
                            strokeWidth="3.5" 
                            strokeLinecap="round" />

                      <path d="M 30,50 L 130,50 L 130,220 C 130,225 125,230 120,230 L 40,230 C 35,230 30,225 30,220 Z" 
                            fill="url(#glass-reflect)" 
                            pointerEvents="none" />

                      <path d="M 24,44 L 136,44 C 138,44 140,46 140,48 L 138,52 C 138,53 136,54 134,54 L 26,54 C 24,54 22,53 22,52 L 20,48 C 20,46 22,44 24,44 Z" 
                            fill="var(--bg-secondary)" 
                            stroke="var(--border-color)" 
                            strokeWidth="3" />

                      <g 
                        className="bin-lid-group"
                        style={{
                          transform: dataTerpilih.servo === 1 ? 'rotate(-32deg)' : 'rotate(0deg)',
                          transformOrigin: '26px 44px',
                          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        
                        <path d="M 22,36 L 138,36 C 141,36 143,38 143,40 L 143,44 L 17,44 L 17,40 C 17,38 19,36 22,36 Z" 
                              fill="var(--bg-secondary)" 
                              stroke="var(--border-color)" 
                              strokeWidth="3" />
                        
                        <path d="M 66,36 L 70,28 L 90,28 L 94,36" 
                              fill="none" 
                              stroke="var(--border-color)" 
                              strokeWidth="3" 
                              strokeLinecap="round" />
                        
                        <circle cx="80" cy="40" r="2.5" fill={dataTerpilih.servo === 1 ? 'var(--status-green)' : 'var(--status-red)'} className="lid-sensor-dot" />
                      </g>

                      {dataTerpilih.kapasitas > 80 && dataTerpilih.servo !== 1 && (
                        <g className="smell-particles">
                          <circle cx="60" cy="20" r="1.5" fill="#a3e635" className="fly-1" />
                          <circle cx="100" cy="15" r="2" fill="#a3e635" className="fly-2" />
                          <circle cx="80" cy="5" r="1.5" fill="#a3e635" className="fly-3" />
                          <path d="M 60,30 Q 70,10 80,0" fill="none" stroke="#bef264" strokeWidth="2" strokeDasharray="4" opacity="0.6" className="smoke-1" />
                          <path d="M 90,35 Q 100,15 110,-5" fill="none" stroke="#bef264" strokeWidth="2" strokeDasharray="4" opacity="0.6" className="smoke-2" />
                        </g>
                      )}
                    </svg>

                    <div className="trashbin-overlay-text" style={{ display: 'none' }}>
                      <span className="trashbin-percent" style={{ color: currentLiquidColor }}>
                        {dataTerpilih.kapasitas}%
                      </span>
                      <div className="trashbin-label">Kapasitas</div>
                    </div>
                  </div>

                  <div className="capacity-status-section">
                    <div className="capacity-info-row">
                      <div className="capacity-info-left">
                        <span className="capacity-percent-value" style={{ color: currentLiquidColor }}>
                          <AnimatedNumber value={dataTerpilih.kapasitas} />%
                        </span>
                        <div className="capacity-text-group">
                          <span className="capacity-percent-lbl">Kapasitas Terisi</span>
                          <span className="capacity-last-emptied">Terakhir dikosongkan: {getTimeAgo(dataTerpilih.lastEmptied)}</span>
                        </div>
                      </div>
                      <div className="capacity-status-badge" style={{ color: currentLiquidColor, borderColor: currentLiquidColor }}>
                        {dataTerpilih.kapasitas > 80 ? 'PENUH' : 'TERSEDIA'}
                      </div>
                    </div>
                    <div className="capacity-progress-track">
                      <div 
                        className="capacity-progress-fill" 
                        style={{ 
                          width: `${dataTerpilih.kapasitas}%`, 
                          backgroundColor: currentLiquidColor 
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="servo-control-section">
                    <div className="servo-status-indicator">
                      <div className={`servo-icon-circle ${dataTerpilih.servo === 1 ? 'open' : 'closed'}`}>
                        {dataTerpilih.servo === 1 ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        )}
                      </div>
                      <div className="servo-state-desc">
                        <span className="servo-state-label">Status Tempat Sampah</span>
                        <span className={`servo-state-value ${dataTerpilih.servo === 1 ? 'open' : 'closed'}`}>
                          {dataTerpilih.servo === 1 ? 'TERBUKA (OPEN)' : 'TERTUTUP (CLOSED)'}
                        </span>
                      </div>
                    </div>

                    <div className="control-btn-group">
                      <button 
                        onClick={() => handleKontrol(dataTerpilih.id, 1)} 
                        disabled={dataTerpilih.servo === 1}
                        className="btn-control open"
                      >
                        Buka Sampah
                      </button>
                      <button 
                        onClick={() => handleKontrol(dataTerpilih.id, 0)} 
                        disabled={dataTerpilih.servo === 0}
                        className="btn-control close"
                      >
                        Tutup Sampah
                      </button>
                    </div>
                  </div>
                </section>

                <section className="floor-map-card">
                  <div className="floor-map-title-bar">
                    <h3 className="floor-map-title">Peta Lokasi & Status Real-time</h3>
                    <div className="map-legend">
                      <div className="legend-item">
                        <span className="legend-dot green"></span> &lt;50%
                      </div>
                      <div className="legend-item">
                        <span className="legend-dot orange"></span> 50-80%
                      </div>
                      <div className="legend-item">
                        <span className="legend-dot red"></span> &gt;80%
                      </div>
                    </div>
                  </div>

                  <div className="map-container-svg" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div className="radar-sweep"></div>
                    <svg className="map-canvas" viewBox="10 30 380 240" style={{ position: 'relative', zIndex: 2 }}>
                      
                      <g className="map-grid-lines">
                        <path d="M 0,50 L 400,50 M 0,100 L 400,100 M 0,150 L 400,150 M 0,200 L 400,200 M 0,250 L 400,250" />
                        <path d="M 50,0 L 50,300 M 100,0 L 100,300 M 150,0 L 150,300 M 200,0 L 200,300 M 250,0 L 250,300 M 300,0 L 300,300 M 350,0 L 350,300" />
                      </g>

                      <path d="M 20,40 L 170,40 L 170,160 L 20,160 Z" className="map-wall" />
                      
                      <path d="M 210,40 L 380,40 L 380,160 L 210,160 Z" className="map-wall" />
                      
                      <path d="M 20,190 L 380,190 L 380,260 L 20,260 Z" className="map-wall" />

                      <text x="95" y="105" className="map-room-label">LAB IoT</text>
                      <text x="295" y="105" className="map-room-label">LAB KOMPUTER 2</text>
                      <text x="200" y="230" className="map-room-label" style={{ fontSize: '9px' }}>KORIDOR UTAMA D3</text>

                      <g 
                        className={`map-pin ${selectedBinId === 'TRASH-01' ? 'selected' : ''}`}
                        onClick={() => handleSelectBin('TRASH-01')}
                      >
                        <circle cx="95" cy="70" r="14" fill={getLiquidColor(firebaseKapasitas)} className="map-pin-pulse" />
                        <circle cx="95" cy="70" r="6" fill={getLiquidColor(firebaseKapasitas)} className="map-pin-dot" />
                        <text x="95" y="50" fill="var(--text-primary)" fontSize="8" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>TRASH-01</text>
                        <g className="map-tooltip">
                          <rect x="70" y="30" width="50" height="14" rx="2" fill="rgba(15,23,42,0.9)" />
                          <text x="95" y="40" fill="white" fontSize="7" textAnchor="middle">Kapasitas: {firebaseKapasitas}%</text>
                        </g>
                      </g>

                      <g 
                        className={`map-pin ${selectedBinId === 'TRASH-02' ? 'selected' : ''}`}
                        onClick={() => handleSelectBin('TRASH-02')}
                      >
                        <circle cx="200" cy="215" r="14" fill={getLiquidColor(simKapasitas2)} className="map-pin-pulse" />
                        <circle cx="200" cy="215" r="6" fill={getLiquidColor(simKapasitas2)} className="map-pin-dot" />
                        <text x="200" y="202" fill="var(--text-primary)" fontSize="8" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>TRASH-02</text>
                        <g className="map-tooltip">
                          <rect x="175" y="182" width="50" height="14" rx="2" fill="rgba(15,23,42,0.9)" />
                          <text x="200" y="192" fill="white" fontSize="7" textAnchor="middle">Kapasitas: {simKapasitas2}%</text>
                        </g>
                      </g>

                      <g 
                        className={`map-pin ${selectedBinId === 'TRASH-03' ? 'selected' : ''}`}
                        onClick={() => handleSelectBin('TRASH-03')}
                      >
                        <circle cx="295" cy="70" r="14" fill={getLiquidColor(simKapasitas3)} className="map-pin-pulse" />
                        <circle cx="295" cy="70" r="6" fill={getLiquidColor(simKapasitas3)} className="map-pin-dot" />
                        <text x="295" y="50" fill="var(--text-primary)" fontSize="8" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>TRASH-03</text>
                        <g className="map-tooltip">
                          <rect x="270" y="30" width="50" height="14" rx="2" fill="rgba(15,23,42,0.9)" />
                          <text x="295" y="40" fill="white" fontSize="7" textAnchor="middle">Kapasitas: {simKapasitas3}%</text>
                        </g>
                      </g>
                    </svg>
                  </div>
                </section>
              </div>

              <section className="bins-list-section">
                <div>
                  <h3 className="section-subtitle">Daftar Seluruh Node Tempat Sampah</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Klik salah satu kartu untuk mengontrol dan melihat visualisasi detail tabung.</p>
                </div>

                <div className="bins-list-grid">
                  {daftarTempatSampah.map((bin) => {
                    const binColor = getLiquidColor(bin.kapasitas);
                    return (
                      <div 
                        key={bin.id}
                        onClick={() => handleSelectBin(bin.id)}
                        className={`bin-preview-card ${selectedBinId === bin.id ? 'selected' : ''}`}
                      >
                        <div className="preview-card-header">
                          <div className="preview-title-box">
                            <span className="preview-id">{bin.id}</span>
                            <span className="preview-loc">{bin.lokasi}</span>
                          </div>
                          <span className="preview-value-text" style={{ color: binColor }}>
                            <AnimatedNumber value={bin.kapasitas} />%
                          </span>
                        </div>

                        <div className="preview-meter-track">
                          <div 
                            className="preview-meter-fill" 
                            style={{ 
                              width: `${bin.kapasitas}%`, 
                              backgroundColor: binColor 
                            }}
                          ></div>
                        </div>

                        <div className="preview-card-footer">
                          <span>{bin.isFirebase ? 'Real-Time Database' : 'Simulasi Node'}</span>
                          <span className={`preview-servo-badge ${bin.servo === 1 ? 'open' : 'closed'}`}>
                            Lid: {bin.servo === 1 ? 'OPEN' : 'CLOSED'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics-grid">

              <section className="chart-card full-width">
                <div className="chart-header">
                  <div className="chart-title-section">
                    <h3 className="chart-title">Grafik Tren Pengisian Sampah (7 Hari Terakhir)</h3>
                    <span className="chart-desc">Menampilkan tren fluktuasi rata-rata kapasitas pada {dataTerpilih.id} ({dataTerpilih.lokasi})</span>
                  </div>
                </div>

                <div className="chart-svg-container">
                  <svg className="svg-chart" viewBox="0 0 800 240" height="240">
                    <defs>
                      <linearGradient id="line-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.4"/>
                        <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity="0"/>
                      </linearGradient>
                    </defs>

                    <g className="chart-gridline">
                      <line x1="60" y1="40" x2="760" y2="40" />
                      <line x1="60" y1="90" x2="760" y2="90" />
                      <line x1="60" y1="140" x2="760" y2="140" />
                      <line x1="60" y1="190" x2="760" y2="190" />
                    </g>

                    <text x="25" y="45" className="chart-axis-text">100%</text>
                    <text x="30" y="95" className="chart-axis-text">70%</text>
                    <text x="30" y="145" className="chart-axis-text">40%</text>
                    <text x="35" y="195" className="chart-axis-text">0%</text>

                    <g className="chart-axis-text" textAnchor="middle">
                      <text x="100" y="215">Senin</text>
                      <text x="200" y="215">Selasa</text>
                      <text x="300" y="215">Rabu</text>
                      <text x="400" y="215">Kamis</text>
                      <text x="500" y="215">Jumat</text>
                      <text x="600" y="215">Sabtu</text>
                      <text x="700" y="215">Hari Ini</text>
                    </g>

                    <line x1="60" y1="30" x2="60" y2="200" className="chart-axis-line" />
                    <line x1="60" y1="200" x2="770" y2="200" className="chart-axis-line" />

                    {(() => {
                      const day1Cap = 24;
                      const day2Cap = 42;
                      const day3Cap = 38;
                      const day4Cap = 55;
                      const day5Cap = 40;
                      const day6Cap = Math.max(30, Math.min(95, dataTerpilih.kapasitas - 12));
                      const day7Cap = dataTerpilih.kapasitas;

                      const y1 = 200 - (day1Cap * 1.6);
                      const y2 = 200 - (day2Cap * 1.6);
                      const y3 = 200 - (day3Cap * 1.6);
                      const y4 = 200 - (day4Cap * 1.6);
                      const y5 = 200 - (day5Cap * 1.6);
                      const y6 = 200 - (day6Cap * 1.6);
                      const y7 = 200 - (day7Cap * 1.6);

                      const points = `100,${y1} 200,${y2} 300,${y3} 400,${y4} 500,${y5} 600,${y6} 700,${y7}`;
                      const areaPoints = `100,200 ${points} 700,200`;

                      return (
                        <>
                          
                          <polygon points={areaPoints} className="chart-line-area" />

                          <path 
                            d={`M 100,${y1} 
                                C 150,${y1} 150,${y2} 200,${y2} 
                                C 250,${y2} 250,${y3} 300,${y3} 
                                C 350,${y3} 350,${y4} 400,${y4} 
                                C 450,${y4} 450,${y5} 500,${y5} 
                                C 550,${y5} 550,${y6} 600,${y6} 
                                C 650,${y6} 650,${y7} 700,${y7}`} 
                            className="chart-line-path" 
                          />

                          <circle cx="100" cy={y1} r="4" className="chart-node-point" />
                          <circle cx="200" cy={y2} r="4" className="chart-node-point" />
                          <circle cx="300" cy={y3} r="4" className="chart-node-point" />
                          <circle cx="400" cy={y4} r="4" className="chart-node-point" />
                          <circle cx="500" cy={y5} r="4" className="chart-node-point" />
                          <circle cx="600" cy={y6} r="4" className="chart-node-point" />
                          <circle cx="700" cy={y7} r="5" className="chart-node-point" style={{ stroke: 'var(--accent-cyan)' }} />

                          <g transform={`translate(700, ${y7 - 22})`}>
                            <rect x="-24" y="-12" width="48" height="18" rx="4" fill="var(--bg-secondary)" stroke="var(--accent-cyan)" strokeWidth="1" />
                            <text x="0" y="1.5" fill="var(--text-primary)" fontSize="9" fontWeight="bold" textAnchor="middle">{day7Cap}%</text>
                          </g>
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </section>

              <section className="chart-card full-width">
                <div className="chart-header">
                  <div className="chart-title-section">
                    <h3 className="chart-title">Waktu Pembuangan Terpadat</h3>
                    <span className="chart-desc">Frekuensi pembuangan sampah berdasarkan jam operasional</span>
                  </div>
                </div>

                <div className="chart-svg-container">
                  <svg className="svg-chart" viewBox="0 0 800 200">
                    
                    <g className="chart-gridline">
                      <line x1="60" y1="30" x2="760" y2="30" />
                      <line x1="60" y1="80" x2="760" y2="80" />
                      <line x1="60" y1="130" x2="760" y2="130" />
                    </g>

                    <line x1="60" y1="160" x2="760" y2="160" className="chart-axis-line" />

                    <text x="20" y="34" className="chart-axis-text">Tinggi</text>
                    <text x="20" y="84" className="chart-axis-text">Sedang</text>
                    <text x="20" y="134" className="chart-axis-text">Rendah</text>

                    <rect x="142" y="100" width="36" height="60" className="chart-bar-rect" />
                    <rect x="242" y="60" width="36" height="100" className="chart-bar-rect" />
                    <rect x="342" y="45" width="36" height="115" className="chart-bar-rect" style={{ fill: 'var(--accent-blue)' }} />
                    <rect x="442" y="115" width="36" height="45" className="chart-bar-rect" />
                    <rect x="542" y="55" width="36" height="105" className="chart-bar-rect" />
                    <rect x="642" y="125" width="36" height="35" className="chart-bar-rect" />

                    <g className="chart-axis-text" textAnchor="middle">
                      <text x="160" y="180">08:00</text>
                      <text x="260" y="180">10:00</text>
                      <text x="360" y="180">12:00</text>
                      <text x="460" y="180">14:00</text>
                      <text x="560" y="180">16:00</text>
                      <text x="660" y="180">18:00</text>
                    </g>
                  </svg>
                </div>
              </section>

            </div>
          )}

          {activeTab === 'logs' && (
            <div className="logs-screen-container">
              
              <div className="logs-controls">
                <div className="logs-filter-group">
                  <button 
                    onClick={() => setLogFilter('all')} 
                    className={`btn-filter-log ${logFilter === 'all' ? 'active' : ''}`}
                  >
                    Semua ({logs.length})
                  </button>
                  <button 
                    onClick={() => setLogFilter('info')} 
                    className={`btn-filter-log ${logFilter === 'info' ? 'active' : ''}`}
                  >
                    Info
                  </button>
                  <button 
                    onClick={() => setLogFilter('success')} 
                    className={`btn-filter-log ${logFilter === 'success' ? 'active' : ''}`}
                  >
                    Sukses
                  </button>
                  <button 
                    onClick={() => setLogFilter('warning')} 
                    className={`btn-filter-log ${logFilter === 'warning' ? 'active' : ''}`}
                  >
                    Peringatan
                  </button>
                  <button 
                    onClick={() => setLogFilter('error')} 
                    className={`btn-filter-log ${logFilter === 'error' ? 'active' : ''}`}
                  >
                    Error
                  </button>
                </div>

                <button 
                  onClick={() => {
                    setLogs([]);
                    showToast('Log dibersihkan!', 'info');
                  }} 
                  className="btn-clear-logs"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                  Clear Console
                </button>
              </div>

              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <span className="terminal-dot r"></span>
                    <span className="terminal-dot y"></span>
                    <span className="terminal-dot g"></span>
                  </div>
                  <div className="terminal-title">smart-trash-terminal@iot-ubuntu</div>
                  <div className="terminal-status">
                    <span className="live-pulse"></span>
                    SIMULATOR LIVE
                  </div>
                </div>

                <div className="terminal-logs-feed">
                  {filteredLogs.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>
                      -- Tidak ada log yang sesuai filter --
                    </div>
                  ) : (
                    filteredLogs.map((log, idx) => (
                      <div key={idx} className="log-line">
                        <span className="log-timestamp">[{log.time}]</span>
                        <span className={`log-badge ${log.type}`}>{log.type}</span>
                        <span className="log-message">{log.msg}</span>
                      </div>
                    ))
                  )}
                  
                  <div className="terminal-input-line">
                    <span>ubuntu@smartcity-iot:~$</span>
                    <span style={{ color: '#ffffff' }}>listen_ports --device=all --verbose</span>
                    <span className="terminal-cursor"></span>
                  </div>
                  <div ref={terminalEndRef}></div>
                </div>
              </div>
            </div>
          )}

        </main>



      </div>

      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item toast-${toast.type}`}>
            <div className="toast-icon">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'info' && 'i'}
              {toast.type === 'closed' && '✕'}
            </div>
            <div className="toast-content">
              <div className="toast-title">
                {toast.type === 'success' && 'BERHASIL'}
                {toast.type === 'error' && 'GAGAL'}
                {toast.type === 'info' && 'SIMULASI'}
                {toast.type === 'closed' && 'TERTUTUP'}
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