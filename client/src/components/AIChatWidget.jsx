import React, { useState } from 'react';
import axios from 'axios';

// Netlify environment variable ya fallback live URL
const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://mern-auth-1xna.onrender.com';

function AIChatWidget({ currentMedicine }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hi! Ask me anything about medicine uses, generic alternatives, or dosages.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      // Backend AI route par request bhej rahe hain
      const res = await axios.post(`${BACKEND_URL}/api/ai/chat`, {
        message: userMessage,
        medicineContext: currentMedicine
      });

      setMessages(prev => [...prev, { sender: 'ai', text: res.data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I am having trouble connecting to the AI right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          style={{ backgroundColor: '#16a34a', color: 'white', padding: '12px 20px', borderRadius: '30px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
        >
          💬 Ask AI Health Assistant
        </button>
      ) : (
        <div style={{ width: '320px', height: '400px', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}>
          <div style={{ backgroundColor: '#16a34a', color: 'white', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
            <span>DawaiSaathi AI</span>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '16px', cursor: 'pointer' }}>✕</button>
          </div>
          
          <div style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
            {messages.map((msg, index) => (
              <div key={index} style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: msg.sender === 'user' ? '#dcfce7' : '#f3f4f6', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                {msg.text}
              </div>
            ))}
            {loading && <div style={{ fontStyle: 'italic', color: '#666', fontSize: '12px' }}>AI is typing...</div>}
          </div>

          <div style={{ padding: '10px', borderTop: '1px solid #eee', display: 'flex', gap: '5px' }}>
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Ask about uses or salts..."
              style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIChatWidget;