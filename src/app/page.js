"use client";

import { useState, useEffect } from 'react';
import Board from '@/components/Board';
import Setup from '@/components/Setup';
import { getSupabase } from '@/lib/supabaseClient';
import { Capacitor } from '@capacitor/core';

export default function Home() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    try {
      const isNative = Capacitor.isNativePlatform();
      const isLocal = isNative || localStorage.getItem('USE_LOCAL_STORAGE') === 'true';
      if (isLocal || getSupabase()) {
        setIsConfigured(true);
      }
    } catch (e) {
      // If getSupabase throws, we shouldn't crash the app!
    }
    setIsChecking(false);
  }, []);

  if (isChecking) return null;

  return (
    <main style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {isConfigured ? <Board /> : <Setup onComplete={() => setIsConfigured(true)} />}
    </main>
  );
}
