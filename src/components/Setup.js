"use client";

import { useState } from 'react';
import { initSupabase } from '@/lib/supabaseClient';

export default function Setup({ onComplete }) {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleConnect = () => {
    if (!url || !key) {
      setError('Please provide both URL and Anon Key.');
      return;
    }
    
    try {
      initSupabase(url.trim(), key.trim());
      onComplete();
    } catch (e) {
      setError('Failed to connect to Supabase. Check your credentials.');
    }
  };

  const handleLocalMode = () => {
    localStorage.setItem('USE_LOCAL_STORAGE', 'true');
    onComplete();
  };

  return (
    <div style={{
      width: '100vw', height: '100vh', 
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      backgroundColor: 'var(--bg-color)',
      backgroundImage: 'var(--bg-pattern)',
      fontFamily: 'var(--font-note)'
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-xl)',
        width: '90%',
        maxWidth: '500px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h1 style={{ margin: 0, fontSize: '36px', textAlign: 'center', color: '#1a1a1a' }}>
          Connect Database 📌
        </h1>
        <p style={{ margin: 0, fontSize: '18px', textAlign: 'center', color: '#666', lineHeight: '1.4' }}>
          Welcome to Perfy Pinboard! To get started, please connect your personal Supabase database.
        </p>

        {error && <div style={{ color: 'red', fontSize: '16px', textAlign: 'center' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '18px', color: '#1a1a1a', fontWeight: 'bold' }}>Supabase URL</label>
          <input 
            type="text" 
            placeholder="https://your-project.supabase.co"
            value={url}
            onChange={e => setUrl(e.target.value)}
            style={{ padding: '12px', fontSize: '18px', borderRadius: '6px', border: '2px solid #ccc', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '18px', color: '#1a1a1a', fontWeight: 'bold' }}>Supabase Anon Key</label>
          <input 
            type="password" 
            placeholder="eyJhbGci..."
            value={key}
            onChange={e => setKey(e.target.value)}
            style={{ padding: '12px', fontSize: '18px', borderRadius: '6px', border: '2px solid #ccc', outline: 'none' }}
          />
        </div>

        <button 
          onClick={handleConnect}
          style={{ 
            marginTop: '10px',
            padding: '15px', 
            fontSize: '22px', 
            fontWeight: 'bold',
            backgroundColor: '#1a1a1a', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer' 
          }}
        >
          Connect & Start 🚀
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e5e5' }}></div>
          <span style={{ padding: '0 10px', color: '#888', fontSize: '14px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e5e5' }}></div>
        </div>

        <button 
          onClick={handleLocalMode}
          style={{ 
            padding: '15px', 
            fontSize: '18px', 
            fontWeight: 'bold',
            backgroundColor: '#f5f5f5', 
            color: '#1a1a1a', 
            border: '2px solid #e5e5e5', 
            borderRadius: '6px', 
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={e => e.target.style.backgroundColor = '#eaeaea'}
          onMouseOut={e => e.target.style.backgroundColor = '#f5f5f5'}
        >
          Use Offline Local Storage 💾
        </button>
      </div>
    </div>
  );
}
