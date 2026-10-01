import { createWorker } from 'tesseract.js';
import { useState, useEffect, useRef } from 'react';

const API_URL = 'http://localhost:5000/api/medicines/search?query=';

const normalizeResponse = (data) => {
  if (!data || !data.searchedBrand) return [];

  const brand = data.searchedBrand;
  const substitutes = data.substitutes || [];
  const bestGeneric = substitutes[0] || {};

  return [{
    id: brand._id || Math.random().toString(),
    brand: brand.brandName,
    company: brand.manufacturer || 'Branded Pharma',
    salt: brand.saltName + (brand.strength ? ` (${brand.strength})` : ''),
    price: Number(brand.price),
    genericName: bestGeneric.brandName || 'Jan Aushadhi Generic Substitute',
    genericPrice: Number(bestGeneric.price) || 0,
    savingsAmount: bestGeneric.savingsAmount || 0,
    savingsPercentage: bestGeneric.savingsPercentage || '0%',
    hasGeneric: substitutes.length > 0,
    age: brand.age_info || {
      infant: { status: 'avoid', text: 'Doctor consultation required' },
      child: { status: 'doctor', text: 'Pediatrician guidance needed' },
      adult: { status: 'ok', text: 'Safe as prescribed' },
      senior: { status: 'ok', text: 'Safe as prescribed' }
    },
  }];
};

const AGE_GROUPS = [
  { key: 'infant', label: 'Baby', range: '0-2 saal', icon: '👶' },
  { key: 'child', label: 'Bachcha', range: '2-12 saal', icon: '🧒' },
  { key: 'adult', label: 'Bada', range: '12-59 saal', icon: '🧑' },
  { key: 'senior', label: 'Buzurg', range: '60+ saal', icon: '👴' },
];

const STATUS = {
  ok: { text: 'Aam taur par safe', color: '#10B981', bg: '#ECFDF5' },
  doctor: { text: 'Doctor ki salah se lein', color: '#F59E0B', bg: '#FEF3C7' },
  avoid: { text: 'Is umar mein na lein', color: '#EF4444', bg: '#FEF2F2' },
  unknown: { text: 'Information available nahi hai', color: '#6B7280', bg: '#F3F4F6' },
};

function Dashboard({ user, onLogout }) {
  const [q, setQ] = useState('');
  const [who, setWho] = useState(null);
  const [list, setList] = useState([]);
  const [state, setState] = useState('idle');
  const [menu, setMenu] = useState(false);
  const [listening, setListening] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!q.trim()) { setList([]); setState('idle'); return; }
    setState('loading');
    
    const t = setTimeout(async () => {
      try {
        const res = await fetch(API_URL + encodeURIComponent(q.trim()));
        if (!res.ok) {
          setState('done');
          setList([]);
          return;
        }
        const data = await res.json();
        setList(normalizeResponse(data));
        setState('done');
      } catch (err) { 
        console.error("API Error:", err);
        setState('error'); 
      }
    }, 400);

    return () => clearTimeout(t);
  }, [q]);

  const speak = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert('Mic search is browser mein supported nahi hai.');
    const r = new SR();
    r.lang = 'hi-IN';
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onresult = (e) => setQ(e.results[0][0].transcript);
    r.start();
  };

  const onImage = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setState('loading');
  try {
    const worker = await createWorker('eng');
    const ret = await worker.recognize(file);
    await worker.terminate();

    // Scanned text se pehla word/line lekar search query set karein
    const scannedText = ret.data.text.trim().split('\n')[0];
    if (scannedText) {
      setQ(scannedText);
    } else {
      alert('Photo se text samajh nahi aaya. Kripya doosri clear photo upload karein.');
      setState('idle');
    }
  } catch (err) {
    console.error('OCR Error:', err);
    alert('Image scan karne mein dikkat hui.');
    setState('idle');
  }
};

  return (
    <div style={styles.appContainer}>
      
      {/* Navbar Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>💊</span>
          <span style={styles.logoText}>Dawai<span style={{ color: '#2563EB' }}>Saathi</span></span>
        </div>

        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenu(!menu)} style={styles.avatarBtn}>
            {(user?.name || 'U')[0].toUpperCase()}
          </button>

          {menu && (
            <div style={styles.profileMenu}>
              <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#1E293B' }}>{user?.name || 'User'}</p>
              <small style={{ color: '#64748B', display: 'block', marginBottom: '12px' }}>{user?.email}</small>
              <button onClick={onLogout} style={styles.logoutBtn}>Sign Out</button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.badge}>✨ Save up to 85% on Medicines</div>
        <h1 style={styles.heroTitle}>Same Salt. <span style={{ color: '#2563EB' }}>Smarter Price.</span></h1>
        <p style={styles.heroSubtitle}>Brand name type karein, voice command dein, ya strip ki photo upload karein.</p>

        {/* Search Input Control */}
        <div style={styles.searchBox}>
          <input 
            value={q} 
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Crocin, Calpol, Paracetamol..." 
            style={styles.searchInput}
          />
          
          <button 
            onClick={speak} 
            title="Voice Search"
            style={{ ...styles.iconBtn, background: listening ? '#EF4444' : '#F1F5F9', color: listening ? '#FFF' : '#334155' }}
          >
            🎤
          </button>

          <button 
            onClick={() => fileRef.current.click()} 
            title="Upload Photo"
            style={styles.iconBtn}
          >
            📷
          </button>
          
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onImage} />
        </div>

        {/* Age Selector */}
        <div style={styles.ageContainer}>
          <span style={styles.ageLabel}>Kiske liye dawai chahiye?</span>
          <div style={styles.ageGrid}>
            {AGE_GROUPS.map((g) => (
              <button 
                key={g.key} 
                onClick={() => setWho(who === g.key ? null : g.key)}
                style={{
                  ...styles.ageChip,
                  borderColor: who === g.key ? '#2563EB' : '#E2E8F0',
                  backgroundColor: who === g.key ? '#EFF6FF' : '#FFFFFF',
                  color: who === g.key ? '#1D4ED8' : '#475569'
                }}
              >
                <span>{g.icon} {g.label}</span>
                <small style={{ color: '#94A3B8', fontSize: '11px' }}>{g.range}</small>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results Main Section */}
      <main style={styles.resultsContainer}>
        {state === 'loading' && (
          <div style={styles.statusCard}>
            <div style={styles.loader}></div>
            <p style={{ color: '#64748B', marginTop: '12px' }}>Database scan ho raha hai...</p>
          </div>
        )}

        {state === 'error' && (
          <div style={styles.statusCard}>
            <p style={{ color: '#EF4444' }}>Server se connection fail ho gaya. Make sure backend server `localhost:5000` chal raha hai.</p>
          </div>
        )}

        {state === 'done' && !list.length && (
          <div style={styles.statusCard}>
            <p style={{ color: '#64748B' }}>Koi matching brand medicine nahi mili. Name verify karein.</p>
          </div>
        )}

        {state === 'idle' && (
          <div style={styles.statusCard}>
            <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>🔍</p>
            <p style={{ color: '#64748B', margin: 0 }}>Try searching for <b>“Crocin”</b>, <b>“Calpol”</b>, ya <b>“Augmentin”</b></p>
          </div>
        )}

        {/* Search Result Card */}
        {list.map((m) => {
          const ageStatus = who ? (m.age[who] ? STATUS[m.age[who].status] : STATUS.unknown) : null;

          return (
            <div key={m.id} style={styles.card}>
              
              {/* Card Header: Brand Info */}
              <div style={styles.cardHeader}>
                <div>
                  <h2 style={styles.brandTitle}>{m.brand}</h2>
                  <span style={styles.companySub}>{m.company}</span>
                </div>
                <div style={styles.priceTag}>
                  <small style={{ color: '#64748B', display: 'block', textAlign: 'right' }}>Brand Price</small>
                  <span style={styles.brandPrice}>₹{m.price}</span>
                </div>
              </div>

              <div style={styles.saltBadge}>
                <b>Active Salt:</b> {m.salt}
              </div>

              {/* Substitute Highlight Box */}
              {m.hasGeneric ? (
                <div style={styles.substituteBox}>
                  <div style={styles.subHeader}>
                    <span style={styles.govBadge}>Jan Aushadhi Alternative</span>
                    <span style={styles.savingsTag}>Save {m.savingsPercentage}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <div>
                      <h3 style={styles.genericTitle}>{m.genericName}</h3>
                      <p style={{ color: '#047857', margin: 0, fontSize: '13px' }}>Government Approved Generic Substitute</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={styles.genericPrice}>₹{m.genericPrice}</span>
                    </div>
                  </div>

                  <div style={styles.savingsBar}>
                    🎉 Aapki Kul Bachat: <b>₹{m.savingsAmount}</b>
                  </div>
                </div>
              ) : (
                <div style={styles.noGenericBox}>
                  Is exact dosage ka generic alternative current database mein mapped nahi hai.
                </div>
              )}

              {/* Age Suitability Alert */}
              {who && ageStatus && (
                <div style={{ ...styles.ageAlert, backgroundColor: ageStatus.bg, borderLeft: `4px solid ${ageStatus.color}` }}>
                  <span style={{ color: ageStatus.color, fontWeight: 'bold' }}>
                    Age Suitability ({who}): {ageStatus.text}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}

/* ============ STYLESHEET (CSS-IN-JS) ============ */
const styles = {
  appContainer: {
    backgroundColor: '#F8FAFC',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#0F172A',
    paddingBottom: '40px'
  },
  header: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '22px',
    fontWeight: '800'
  },
  logoIcon: {
    fontSize: '24px'
  },
  avatarBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#2563EB',
    color: '#FFF',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
  },
  profileMenu: {
    position: 'absolute',
    right: 0,
    top: '48px',
    backgroundColor: '#FFF',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
    border: '1px solid #E2E8F0',
    minWidth: '180px',
    zIndex: 10
  },
  logoutBtn: {
    width: '100%',
    padding: '8px',
    backgroundColor: '#FEF2F2',
    color: '#EF4444',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  heroSection: {
    maxWidth: '680px',
    margin: '20px auto 40px auto',
    textAlign: 'center',
    padding: '0 20px'
  },
  badge: {
    display: 'inline-block',
    padding: '6px 14px',
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '16px'
  },
  heroTitle: {
    fontSize: '36px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    margin: '0 0 10px 0'
  },
  heroSubtitle: {
    color: '#64748B',
    fontSize: '16px',
    margin: '0 0 24px 0'
  },
  searchBox: {
    display: 'flex',
    gap: '8px',
    backgroundColor: '#FFF',
    padding: '8px',
    borderRadius: '16px',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)',
    border: '1px solid #E2E8F0'
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '16px',
    padding: '8px 12px',
    color: '#1E293B'
  },
  iconBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#F1F5F9',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  ageContainer: {
    marginTop: '28px'
  },
  ageLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748B',
    display: 'block',
    marginBottom: '12px'
  },
  ageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '10px'
  },
  ageChip: {
    padding: '10px 12px',
    borderRadius: '12px',
    border: '1px solid',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  resultsContainer: {
    maxWidth: '680px',
    margin: '0 auto',
    padding: '0 20px'
  },
  statusCard: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: '#FFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0'
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: '20px',
    padding: '24px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
    marginBottom: '20px'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  brandTitle: {
    fontSize: '22px',
    fontWeight: '700',
    margin: 0
  },
  companySub: {
    color: '#64748B',
    fontSize: '13px'
  },
  priceTag: {
    textAlign: 'right'
  },
  brandPrice: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0F172A'
  },
  saltBadge: {
    marginTop: '12px',
    display: 'inline-block',
    backgroundColor: '#F1F5F9',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#334155'
  },
  substituteBox: {
    marginTop: '20px',
    backgroundColor: '#ECFDF5',
    border: '1px solid #A7F3D0',
    borderRadius: '14px',
    padding: '16px'
  },
  subHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  govBadge: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#047857',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  savingsTag: {
    backgroundColor: '#10B981',
    color: '#FFF',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  genericTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#065F46',
    margin: 0
  },
  genericPrice: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#047857'
  },
  savingsBar: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px dashed #6EE7B7',
    color: '#065F46',
    fontSize: '14px'
  },
  noGenericBox: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#FEF2F2',
    color: '#991B1B',
    borderRadius: '8px',
    fontSize: '13px'
  },
  ageAlert: {
    marginTop: '16px',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px'
  }
};

export default Dashboard;