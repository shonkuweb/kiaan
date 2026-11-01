import { Suspense } from 'react';
import type { Metadata } from 'next';
import { TrackOrderContent } from './track-client';

export const metadata: Metadata = {
  title: 'Track Your Order | Kiaan Nursery & Agro Care',
  description:
    'Track live order preparation, plant selection, and dispatch status of your Adeniums and Agro Care products from Kiaan Nursery in Howrah.',
};

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <main className="track-page">
          <div className="track-container" style={{ padding: '80px 20px', textAlign: 'center' }}>
            <p style={{ color: '#687766' }}>Loading order tracking…</p>
          </div>
        </main>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
