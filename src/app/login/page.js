'use client';

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 300, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: '0 0 8px 0' }}>
          Artisan Roast
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
          Sign in to access your coffee dashboard
        </p>
      </div>

      {error === "AccessDenied" && (
        <div style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', 
          color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center', marginBottom: '24px' 
        }}>
          Access Denied. Your email is not authorized.
        </div>
      )}

      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="google-btn"
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
          backgroundColor: '#ffffff', color: '#1f2937', padding: '12px 20px', borderRadius: '12px',
          border: '1px solid #e5e7eb', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)', transition: 'all 0.2s ease', outline: 'none'
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.26-.66-.35-1.36-.35-2.09s.09-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>

      {/* Button Hover Style */}
      <style dangerouslySetInnerHTML={{__html: `
        .google-btn:hover { background-color: #f9fafb !important; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05) !important; transform: translateY(-1px); }
        .google-btn:focus { box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.3) !important; }
      `}} />
    </>
  );
}

export default function Login() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--bg)', padding: '20px'
    }}>
      <div style={{
        maxWidth: '400px', width: '100%', padding: '48px 32px',
        backgroundColor: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        <Suspense fallback={<div style={{ textAlign: 'center', color: 'var(--text-muted)', width: '100%' }}>Loading...</div>}>
          <div style={{ width: '100%' }}>
            <LoginForm />
          </div>
        </Suspense>
      </div>
    </div>
  );
}
