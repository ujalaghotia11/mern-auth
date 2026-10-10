import { createWorker } from 'tesseract.js';
import { useState, useEffect, useRef } from 'react';

const API_URL = 'http://localhost:5000/api/medicines/search?query=';

/* ---------------------------------------------------------------
   API response -> UI model
---------------------------------------------------------------- */
const normalizeResponse = (data) => {
  if (!data || !data.searchedBrand) return [];

  const brand = data.searchedBrand;
  const substitutes = data.substitutes || [];
  const bestGeneric = substitutes[0] || {};

  return [
    {
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
    },
  ];
};

/* ---------------------------------------------------------------
   Translations
---------------------------------------------------------------- */
const T = {
  en: {
    badge: 'Verified generic alternatives',
    heroTitle: 'Same salt. Lower price.',
    heroSub:
      'Search by brand name, speak it, or upload a photo of the strip to find government-approved generic substitutes.',
    placeholder: 'Search Crocin, Calpol, Augmentin…',
    voice: 'Voice search',
    photo: 'Scan a strip photo',
    search: 'Search',
    tryLabel: 'Popular searches',
    searching: 'Searching the medicine database…',
    scanning: 'Reading text from your photo…',
    errorTitle: 'Cannot reach the server',
    errorBody: 'Make sure the backend is running on localhost:5000, then try again.',
    noResultsTitle: 'No matching medicine found',
    noResultsBody: 'Check the spelling or try the salt name instead.',
    idleTitle: 'Find a cheaper equivalent',
    idleBody: 'Type a brand name above to compare it with its generic substitute.',
    brandLabel: 'Branded medicine',
    genericLabel: 'Generic alternative',
    janAushadhi: 'Jan Aushadhi',
    govApproved: 'Government-approved generic',
    activeSalt: 'Active salt',
    save: 'Save',
    youSave: 'Your total saving',
    noGeneric:
      'A generic alternative for this exact strength is not yet mapped in our database.',
    disclaimer:
      'For information only. Always consult your doctor or pharmacist before switching medicines.',
    signOut: 'Sign out',
    userFallback: 'User',
    micUnsupported: 'Voice search is not supported in this browser.',
    ocrEmpty: 'Could not read any text from the photo. Please upload a clearer image.',
    ocrError: 'Something went wrong while scanning the image.',
    savingsUpTo: 'Save up to 85%',
  },
  hi: {
    badge: 'प्रमाणित जेनेरिक विकल्प',
    heroTitle: 'वही सॉल्ट, कम दाम।',
    heroSub:
      'ब्रांड का नाम लिखें, बोलकर खोजें या दवा की स्ट्रिप की फोटो अपलोड करें और सरकारी मान्यता प्राप्त जेनेरिक विकल्प पाएं।',
    placeholder: 'क्रोसिन, कैलपोल, ऑगमेंटिन खोजें…',
    voice: 'बोलकर खोजें',
    photo: 'स्ट्रिप की फोटो स्कैन करें',
    search: 'खोजें',
    tryLabel: 'लोकप्रिय खोजें',
    searching: 'दवा डेटाबेस में खोजा जा रहा है…',
    scanning: 'फोटो से टेक्स्ट पढ़ा जा रहा है…',
    errorTitle: 'सर्वर से कनेक्ट नहीं हो पाया',
    errorBody: 'सुनिश्चित करें कि बैकएंड localhost:5000 पर चल रहा है, फिर दोबारा कोशिश करें।',
    noResultsTitle: 'कोई मिलती-जुलती दवा नहीं मिली',
    noResultsBody: 'स्पेलिंग जांचें या दवा के सॉल्ट का नाम लिखकर देखें।',
    idleTitle: 'सस्ता विकल्प खोजें',
    idleBody: 'ब्रांड का नाम ऊपर लिखें और उसके जेनेरिक विकल्प से तुलना करें।',
    brandLabel: 'ब्रांडेड दवा',
    genericLabel: 'जेनेरिक विकल्प',
    janAushadhi: 'जन औषधि',
    govApproved: 'सरकार द्वारा मान्य जेनेरिक',
    activeSalt: 'मुख्य सॉल्ट',
    save: 'बचत',
    youSave: 'आपकी कुल बचत',
    noGeneric: 'इस स्ट्रेंथ का जेनेरिक विकल्प अभी हमारे डेटाबेस में उपलब्ध नहीं है।',
    disclaimer:
      'यह केवल जानकारी के लिए है। दवा बदलने से पहले अपने डॉक्टर या फार्मासिस्ट से सलाह जरूर लें।',
    signOut: 'साइन आउट',
    userFallback: 'उपयोगकर्ता',
    micUnsupported: 'इस ब्राउज़र में वॉइस सर्च उपलब्ध नहीं है।',
    ocrEmpty: 'फोटो से कोई टेक्स्ट नहीं पढ़ा जा सका। कृपया साफ फोटो अपलोड करें।',
    ocrError: 'इमेज स्कैन करते समय समस्या आई।',
    savingsUpTo: '85% तक बचाएं',
  },
};

const SUGGESTIONS = ['Crocin', 'Calpol', 'Augmentin', 'Dolo 650'];

/* ---------------------------------------------------------------
   Icons (inline SVG, no extra dependency)
---------------------------------------------------------------- */
const Icon = ({ name, size = 20 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  switch (name) {
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case 'mic':
      return (
        <svg {...common}>
          <rect x="9" y="3" width="6" height="12" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      );
    case 'camera':
      return (
        <svg {...common}>
          <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      );
    case 'pill':
      return (
        <svg {...common}>
          <path d="m10.5 20.5-7-7a4.95 4.95 0 0 1 7-7l7 7a4.95 4.95 0 0 1-7 7Z" />
          <path d="m8.5 8.5 7 7" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 3 5 6v5c0 4.5 3 8.2 7 10 4-1.8 7-5.5 7-10V6l-7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'alert':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16.5v.01" />
        </svg>
      );
    case 'info':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 7.5v.01" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...common}>
          <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9" />
        </svg>
      );
    default:
      return null;
  }
};

/* ---------------------------------------------------------------
   Component
---------------------------------------------------------------- */
function Dashboard({ user, onLogout }) {
  const [q, setQ] = useState('');
  const [list, setList] = useState([]);
  const [state, setState] = useState('idle'); // idle | loading | scanning | done | error
  const [menu, setMenu] = useState(false);
  const [listening, setListening] = useState(false);
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('ds-lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const fileRef = useRef(null);
  const menuRef = useRef(null);
  const t = T[lang];

  /* persist language */
  useEffect(() => {
    try {
      localStorage.setItem('ds-lang', lang);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = lang;
  }, [lang]);

  /* load fonts once */
  useEffect(() => {
    if (document.getElementById('ds-fonts')) return;
    const link = document.createElement('link');
    link.id = 'ds-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  /* close profile menu on outside click */
  useEffect(() => {
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  /* debounced search */
  useEffect(() => {
    if (!q.trim()) {
      setList([]);
      setState('idle');
      return;
    }
    setState('loading');
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(API_URL + encodeURIComponent(q.trim()));
        if (cancelled) return;
        if (!res.ok) {
          setList([]);
          setState('done');
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setList(normalizeResponse(data));
        setState('done');
      } catch (err) {
        if (cancelled) return;
        console.error('API Error:', err);
        setState('error');
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q]);

  /* voice search */
  const speak = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert(t.micUnsupported);
    const r = new SR();
    r.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.onresult = (e) => setQ(e.results[0][0].transcript);
    r.start();
  };

  /* photo search (OCR) */
  const onImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setState('scanning');
    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(file);
      await worker.terminate();

      // first line that actually contains a few letters
      const line = ret.data.text
        .split('\n')
        .map((l) => l.replace(/[^a-zA-Z0-9\s-]/g, '').trim())
        .find((l) => /[a-zA-Z]{3,}/.test(l));

      if (line) {
        setQ(line);
      } else {
        alert(t.ocrEmpty);
        setState('idle');
      }
    } catch (err) {
      console.error('OCR Error:', err);
      alert(t.ocrError);
      setState('idle');
    } finally {
      e.target.value = '';
    }
  };

  const initial = (user?.name || 'U')[0].toUpperCase();
  const busy = state === 'loading' || state === 'scanning';

  return (
    <div className="ds-root" lang={lang}>
      <style>{css}</style>

      {/* ============ TOP BAR ============ */}
      <header className="ds-header">
        <div className="ds-header-inner">
          <div className="ds-logo">
            <span className="ds-logo-mark">
              <Icon name="pill" size={18} />
            </span>
            <span className="ds-logo-text">
              Dawai<span>Saathi</span>
            </span>
          </div>

          <div className="ds-header-actions">
            {/* Language toggle */}
            <div className="ds-lang" role="group" aria-label="Language">
              <button
                type="button"
                className={lang === 'en' ? 'is-active' : ''}
                aria-pressed={lang === 'en'}
                onClick={() => setLang('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={lang === 'hi' ? 'is-active' : ''}
                aria-pressed={lang === 'hi'}
                onClick={() => setLang('hi')}
              >
                हिंदी
              </button>
            </div>

            {/* Profile */}
            <div className="ds-profile" ref={menuRef}>
              <button
                type="button"
                className="ds-avatar"
                onClick={() => setMenu((m) => !m)}
                aria-haspopup="menu"
                aria-expanded={menu}
                aria-label="Account menu"
              >
                {initial}
              </button>

              {menu && (
                <div className="ds-menu" role="menu">
                  <div className="ds-menu-user">
                    <strong>{user?.name || t.userFallback}</strong>
                    {user?.email && <span>{user.email}</span>}
                  </div>
                  <button type="button" className="ds-menu-out" onClick={onLogout} role="menuitem">
                    <Icon name="logout" size={16} />
                    {t.signOut}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="ds-hero">
        <div className="ds-hero-inner">
          <div className="ds-badge">
            <Icon name="shield" size={15} />
            {t.badge}
            <span className="ds-badge-sep" />
            <b>{t.savingsUpTo}</b>
          </div>

          <h1 className="ds-title">{t.heroTitle}</h1>
          <p className="ds-sub">{t.heroSub}</p>

          {/* Search */}
          <div className={`ds-search ${busy ? 'is-busy' : ''}`}>
            <span className="ds-search-icon">
              <Icon name="search" size={20} />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.placeholder}
              aria-label={t.search}
            />
            {q && (
              <button
                type="button"
                className="ds-clear"
                onClick={() => setQ('')}
                aria-label="Clear"
              >
                ×
              </button>
            )}
            <span className="ds-divider" />
            <button
              type="button"
              className={`ds-tool ${listening ? 'is-live' : ''}`}
              onClick={speak}
              title={t.voice}
              aria-label={t.voice}
            >
              <Icon name="mic" />
            </button>
            <button
              type="button"
              className="ds-tool"
              onClick={() => fileRef.current?.click()}
              title={t.photo}
              aria-label={t.photo}
            >
              <Icon name="camera" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={onImage}
            />
          </div>
        </div>
      </section>

      {/* ============ RESULTS ============ */}
      <main className="ds-main">
        {busy && (
          <div className="ds-status">
            <div className="ds-spinner" />
            <p>{state === 'scanning' ? t.scanning : t.searching}</p>
          </div>
        )}

        {state === 'error' && (
          <div className="ds-status is-error">
            <span className="ds-status-icon">
              <Icon name="alert" size={26} />
            </span>
            <h3>{t.errorTitle}</h3>
            <p>{t.errorBody}</p>
          </div>
        )}

        {state === 'done' && !list.length && (
          <div className="ds-status">
            <span className="ds-status-icon">
              <Icon name="search" size={26} />
            </span>
            <h3>{t.noResultsTitle}</h3>
            <p>{t.noResultsBody}</p>
          </div>
        )}

        {state === 'idle' && (
          <div className="ds-status">
            <span className="ds-status-icon">
              <Icon name="pill" size={26} />
            </span>
            <h3>{t.idleTitle}</h3>
            <p>{t.idleBody}</p>
            <div className="ds-chips">
              <span className="ds-chips-label">{t.tryLabel}</span>
              {SUGGESTIONS.map((s) => (
                <button type="button" key={s} onClick={() => setQ(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {state === 'done' &&
          list.map((m) => {
            const ratio =
              m.price > 0 && m.genericPrice > 0
                ? Math.max(6, Math.min(100, (m.genericPrice / m.price) * 100))
                : 0;

            return (
              <article key={m.id} className="ds-card">
                {/* Brand header */}
                <div className="ds-card-head">
                  <div>
                    <h2>{m.brand}</h2>
                    <p className="ds-company">{m.company}</p>
                  </div>
                  <div className="ds-salt">
                    <span>{t.activeSalt}</span>
                    <b>{m.salt}</b>
                  </div>
                </div>

                {m.hasGeneric ? (
                  <>
                    {/* Price comparison */}
                    <div className="ds-compare">
                      <div className="ds-side ds-side-brand">
                        <span className="ds-side-label">{t.brandLabel}</span>
                        <span className="ds-side-name">{m.brand}</span>
                        <span className="ds-price ds-price-old">₹{m.price}</span>
                      </div>

                      <div className="ds-side ds-side-generic">
                        <div className="ds-side-top">
                          <span className="ds-side-label">
                            {t.genericLabel} · {t.janAushadhi}
                          </span>
                          <span className="ds-save-pill">
                            {t.save} {m.savingsPercentage}
                          </span>
                        </div>
                        <span className="ds-side-name">{m.genericName}</span>
                        <span className="ds-price ds-price-new">₹{m.genericPrice}</span>
                        <span className="ds-gov">
                          <Icon name="shield" size={14} />
                          {t.govApproved}
                        </span>
                      </div>
                    </div>

                    {/* Savings meter */}
                    <div className="ds-meter">
                      <div className="ds-meter-track">
                        <div className="ds-meter-fill" style={{ width: `${ratio}%` }} />
                      </div>
                      <div className="ds-meter-row">
                        <span>
                          {t.youSave}
                        </span>
                        <strong>₹{m.savingsAmount}</strong>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="ds-nogeneric">
                    <Icon name="info" size={18} />
                    <span>{t.noGeneric}</span>
                  </div>
                )}

                <p className="ds-disclaimer">{t.disclaimer}</p>
              </article>
            );
          })}
      </main>
    </div>
  );
}

/* ---------------------------------------------------------------
   Styles
---------------------------------------------------------------- */
const css = `
.ds-root {
  --bg: #F4F7F6;
  --surface: #FFFFFF;
  --ink: #10231D;
  --muted: #5B6F67;
  --line: #DCE5E1;
  --brand: #0B5D4B;
  --brand-dark: #08463A;
  --brand-tint: #E4F2EE;
  --saffron: #E39A1F;
  --saffron-tint: #FDF3DC;
  --danger: #B42318;
  --danger-tint: #FEF0EE;
  --radius: 14px;

  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
  font-family: 'Manrope', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  padding-bottom: 56px;
}
.ds-root *, .ds-root *::before, .ds-root *::after { box-sizing: border-box; }
.ds-root button { font-family: inherit; cursor: pointer; }
.ds-root :focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }

/* ---- header ---- */
.ds-header {
  position: sticky; top: 0; z-index: 20;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}
.ds-header-inner {
  max-width: 1040px; margin: 0 auto; padding: 12px 20px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.ds-logo { display: flex; align-items: center; gap: 10px; }
.ds-logo-mark {
  width: 34px; height: 34px; border-radius: 10px;
  background: var(--brand); color: #fff;
  display: grid; place-items: center;
}
.ds-logo-text { font-size: 20px; font-weight: 800; letter-spacing: -0.4px; }
.ds-logo-text span { color: var(--brand); }

.ds-header-actions { display: flex; align-items: center; gap: 14px; }

.ds-lang {
  display: inline-flex; padding: 3px; gap: 2px;
  background: var(--bg); border: 1px solid var(--line); border-radius: 999px;
}
.ds-lang button {
  border: 0; background: transparent; color: var(--muted);
  padding: 6px 14px; border-radius: 999px;
  font-size: 13px; font-weight: 700; transition: background .15s, color .15s;
}
.ds-lang button.is-active { background: var(--brand); color: #fff; }

.ds-profile { position: relative; }
.ds-avatar {
  width: 38px; height: 38px; border-radius: 50%;
  border: 2px solid var(--brand-tint);
  background: var(--brand); color: #fff;
  font-weight: 700; font-size: 15px;
}
.ds-menu {
  position: absolute; right: 0; top: 48px; min-width: 220px;
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 12px; padding: 8px;
  box-shadow: 0 14px 30px -12px rgba(16,35,29,.25);
}
.ds-menu-user { padding: 10px 12px 12px; border-bottom: 1px solid var(--line); margin-bottom: 6px; display: flex; flex-direction: column; gap: 2px; }
.ds-menu-user strong { font-size: 14px; }
.ds-menu-user span { font-size: 12px; color: var(--muted); word-break: break-all; }
.ds-menu-out {
  width: 100%; display: flex; align-items: center; gap: 8px;
  padding: 9px 12px; border: 0; border-radius: 8px;
  background: transparent; color: var(--danger); font-weight: 600; font-size: 14px;
  text-align: left;
}
.ds-menu-out:hover { background: var(--danger-tint); }

/* ---- hero ---- */
.ds-hero {
  background:
    radial-gradient(900px 300px at 85% -10%, rgba(227,154,31,.14), transparent 60%),
    linear-gradient(180deg, #fff 0%, var(--bg) 100%);
  border-bottom: 1px solid var(--line);
  padding: 56px 20px 48px;
}
.ds-hero-inner { max-width: 720px; margin: 0 auto; }
.ds-badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 14px 6px 10px; border-radius: 999px;
  background: var(--brand-tint); color: var(--brand-dark);
  font-size: 13px; font-weight: 600;
}
.ds-badge-sep { width: 1px; height: 14px; background: rgba(11,93,75,.3); }
.ds-badge b { color: #9A6204; font-weight: 700; }

.ds-title {
  margin: 20px 0 12px;
  font-size: clamp(34px, 6vw, 52px);
  line-height: 1.08; letter-spacing: -1.4px; font-weight: 800;
}
.ds-root[lang='hi'] .ds-title { letter-spacing: 0; line-height: 1.25; }
.ds-sub { margin: 0 0 30px; max-width: 580px; color: var(--muted); font-size: 16.5px; line-height: 1.6; }

/* ---- search ---- */
.ds-search {
  display: flex; align-items: center; gap: 4px;
  background: var(--surface); border: 1.5px solid var(--line);
  border-radius: 16px; padding: 8px 8px 8px 16px;
  box-shadow: 0 18px 36px -22px rgba(16,35,29,.35);
  transition: border-color .15s, box-shadow .15s;
}
.ds-search:focus-within { border-color: var(--brand); box-shadow: 0 0 0 4px rgba(11,93,75,.12), 0 18px 36px -22px rgba(16,35,29,.35); }
.ds-search-icon { color: var(--muted); display: grid; place-items: center; }
.ds-search input {
  flex: 1; min-width: 0; border: 0; outline: none; background: transparent;
  padding: 12px 8px; font-size: 16px; font-family: inherit; color: var(--ink);
}
.ds-search input::placeholder { color: #8DA098; }
.ds-clear {
  border: 0; background: var(--bg); color: var(--muted);
  width: 26px; height: 26px; border-radius: 50%; font-size: 18px; line-height: 1;
}
.ds-divider { width: 1px; height: 26px; background: var(--line); margin: 0 6px; }
.ds-tool {
  width: 44px; height: 44px; border-radius: 12px; border: 0;
  background: var(--bg); color: var(--ink);
  display: grid; place-items: center;
  transition: background .15s, color .15s;
}
.ds-tool:hover { background: var(--brand-tint); color: var(--brand); }
.ds-tool.is-live { background: var(--danger); color: #fff; animation: ds-pulse 1.2s infinite; }
@keyframes ds-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(180,35,24,.45);} 50% { box-shadow: 0 0 0 8px rgba(180,35,24,0);} }

/* ---- main ---- */
.ds-main { max-width: 720px; margin: 32px auto 0; padding: 0 20px; }

.ds-status {
  text-align: center; background: var(--surface);
  border: 1px dashed var(--line); border-radius: var(--radius);
  padding: 44px 24px;
}
.ds-status h3 { margin: 12px 0 6px; font-size: 18px; }
.ds-status p { margin: 0; color: var(--muted); font-size: 14.5px; line-height: 1.55; }
.ds-status-icon {
  display: inline-grid; place-items: center; width: 52px; height: 52px;
  border-radius: 14px; background: var(--brand-tint); color: var(--brand);
}
.ds-status.is-error { border-style: solid; border-color: #F4C7C2; background: var(--danger-tint); }
.ds-status.is-error .ds-status-icon { background: #FBD9D5; color: var(--danger); }
.ds-status.is-error h3 { color: var(--danger); }

.ds-chips { margin-top: 22px; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; }
.ds-chips-label { font-size: 12.5px; color: var(--muted); font-weight: 600; margin-right: 4px; }
.ds-chips button {
  border: 1px solid var(--line); background: var(--surface); color: var(--ink);
  padding: 7px 14px; border-radius: 999px; font-size: 13.5px; font-weight: 600;
  transition: border-color .15s, background .15s, color .15s;
}
.ds-chips button:hover { border-color: var(--brand); background: var(--brand-tint); color: var(--brand-dark); }

.ds-spinner {
  width: 30px; height: 30px; margin: 0 auto 14px; border-radius: 50%;
  border: 3px solid var(--brand-tint); border-top-color: var(--brand);
  animation: ds-spin .8s linear infinite;
}
@keyframes ds-spin { to { transform: rotate(360deg); } }

/* ---- result card ---- */
.ds-card {
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 20px; padding: 26px; margin-bottom: 20px;
  box-shadow: 0 24px 40px -32px rgba(16,35,29,.45);
}
.ds-card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
.ds-card-head h2 { margin: 0; font-size: 26px; letter-spacing: -0.5px; font-weight: 800; }
.ds-company { margin: 4px 0 0; color: var(--muted); font-size: 14px; }
.ds-salt {
  display: flex; flex-direction: column; gap: 2px; align-items: flex-end; text-align: right;
}
.ds-salt span { font-size: 12px; color: var(--muted); font-weight: 600; }
.ds-salt b {
  font-size: 13.5px; font-weight: 700; color: var(--brand-dark);
  background: var(--brand-tint); padding: 5px 12px; border-radius: 8px;
}

.ds-compare {
  margin-top: 24px; display: grid; grid-template-columns: 1fr 1.25fr; gap: 14px;
}
.ds-side {
  border-radius: 16px; padding: 18px; display: flex; flex-direction: column; gap: 6px;
}
.ds-side-brand { background: var(--bg); border: 1px solid var(--line); }
.ds-side-generic {
  background: var(--brand); color: #fff;
  background-image: radial-gradient(260px 140px at 100% 0%, rgba(227,154,31,.28), transparent 70%);
}
.ds-side-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
.ds-side-label { font-size: 12.5px; font-weight: 600; opacity: .78; }
.ds-side-brand .ds-side-label { color: var(--muted); opacity: 1; }
.ds-side-name { font-size: 16px; font-weight: 700; line-height: 1.3; word-break: break-word; }
.ds-price { font-size: 32px; font-weight: 800; letter-spacing: -0.8px; margin-top: 4px; font-variant-numeric: tabular-nums; }
.ds-price-old { color: var(--muted); text-decoration: line-through; text-decoration-thickness: 2px; text-decoration-color: rgba(91,111,103,.55); }
.ds-price-new { color: #fff; font-size: 38px; }
.ds-save-pill {
  background: var(--saffron); color: #2B1B00;
  padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 800;
}
.ds-gov { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; opacity: .85; margin-top: 2px; }

.ds-meter { margin-top: 20px; }
.ds-meter-track { height: 10px; border-radius: 999px; background: var(--saffron-tint); overflow: hidden; border: 1px solid #F1DDA8; }
.ds-meter-fill { height: 100%; background: var(--brand); border-radius: 999px; transition: width .6s ease; }
.ds-meter-row { margin-top: 10px; display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; color: var(--muted); font-weight: 600; }
.ds-meter-row strong { font-size: 22px; color: var(--brand-dark); font-weight: 800; font-variant-numeric: tabular-nums; }

.ds-nogeneric {
  margin-top: 22px; display: flex; gap: 10px; align-items: flex-start;
  background: var(--saffron-tint); border: 1px solid #F1DDA8; color: #6B4503;
  padding: 14px 16px; border-radius: 12px; font-size: 14px; line-height: 1.5;
}
.ds-nogeneric svg { flex-shrink: 0; margin-top: 2px; }

.ds-disclaimer {
  margin: 20px 0 0; padding-top: 16px; border-top: 1px solid var(--line);
  font-size: 12.5px; color: var(--muted); line-height: 1.55;
}

/* ---- responsive ---- */
@media (max-width: 600px) {
  .ds-hero { padding: 36px 16px 32px; }
  .ds-main { padding: 0 16px; margin-top: 24px; }
  .ds-card { padding: 20px; }
  .ds-compare { grid-template-columns: 1fr; }
  .ds-salt { align-items: flex-start; text-align: left; }
  .ds-badge { font-size: 12px; flex-wrap: wrap; }
  .ds-badge-sep { display: none; }
  .ds-header-inner { padding: 10px 16px; }
  .ds-logo-text { font-size: 18px; }
  .ds-tool { width: 40px; height: 40px; }
}

@media (prefers-reduced-motion: reduce) {
  .ds-root * { animation: none !important; transition: none !important; }
}
`;

export default Dashboard;