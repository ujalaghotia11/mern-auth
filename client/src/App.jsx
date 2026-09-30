import { useState } from 'react';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    setLoggedInUser(userData);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
  };

  return (
    <div>
      {loggedInUser ? (
        <Dashboard user={loggedInUser} onLogout={handleLogout} />
      ) : (
        <SignUp onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;