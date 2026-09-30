function Dashboard({ user, onLogout }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.avatar}>👤</div>
        <h2 style={styles.title}>Welcome, {user?.name || 'User'}! 🎉</h2>
        <p style={styles.email}>{user?.email}</p>
        <div style={styles.badge}>Status: Active Session</div>

        <p style={styles.text}>
          Aap successfully sign in ho chuke hain! Ye aapka main dashboard screen hai.
        </p>

        <button onClick={onLogout} style={styles.logoutBtn}>
          Sign Out
        </button>
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
    maxWidth: '380px',
    backgroundColor: '#181825',
    borderRadius: '12px',
    padding: '28px 24px',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
    border: '1px solid #2e2e42',
    textAlign: 'center'
  },
  avatar: {
    fontSize: '44px',
    marginBottom: '8px'
  },
  title: {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 4px 0'
  },
  email: {
    color: '#b4befe',
    fontSize: '13px',
    margin: '0 0 16px 0'
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    backgroundColor: 'rgba(166, 227, 161, 0.1)',
    color: '#a6e3a1',
    border: '1px solid #a6e3a1',
    fontSize: '11px',
    fontWeight: '600',
    marginBottom: '16px'
  },
  text: {
    color: '#9399b2',
    fontSize: '13px',
    lineHeight: '1.5',
    marginBottom: '24px'
  },
  logoutBtn: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#f38ba8',
    color: '#11111b',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer'
  }
};

export default Dashboard;