"use client"

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTransformContext } from 'react-zoom-pan-pinch';

export default function Note({ note, updateNote, deleteNote }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const noteRef = useRef(null);
  const actionHasOccurred = useRef(false);
  
  const rawColor = note.color || 'yellow';
  const colorParts = rawColor.split(':');
  const baseColor = colorParts[0];
  const initialScale = colorParts[1] ? parseFloat(colorParts[1]) : 1;

  const [position, setPosition] = useState({ x: note.x || 100, y: note.y || 100 });
  const [size, setSize] = useState({ width: note.width || 200, height: note.height || 200 });
  const [noteScale, setNoteScale] = useState(initialScale);

  const currentPos = useRef({ x: note.x || 100, y: note.y || 100 });
  const currentSize = useRef({ width: note.width || 200, height: note.height || 200 });
  const currentScale = useRef(initialScale);
  const isOverBin = useRef(false);

  useEffect(() => { currentPos.current = { x: position.x, y: position.y }; }, [position]);
  useEffect(() => { currentSize.current = { width: size.width, height: size.height }; }, [size]);
  useEffect(() => { currentScale.current = noteScale; }, [noteScale]);

  
  // Handlers for edit
  const [title, setTitle] = useState(note.title || 'New Note');
  const [content, setContent] = useState(note.content || '');

  const transformContext = useTransformContext();
  const scale = transformContext?.transformState?.scale || 1;

  const handlePointerDown = (e) => {
    if (isExpanded) return; // Don't drag when expanded
    if (e.target.closest('.no-drag')) return; // Ignore drag on buttons/inputs
    e.stopPropagation(); // Prevent react-zoom-pan-pinch from panning the board while dragging

    actionHasOccurred.current = false;
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = currentPos.current.x;
    const startPosY = currentPos.current.y;

    const trashBin = document.getElementById('trash-bin');

    const handlePointerMove = (moveEvent) => {
      // If we move more than a couple pixels, consider it a drag
      if (Math.abs(moveEvent.clientX - startX) > 3 || Math.abs(moveEvent.clientY - startY) > 3) {
        actionHasOccurred.current = true;
      }
      
      const newX = startPosX + (moveEvent.clientX - startX) / scale;
      const newY = startPosY + (moveEvent.clientY - startY) / scale;
      
      currentPos.current = { x: newX, y: newY };
      
      if (noteRef.current) {
        noteRef.current.style.left = `${newX}px`;
        noteRef.current.style.top = `${newY}px`;
      }

      // Trash bin hit detection
      if (trashBin) {
        const binRect = trashBin.getBoundingClientRect();
        if (
          moveEvent.clientX > binRect.left &&
          moveEvent.clientX < binRect.right &&
          moveEvent.clientY > binRect.top &&
          moveEvent.clientY < binRect.bottom
        ) {
          isOverBin.current = true;
          trashBin.classList.add('active');
          if (noteRef.current) noteRef.current.style.opacity = '0.5';
        } else {
          isOverBin.current = false;
          trashBin.classList.remove('active');
          if (noteRef.current) noteRef.current.style.opacity = '1';
        }
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      if (trashBin) trashBin.classList.remove('active');
      if (noteRef.current) noteRef.current.style.opacity = '1';

      if (isOverBin.current) {
        deleteNote(note.id);
        isOverBin.current = false;
      } else {
        setPosition(currentPos.current);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleResizeDown = (e, type = 'both') => {
    e.stopPropagation();
    if (isExpanded) return;

    actionHasOccurred.current = false;
    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = currentSize.current.width;
    const startHeight = currentSize.current.height;
    const startScale = currentScale.current;

    // Use the scale from the transform context already available in the component scope
    const zoomScale = scale;

    const handlePointerMove = (moveEvent) => {
      if (Math.abs(moveEvent.clientX - startX) > 3 || Math.abs(moveEvent.clientY - startY) > 3) {
        actionHasOccurred.current = true;
      }
      const deltaX = (moveEvent.clientX - startX) / zoomScale;
      const deltaY = (moveEvent.clientY - startY) / zoomScale;
      
      if (type === 'both') {
        const scaleDelta = deltaX / startWidth;
        const newScale = Math.max(0.3, startScale + scaleDelta);
        currentScale.current = newScale;
        if (noteRef.current) {
          noteRef.current.style.scale = newScale;
        }
      } else {
        const newWidth = Math.max(150, startWidth + (type === 'vertical' ? 0 : deltaX / startScale));
        const newHeight = Math.max(150, startHeight + (type === 'horizontal' ? 0 : deltaY / startScale));
        
        currentSize.current = { width: newWidth, height: newHeight };
        
        if (noteRef.current) {
          noteRef.current.style.width = `${newWidth}px`;
          noteRef.current.style.height = `${newHeight}px`;
        }
      }
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      setSize(currentSize.current);
      setNoteScale(currentScale.current);
      
      const safeWidth = Math.round(currentSize.current.width) || 200;
      const safeHeight = Math.round(currentSize.current.height) || 200;
      const safeScale = (!isNaN(currentScale.current) ? currentScale.current : 1).toFixed(2);
      
      updateNote(note.id, { 
        width: safeWidth, 
        height: safeHeight,
        color: `${baseColor}:${safeScale}`
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  useEffect(() => {
    // Only update Supabase when drag or resize finishes and positions actually changed
    if (!isDragging && !isResizing && (position.x !== note.x || position.y !== note.y || size.width !== note.width || size.height !== note.height)) {
       updateNote(note.id, { 
         x: Math.round(position.x), 
         y: Math.round(position.y), 
         width: Math.round(size.width), 
         height: Math.round(size.height) 
       });
    }
  }, [isDragging, isResizing]);

  const handleSave = () => {
    updateNote(note.id, { title, content });
  };

  const toggleCheck = (e, lineIndex) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (actionHasOccurred.current) return;
    
    const lines = content.split('\n');
    const line = lines[lineIndex];
    if (line.includes('[ ]')) {
      lines[lineIndex] = line.replace('[ ]', '[x]');
    } else if (line.includes('[x]')) {
      lines[lineIndex] = line.replace('[x]', '[ ]');
    }
    const newContent = lines.join('\n');
    setContent(newContent);
    updateNote(note.id, { content: newContent });
  };



  // Inline styles for the physical note on the board
  const boardNoteStyle = {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    scale: noteScale,
    transformOrigin: 'top left',
    backgroundColor: `var(--note-${baseColor})`,
    '--note-text': `var(--text-${baseColor}, #1a1a1a)`,
    boxShadow: isDragging ? 'var(--shadow-md)' : 'var(--shadow-sm)',
    zIndex: isDragging ? 100 : 10,
    padding: '15px',
    borderRadius: '2px 2px 10px 2px',
    containerType: 'size',
    cursor: isDragging ? 'grabbing' : 'pointer',
    display: 'flex',
    flexDirection: 'column',
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none'
  };

  return (
    <>
      {/* EXPANDED MODAL (Centered over everything) */}
      {isExpanded && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={() => setIsExpanded(false)} 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, 
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            backdropFilter: 'blur(3px)'
          }} 
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="animate-note-enter"
            style={{
              width: '90vw', maxWidth: '600px', height: '80vh', maxHeight: '700px',
              backgroundColor: `var(--note-${baseColor})`,
              borderRadius: '2px 2px 10px 2px', padding: '30px',
              display: 'flex', flexDirection: 'column',
              boxShadow: 'var(--shadow-lg)', position: 'relative'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '15px' }}>
              {isEditing ? (
                <input 
                  className="note-font"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSave}
                  placeholder="Note Title"
                  style={{ fontSize: '36px', fontWeight: 'bold', background: 'transparent', border: 'none', borderBottom: '2px dashed rgba(0,0,0,0.1)', outline: 'none', color: 'var(--note-text, #1a1a1a)' }}
                />
              ) : (
                <h2 className="note-font" style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, borderBottom: '2px dashed rgba(0,0,0,0.1)', color: 'var(--note-text, #1a1a1a)' }}>{title}</h2>
              )}

              {isEditing ? (
                <textarea
                  className="note-font"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onBlur={handleSave}
                  placeholder="Write your note here... Use [ ] for checkboxes!"
                  style={{ flex: 1, fontSize: '28px', background: 'transparent', border: 'none', outline: 'none', resize: 'none', lineHeight: '1.4', color: 'var(--note-text, #1a1a1a)' }}
                />
              ) : (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {content.split('\n').map((line, i) => {
                    const isCheckbox = line.includes('[ ]') || line.includes('[x]');
                    const isChecked = line.includes('[x]');
                    const text = line.replace(/\[[ x]\]/, '').trim();
                    
                    if (isCheckbox) {
                      return (
                        <div 
                          key={i} 
                          onClick={(e) => toggleCheck(e, i)}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}
                        >
                          <div 
                            style={{ 
                              width: '24px', 
                              height: '24px', 
                              flexShrink: 0,
                              border: '3px solid var(--note-text, #1a1a1a)', 
                              borderRadius: '4px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              marginTop: '4px',
                              color: 'var(--note-text, #1a1a1a)'
                            }}
                          >
                            {isChecked && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ width: '80%', height: '80%' }}><polyline points="20 6 9 17 4 12"></polyline></svg>}
                          </div>
                          <span className="note-font" style={{ 
                            fontSize: '28px', 
                            textDecoration: isChecked ? 'line-through' : 'none',
                            color: 'var(--note-text, #1a1a1a)',
                            opacity: isChecked ? 0.6 : 1,
                            wordBreak: 'break-word',
                            lineHeight: '1.4'
                          }}>
                            {text}
                          </span>
                        </div>
                      );
                    }
                    return <p key={i} className="note-font" style={{ fontSize: '28px', minHeight: '28px', margin: '0 0 4px 0', color: 'var(--note-text, #1a1a1a)', lineHeight: '1.4' }}>{line}</p>;
                  })}
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '10px' }}>
                <button 
                  className="note-font" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (isEditing) {
                      handleSave();
                      setIsEditing(false);
                    } else {
                      setIsEditing(true);
                    }
                  }} 
                  style={{ padding: '8px 20px', background: 'transparent', color: 'var(--note-text, #1a1a1a)', border: '3px solid var(--note-text, #1a1a1a)', borderRadius: '4px', cursor: 'pointer', fontSize: '28px', fontWeight: 'bold', transform: 'rotate(1deg)' }}
                >
                  {isEditing ? 'save' : 'edit'}
                </button>
                <button 
                  className="note-font" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (isEditing) handleSave();
                    setIsExpanded(false); 
                  }} 
                  style={{ padding: '8px 20px', background: 'transparent', color: 'var(--note-text, #1a1a1a)', border: '3px solid var(--note-text, #1a1a1a)', borderRadius: '4px', cursor: 'pointer', fontSize: '28px', fontWeight: 'bold', transform: 'rotate(-2deg)' }}
                >
                  done
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* BOARD NOTE (The small sticky note on the corkboard) */}
      <div 
        ref={noteRef}
        style={boardNoteStyle}
        onPointerDown={handlePointerDown}
        onClick={() => {
          if (!actionHasOccurred.current && !isExpanded) {
            setIsExpanded(true);
            setIsEditing(false);
          }
        }}
        className="hover-lift no-pan"
      >
        {/* Tape */}
        <div style={{ 
          position: 'absolute', 
          top: '-12px', 
          left: '50%', 
          transform: 'translateX(-50%) rotate(-2deg)', 
          width: '70px', 
          height: '22px', 
          backgroundColor: 'rgba(255, 255, 255, 0.5)', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
          border: '1px solid rgba(255,255,255,0.2)',
          zIndex: 2 
        }} />

        {/* Mini content view */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>
          <h3 className="note-font" style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 10px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--note-text, #1a1a1a)', flexShrink: 0 }}>
            {title}
          </h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
            {content.split('\n').map((line, i) => {
              const isCheckbox = line.includes('[ ]') || line.includes('[x]');
              if (isCheckbox) {
                const isChecked = line.includes('[x]');
                const text = line.replace(/\[[ x]\]/, '').trim();
                return (
                  <div 
                    key={i} 
                    onClick={(e) => toggleCheck(e, i)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}
                  >
                    <div 
                      style={{ 
                        width: '24px', 
                        height: '24px', 
                        flexShrink: 0,
                        border: '3px solid var(--note-text, #1a1a1a)', 
                        borderRadius: '4px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginTop: '2px',
                        color: 'var(--note-text, #1a1a1a)'
                      }}
                    >
                      {isChecked && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ width: '80%', height: '80%' }}><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                    <span className="note-font" style={{ fontSize: '28px', textDecoration: isChecked ? 'line-through' : 'none', color: 'var(--note-text, #1a1a1a)', opacity: isChecked ? 0.6 : 1, wordBreak: 'break-word', lineHeight: '1.2' }}>
                      {line.replace(/^\[[x ]\] /, '')}
                    </span>
                  </div>
                );
              }
              return (
                <p key={i} className="note-font" style={{ fontSize: '28px', color: 'var(--note-text, #1a1a1a)', lineHeight: '1.2', margin: 0, wordBreak: 'break-word' }}>
                  {line}
                </p>
              );
            })}
          </div>
        </div>

        {/* Right Resize Handle */}
        <div 
          className="no-drag"
          onPointerDown={(e) => handleResizeDown(e, 'horizontal')}
          style={{ position: 'absolute', right: '-6px', top: '50%', transform: 'translateY(-50%)', width: '12px', height: '40px', backgroundColor: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '6px', cursor: 'ew-resize', touchAction: 'none' }}
        />

        {/* Bottom Resize Handle */}
        <div 
          className="no-drag"
          onPointerDown={(e) => handleResizeDown(e, 'vertical')}
          style={{ position: 'absolute', left: '50%', bottom: '-6px', transform: 'translateX(-50%)', width: '40px', height: '12px', backgroundColor: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '6px', cursor: 'ns-resize', touchAction: 'none' }}
        />

        {/* Corner Resize Handle */}
        <div 
          className="no-drag"
          onPointerDown={(e) => handleResizeDown(e, 'both')}
          style={{ position: 'absolute', right: '0', bottom: '0', width: '25px', height: '25px', cursor: 'nwse-resize', background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.05) 50%)', borderRadius: '0 0 10px 0', touchAction: 'none', zIndex: 10 }}
        />
      </div>
      
      <style jsx>{`
        .hover-lift {
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s !important;
        }
        .hover-lift:hover {
          transform: translateY(-5px) rotate(1deg) !important;
          box-shadow: var(--shadow-lg) !important;
          z-index: 50 !important;
        }
        .delete-btn {
          transition: transform 0.2s;
        }
        .delete-btn:hover {
          transform: scale(1.2);
          color: red !important;
        }
      `}</style>
    </>
  );
}
