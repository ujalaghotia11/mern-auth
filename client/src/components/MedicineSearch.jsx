import React, { useState } from 'react';

const MedicineSearch = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Text Search Handler
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`http://localhost:5000/api/medicines/search?query=${query}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Medicine not found');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Voice Input Handler (Web Speech API)
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser does not support Voice Search!");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Voice recognition started...');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
    };

    recognition.start();
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', textAlign: 'center' }}>
      <h2>Find Generic & Jan Aushadhi Substitutes</h2>
      
      {/* Search Input Box */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type medicine name (e.g. Crocin)..."
          style={{ flex: 1, padding: '10px', fontSize: '16px' }}
        />
        
        {/* Voice Search Button */}
        <button type="button" onClick={handleVoiceInput} style={{ padding: '10px 15px', cursor: 'pointer' }}>
          🎤 Mic
        </button>

        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Search
        </button>
      </form>

      {/* Loading state */}
      {loading && <p>Searching medicine data...</p>}

      {/* Error state */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Results Display */}
      {result && (
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', textAlign: 'left' }}>
          <h3>Searched Medicine</h3>
          <p><strong>Brand Name:</strong> {result.searchedBrand.brandName}</p>
          <p><strong>Active Salt:</strong> {result.saltName} ({result.strength})</p>
          <p><strong>Brand Price:</strong> ₹{result.searchedBrand.price}</p>

          <hr />

          <h3 style={{ color: 'green' }}>Cheaper Govt / Jan Aushadhi Option</h3>
          {result.substitutes.length > 0 ? (
            result.substitutes.map((sub) => (
              <div key={sub._id} style={{ backgroundColor: '#e9f7ef', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
                <p><strong>Generic Name:</strong> {sub.brandName}</p>
                <p><strong>Govt Price:</strong> ₹{sub.price}</p>
                <p style={{ color: 'green', fontWeight: 'bold' }}>
                  Aapki Bachat (Savings): ₹{sub.savingsAmount} ({sub.savingsPercentage} OFF) 🎉
                </p>
              </div>
            ))
          ) : (
            <p>No exact generic match found in database for this dosage.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicineSearch;