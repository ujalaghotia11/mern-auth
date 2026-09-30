import { useState } from 'react';
import axios from 'axios';

function AuthForm({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setMessage('');
  };

  const validate = () => {
    if (isSignUp && !formData.name.trim()) {
      setError('Full name is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isSignUp) {
        // Sign Up Flow
        const res = await axios.post('http://localhost:5000/api/auth/register', formData);
        setMessage(res.data.message || 'Account created successfully!');
        
        setTimeout(() => {
          setIsSignUp(false);
          setMessage('Account created! Please sign in.');
          setFormData({ name: '', email: '', password: '' });
        }, 1500);
      } else {
        // Sign In Flow
        const res = await axios.post('http://localhost:5000/api/auth/login', {
          email: formData.email,
          password: formData.password
        });

        // YE MAIN STEP HAI: User Data milte hi App.jsx me State Update Karein
        if (onLoginSuccess && res.data.user) {
          onLoginSuccess(res.data.user);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.brandHeader}>
          <div style={styles.logoBadge}>✨</div>
          <span style={styles.brandTitle}>DevPortal</span>
        </div>

        <div style={styles.tabContainer}>
          <button
            style={{ ...styles.tab, ...(isSignUp ? styles.activeTab : {}) }}
            onClick={() => { setIsSignUp(true); setError(''); setMessage(''); }}
          >
            Create Account
          </button>
          <button
            style={{ ...styles.tab, ...(!isSignUp ? styles.activeTab : {}) }}
            onClick={() => { setIsSignUp(false); setError(''); setMessage(''); }}
          >
            Sign In
          </button>
        </div>

        <h3 style={styles.heading}>{isSignUp ? 'Get Started' : 'Welcome Back'}</h3>
        <p style={styles.subheading}>
          {isSignUp ? 'Fill in your details to register.' : 'Enter your credentials to continue.'}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {isSignUp && (
            <div style={styles.inputField}>
              <label style={styles.label}>FULL NAME</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.inputField}>
            <label style={styles.label}>EMAIL ADDRESS</label>
            <input
              type="email"
              name="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.inputField}>
            <label style={styles.label}>PASSWORD</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
            />
            {isSignUp && <span style={styles.helperText}>Min 6 characters required</span>}
          </div>

          {error && <div style={styles.errorBanner}>{error}</div>}
          {message && <div style={styles.successBanner}>{message}</div>}

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>
            {isSignUp ? 'Already registered?' : 'New here?'}
          </span>
          <button
            type="button"
            style={styles.switchLink}
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
          >
            {isSignUp ? 'Sign In' : 'Create an Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at top, #1e1e2e 0%, #0f0f17 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '16px'
  },
  card: {
    width: '100%',
    maxWidth: '360px',
    backgroundColor: '#181825',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
    border: '1px solid #2e2e42'
  },
  brandHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '16px'
  },
  logoBadge: {
    width: '24px',
    height: '24px',
    backgroundColor: '#6c5ce7',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px'
  },
  brandTitle: {
    color: '#f8f8f2',
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '0.5px'
  },
  tabContainer: {
    display: 'flex',
    backgroundColor: '#11111b',
    borderRadius: '8px',
    padding: '3px',
    marginBottom: '16px'
  },
  tab: {
    flex: 1,
    padding: '7px 0',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#a6adc8',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  activeTab: {
    backgroundColor: '#313244',
    color: '#ffffff',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
  },
  heading: {
    margin: '0 0 4px 0',
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: '600',
    textAlign: 'center'
  },
  subheading: {
    margin: '0 0 16px 0',
    color: '#9399b2',
    fontSize: '12px',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  inputField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  label: {
    color: '#b4befe',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.6px'
  },
  input: {
    padding: '9px 12px',
    borderRadius: '6px',
    border: '1px solid #313244',
    backgroundColor: '#11111b',
    color: '#cdd6f4',
    fontSize: '13px',
    outline: 'none'
  },
  helperText: {
    color: '#6c7086',
    fontSize: '10px'
  },
  submitBtn: {
    marginTop: '4px',
    padding: '10px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#6c5ce7',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  errorBanner: {
    padding: '8px',
    borderRadius: '6px',
    backgroundColor: 'rgba(243, 139, 168, 0.1)',
    border: '1px solid #f38ba8',
    color: '#f38ba8',
    fontSize: '11px',
    textAlign: 'center'
  },
  successBanner: {
    padding: '8px',
    borderRadius: '6px',
    backgroundColor: 'rgba(166, 227, 161, 0.1)',
    border: '1px solid #a6e3a1',
    color: '#a6e3a1',
    fontSize: '11px',
    textAlign: 'center'
  },
  footer: {
    marginTop: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },
  footerText: {
    color: '#9399b2',
    fontSize: '12px'
  },
  switchLink: {
    background: 'none',
    border: 'none',
    color: '#b4befe',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'underline'
  }
};

export default AuthForm;