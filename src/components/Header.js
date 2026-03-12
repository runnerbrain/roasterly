"use client";

import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";

export default function Header() {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="site-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', marginBottom: '40px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
          Artisan Roast
        </h1>
        <span className="tagline" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          roast profile dashboard
        </span>
      </div>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} ref={dropdownRef}>
        {status === "loading" && (
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--border)', opacity: 0.5 }} />
        )}

        {status !== "loading" && session?.user && (
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{ 
              background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
              outline: isDropdownOpen ? '2px solid var(--border)' : 'none'
            }}
            aria-label="User Menu"
            aria-expanded={isDropdownOpen}
          >
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt="Profile"
                width={36}
                height={36}
                style={{ borderRadius: '50%', border: '1px solid var(--border)', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                {(session.user.name?.[0] || "U").toUpperCase()}
              </div>
            )}
          </button>
        )}

        {isDropdownOpen && session?.user && (
          <div style={{ 
            position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: '200px',
            backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden', padding: '4px 0',
            animation: 'fadeIn 0.15s ease'
          }}>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {session.user.name || "User"}
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {session.user.email}
              </p>
            </div>

            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="dropdown-item"
                style={{ 
                  width: '100%', textAlign: 'left', padding: '8px 16px', border: 'none', background: 'transparent',
                  cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                {theme === "dark" ? (
                  <>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Light Mode
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    Dark Mode
                  </>
                )}
              </button>
            )}
            
            <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => signOut()}
                className="dropdown-item"
                style={{ 
                  width: '100%', textAlign: 'left', padding: '8px 16px', border: 'none', background: 'transparent',
                  cursor: 'pointer', fontSize: '0.85rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
{/* Support for dropdown item hover state */}
<style dangerouslySetInnerHTML={{__html: `
.dropdown-item:hover {
  background-color: var(--bg) !important;
  color: var(--text-primary) !important;
}
`}} />
    </header>
  );
}
