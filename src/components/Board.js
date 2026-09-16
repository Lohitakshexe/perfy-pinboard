"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Note from './Note';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

export default function Board() {
  const [notes, setNotes] = useState([]);
  const [archivedNotes, setArchivedNotes] = useState([]);
  const [showColors, setShowColors] = useState(false);
  const [viewMode, setViewMode] = useState('board'); // 'board' or 'archive'
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState('classic'); // 'classic' or 'minimalist'

  useEffect(() => {
    const savedTheme = localStorage.getItem('perfy-theme') || 'classic';
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (theme === 'minimalist') {
      document.body.classList.add('theme-minimalist');
    } else {
      document.body.classList.remove('theme-minimalist');
    }
    localStorage.setItem('perfy-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (viewMode === 'board') fetchNotes();
    else fetchArchivedNotes();
  }, [viewMode]);

  const fetchNotes = async () => {
    const { data, error } = await supabase.from('notes').select('*').is('deleted_at', null);
    if (error) console.error('Error fetching notes:', error);
    else setNotes(data || []);
  };

  const fetchArchivedNotes = async () => {
    const { data, error } = await supabase.from('notes').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false });
    if (error) console.error('Error fetching archived notes:', error);
    else setArchivedNotes(data || []);
  };

  const addNote = async (color) => {
    const id = Date.now().toString();
    const newNote = {
      id: id,
      title: 'New Note',
      content: '',
      color: color,
      x: Math.floor(window.innerWidth / 2 - 100 + (Math.random() * 50 - 25)),
      y: Math.floor(window.innerHeight / 2 - 100 + (Math.random() * 50 - 25)),
      width: 250,
      height: 250
    };

    // Optimistic UI
    setNotes([...notes, newNote]);
    setShowColors(false);

    const { data, error } = await supabase.from('notes').insert([newNote]).select();
    if (error) {
      console.error('Error adding note:', error);
      setNotes(notes);
    } else if (data) {
      setNotes(prev => prev.map(n => n.id === id ? data[0] : n));
    }
  };

  const updateNote = async (id, updates) => {
    setNotes(notes.map(n => n.id === id ? { ...n, ...updates } : n));
    const { error } = await supabase.from('notes').update(updates).eq('id', id);
    if (error) {
      console.error('Error updating note:', error);
      fetchNotes();
    }
  };

  const deleteNote = async (id) => {
    // Soft delete (archive)
    setNotes(notes.filter(n => n.id !== id));
    const { error } = await supabase.from('notes').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      console.error('Error archiving note:', error);
      fetchNotes();
    }
  };

  const restoreNote = async (id) => {
    setArchivedNotes(archivedNotes.filter(n => n.id !== id));
    const { error } = await supabase.from('notes').update({ deleted_at: null }).eq('id', id);
    if (error) fetchArchivedNotes();
  };

  const permanentDelete = async (id) => {
    setArchivedNotes(archivedNotes.filter(n => n.id !== id));
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) fetchArchivedNotes();
  };

  // Filter notes based on search query
  const filteredArchivedNotes = archivedNotes.filter(n => 
    (n.title && n.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
    (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group archived notes by date
  const groupedArchived = filteredArchivedNotes.reduce((acc, note) => {
    const dateStr = new Date(note.deleted_at).toLocaleDateString();
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(note);
    return acc;
  }, {});
  const dates = Object.keys(groupedArchived);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Top Bar with Search (only in archive) */}
      <div style={{ position: 'absolute', top: '20px', left: '0', right: '0', display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', padding: '0 20px', zIndex: 10 }}>
        {viewMode === 'archive' && (
          <input 
            className="note-font"
            placeholder="Search archive..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '10px 20px', fontSize: '24px', borderRadius: '25px', border: '2px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.9)', boxShadow: 'var(--shadow-md)', width: '250px', outline: 'none', color: '#1a1a1a' }}
          />
        )}
      </div>

      {/* Centered Title - Click to toggle theme */}
      <h1 className="note-font" 
        onClick={() => setTheme(theme === 'classic' ? 'minimalist' : 'classic')}
        style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%) rotate(-2deg)',
        fontSize: '48px',
        color: '#f8fafc',
        textShadow: '2px 4px 6px rgba(0,0,0,0.5)',
        margin: 0,
        pointerEvents: 'auto',
        cursor: 'pointer',
        textAlign: 'center',
        zIndex: 10,
        transition: 'transform 0.2s',
      }}>
        Perfy pinboard
      </h1>

      {viewMode === 'board' ? (
        <>
          <TransformWrapper
            initialScale={1}
            minScale={0.1}
            maxScale={3}
            limitToBounds={false}
            centerOnInit={false}
            panning={{ excluded: ['no-pan'] }}
          >
            <TransformComponent wrapperStyle={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
              <div className="cork-board">
                {notes.map(note => (
                  <Note 
                    key={note.id} 
                    note={note} 
                    updateNote={updateNote} 
                    deleteNote={deleteNote} 
                  />
                ))}
              </div>
            </TransformComponent>
          </TransformWrapper>

          {showColors && (
            <div className="note-colors-picker">
              <button className="color-btn bg-navy" onClick={() => addNote('navy')} />
              <button className="color-btn bg-plum" onClick={() => addNote('plum')} />
              <button className="color-btn bg-slate" onClick={() => addNote('slate')} />
              <button className="color-btn bg-grey" onClick={() => addNote('grey')} />
              <button className="color-btn bg-olive" onClick={() => addNote('olive')} />
              <button className="color-btn bg-pink" onClick={() => addNote('pink')} />
              <button className="color-btn bg-green" onClick={() => addNote('green')} />
              <button className="color-btn bg-blue" onClick={() => addNote('blue')} />
            </div>
          )}
        </>
      ) : (
        /* Archive View */
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 5, padding: '100px 40px 40px 40px', display: 'flex', gap: '20px' }}>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '40px', paddingRight: '20px' }}>
            {dates.length === 0 ? (
              <h2 className="note-font" style={{ color: 'white', fontSize: '32px', textAlign: 'center', marginTop: '100px' }}>No archived notes yet.</h2>
            ) : (
              dates.map(date => (
                <div key={date} id={`date-${date}`}>
                  <h2 className="note-font" style={{ color: 'white', fontSize: '36px', borderBottom: '2px dashed rgba(255,255,255,0.2)', paddingBottom: '10px', marginBottom: '20px' }}>{date}</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                    {groupedArchived[date].map(note => (
                      <div key={note.id} style={{ width: '250px', height: '250px', backgroundColor: `var(--note-${note.color || 'yellow'})`, padding: '20px', borderRadius: '2px 2px 10px 2px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        <h3 className="note-font" style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1a1a1a' }}>{note.title}</h3>
                        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                          <p className="note-font" style={{ fontSize: '16px', color: '#444', overflow: 'hidden', whiteSpace: 'pre-wrap' }}>{note.content}</p>
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30px', background: `linear-gradient(transparent, var(--note-${note.color || 'yellow'}))` }} />
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                          <button className="note-font" onClick={() => restoreNote(note.id)} style={{ padding: '5px 15px', background: 'transparent', color: '#1a1a1a', border: '2px solid #1a1a1a', borderRadius: '4px', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}>Restore</button>
                          <button className="note-font" onClick={() => permanentDelete(note.id)} style={{ padding: '5px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '18px' }}>Destroy</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Timeline Slider */}
          {dates.length > 0 && (
            <div style={{ width: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', borderLeft: '2px dashed rgba(255,255,255,0.2)' }}>
              {dates.map(date => (
                <button 
                  key={`timeline-${date}`}
                  className="note-font timeline-btn"
                  onClick={() => document.getElementById(`date-${date}`)?.scrollIntoView({ behavior: 'smooth' })}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '24px', cursor: 'pointer', transition: 'all 0.2s', padding: '5px' }}
                >
                  {date.split('/')[0]}/{date.split('/')[1]}
                </button>
              ))}
            </div>
          )}

          <style jsx>{`
            .timeline-btn:hover {
              color: white !important;
              transform: scale(1.2);
            }
          `}</style>
        </div>
      )}

      {/* The Unified Bottom Dock */}
      <div className="dock-container">
        <button className="dock-btn note-font" onClick={() => setViewMode(viewMode === 'board' ? 'archive' : 'board')} title={viewMode === 'board' ? "Archive" : "Board"}>
          {theme === 'minimalist' ? (
            viewMode === 'board' ? 
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg> :
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          ) : (viewMode === 'board' ? '📦' : '📌')}
        </button>
        
        {viewMode === 'board' && (
          <>
            <div id="trash-bin" className="trash-bin dock-btn note-font" title="Drag here to delete">
              {theme === 'minimalist' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              ) : '🗑️'}
            </div>
            <button className="dock-btn note-font" onClick={() => setShowColors(!showColors)} title="Add Note">
              {theme === 'minimalist' ? (
                showColors ? 
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> :
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              ) : (showColors ? '✕' : '➕')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
