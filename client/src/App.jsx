import { useState } from 'react';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
// import MedicineSearch from './components/MedicineSearch'; // Step 3 wala MedicineSearch import karein

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
        <div>
          {/* Dashboard Header / User Info */}
          <Dashboard user={loggedInUser} onLogout={handleLogout} />
          
          <hr />
          
          {/* Medicine Search Component Login hone ke baad yahan dikhega */}
          {/* <MedicineSearch /> */}
        </div>
      ) : (
        <SignUp onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;