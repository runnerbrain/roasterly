'use client';

import { useState, useRef, useEffect } from 'react';

export default function GearMenu({ onAddBeans, onUploadRoasts, showFilters, onShowFilters }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const buttonStyle = {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    cursor: 'pointer',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    transition: 'background 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap'
  };

  return (
    <div className="gear-menu-container" ref={menuRef}>
      <style>{`
        .gear-menu-container {
          position: relative;
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }
        .gear-menu-actions {
          display: flex;
          gap: 8px;
        }
        @media (max-width: 600px) {
          .gear-menu-container {
            flex-direction: column;
            align-items: flex-end;
          }
          .gear-menu-actions {
            flex-direction: column;
            align-items: flex-end;
          }
        }
      `}</style>

      <button
        onClick={() => {
          if (isOpen && showFilters) {
            onShowFilters();
          }
          setIsOpen(!isOpen);
        }}
        style={buttonStyle}
        aria-label="Menu"
        title="Menu"
      >
        ⚙️
      </button>

      {isOpen && (
        <div className="gear-menu-actions">
          <button
            onClick={() => {
              setIsOpen(false);
              onAddBeans();
            }}
            style={buttonStyle}
            onMouseOver={(e) => (e.target.style.background = 'var(--card-bg)')}
            onMouseOut={(e) => (e.target.style.background = 'transparent')}
          >
            + Add Beans
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              onUploadRoasts();
            }}
            style={buttonStyle}
            onMouseOver={(e) => (e.target.style.background = 'var(--card-bg)')}
            onMouseOut={(e) => (e.target.style.background = 'transparent')}
          >
            ↑ Upload Roasts
          </button>
          <button
            onClick={onShowFilters}
            style={{
              ...buttonStyle,
              borderColor: showFilters ? '#c8702a' : 'var(--border)',
              background: showFilters ? '#c8702a' : 'transparent',
              color: showFilters ? '#fff' : 'var(--text)'
            }}
            onMouseOver={(e) => {
              if (!showFilters) e.target.style.background = 'var(--card-bg)';
            }}
            onMouseOut={(e) => {
              if (!showFilters) e.target.style.background = 'transparent';
            }}
          >
            Filter ▾
          </button>
        </div>
      )}
    </div>
  );
}
