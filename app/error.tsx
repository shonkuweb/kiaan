'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Storefront error caught by boundary:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 20px',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#fef3c7',
          color: '#d97706',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          marginBottom: '20px',
        }}
      >
        🌱
      </div>
      <h1
        style={{
          fontSize: '1.6rem',
          fontWeight: 700,
          color: '#1a2e1c',
          marginBottom: '10px',
        }}
      >
        Something took a little longer than expected
      </h1>
      <p
        style={{
          fontSize: '0.95rem',
          color: '#556556',
          maxWidth: '420px',
          lineHeight: 1.5,
          marginBottom: '24px',
        }}
      >
        We could not load this page at the moment. Please try reloading, or return to the storefront.
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => reset()}
          style={{
            backgroundColor: '#1b4d24',
            color: '#fff',
            border: 'none',
            borderRadius: '9999px',
            padding: '12px 24px',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
        <Link
          href="/"
          style={{
            backgroundColor: '#f1f5ee',
            color: '#1b4d24',
            border: '1px solid #d4dfce',
            borderRadius: '9999px',
            padding: '12px 24px',
            fontSize: '0.95rem',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
