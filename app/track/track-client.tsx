'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Icon } from '../components/storefront';
import { money } from '../lib/products';

interface TrackedOrder {
  id: string;
  customerName: string;
  status: string;
  stepIndex: number;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  date: string;
  itemsText: string;
  addressText: string;
  notesText: string;
}

const TRACKING_STEPS = [
  {
    title: 'Order Confirmed',
    desc: 'Payment received & order booked',
    icon: 'check',
  },
  {
    title: 'Plant Selection',
    desc: 'Health check of caudex & foliage',
    icon: 'flower',
  },
  {
    title: 'Botanical Packaging',
    desc: 'Protective cushioning for transit',
    icon: 'shield',
  },
  {
    title: 'Dispatched',
    desc: 'Handed to courier from Howrah',
    icon: 'truck',
  },
  {
    title: 'Delivered',
    desc: 'Safely arrived at your door',
    icon: 'pot',
  },
];

export function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get('orderId') || '';
  const initialPhone = searchParams.get('phone') || '';

  const [orderId, setOrderId] = useState(initialOrderId);
  const [phone, setPhone] = useState(initialPhone);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [copied, setCopied] = useState(false);

  async function performTrack(idToTrack: string, phoneToTrack: string) {
    const cleanId = idToTrack.trim();
    const cleanPhone = phoneToTrack.replace(/\D/g, '');

    if (!cleanId) {
      setError('Please enter your Order ID (e.g. KN-1004).');
      return;
    }

    if (cleanPhone.length < 10) {
      setError('Please enter your 10-digit mobile number used when ordering.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: cleanId,
          phone: cleanPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Could not find matching order details.');
      }

      setOrder(data.order);
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : 'Something went wrong while fetching order status.');
    } finally {
      setIsLoading(false);
    }
  }

  // Auto-search if query params are provided
  useEffect(() => {
    if (initialOrderId && initialPhone) {
      performTrack(initialOrderId, initialPhone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    performTrack(orderId, phone);
  }

  function handleCopy(text: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const whatsappInquiryText = order
    ? `Hello Kiaan Nursery & Agro Care!\nI am checking the status of my Order: *${order.id}*\nCustomer: ${order.customerName}\nCurrent Status: ${order.status}\n\nCould you please share tracking / dispatch updates? Thank you!`
    : `Hello Kiaan Nursery & Agro Care!\nI need help tracking my order.\nPhone: ${phone || 'My registered number'}\nOrder ID: ${orderId || 'Order reference'}\n\nPlease help me look it up. Thank you!`;

  return (
    <main className="track-page">
      <div className="track-container">
        {/* Breadcrumb */}
        <nav className="about-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="crumb-sep">›</span>
          <span className="crumb-current">Track Order</span>
        </nav>

        {/* Hero Banner */}
        <header className="track-header">
          <span className="track-pill-tag">LIVE PARCEL &amp; PLANT TRACKING</span>
          <h1 className="track-title">Track Your Order</h1>
          <p className="track-desc">
            Check real-time preparation and dispatch progress of your living Adeniums and Agro Care essentials from our nursery in Howrah, West Bengal.
          </p>
        </header>

        {/* Lookup Form Card */}
        <section className="track-form-card" aria-label="Order Tracking Form">
          <form onSubmit={handleSubmit} className="track-form">
            <div className="track-inputs-grid">
              <div className="track-field">
                <label htmlFor="track-order-id">
                  Order ID <span className="req">*</span>
                </label>
                <div className="track-input-wrap">
                  <span className="track-input-prefix">#</span>
                  <input
                    id="track-order-id"
                    type="text"
                    placeholder="e.g. KN-1004"
                    value={orderId}
                    onChange={e => setOrderId(e.target.value.toUpperCase())}
                    required
                    autoComplete="off"
                  />
                </div>
                <small className="field-hint">Received on payment success screen</small>
              </div>

              <div className="track-field">
                <label htmlFor="track-phone">
                  Registered Mobile Number <span className="req">*</span>
                </label>
                <div className="track-input-wrap">
                  <span className="track-input-prefix">+91</span>
                  <input
                    id="track-phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="10-digit phone number"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    maxLength={14}
                    required
                  />
                </div>
                <small className="field-hint">Phone entered during checkout</small>
              </div>
            </div>

            <div className="track-form-submit-row">
              <button
                type="submit"
                disabled={isLoading}
                className="track-submit-btn pill dark"
              >
                {isLoading ? (
                  <span>Checking Nursery Records…</span>
                ) : (
                  <>
                    <Icon name="truck" />
                    <span>Track Order Status</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Banner */}
          {error && (
            <div className="track-error-box" role="alert">
              <div className="track-error-icon">⚠️</div>
              <div className="track-error-content">
                <strong>Order Not Located</strong>
                <p>{error}</p>
                <div className="track-error-action">
                  <span>Need quick help?</span>
                  <a
                    href={`https://wa.me/919038823613?text=${encodeURIComponent(whatsappInquiryText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="track-whatsapp-link"
                  >
                    <Icon name="phone" /> Chat with Shambhu on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Order Result Card */}
        {order && (
          <section className="track-result-section" aria-label="Order Tracking Result">
            <div className="track-result-header-card">
              <div className="track-result-top">
                <div className="track-id-block">
                  <span className="track-id-label">ORDER REFERENCE</span>
                  <div className="track-id-row">
                    <strong className="track-order-num">{order.id}</strong>
                    <button
                      type="button"
                      className={`track-copy-pill ${copied ? 'copied' : ''}`}
                      onClick={() => handleCopy(order.id)}
                      title="Copy Order ID"
                      aria-label="Copy Order ID"
                    >
                      {copied ? (
                        <>
                          <Icon name="check" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="track-status-badge-wrap">
                  <span className={`track-status-pill status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    <span className="status-dot" />
                    {order.status}
                  </span>
                  <span className="track-order-date">
                    {new Date(order.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="track-stepper-wrap" aria-label="Delivery Progress">
                <div className="track-stepper">
                  {TRACKING_STEPS.map((step, idx) => {
                    const isCompleted = idx <= order.stepIndex;
                    const isCurrent = idx === order.stepIndex;
                    return (
                      <div
                        key={step.title}
                        className={`stepper-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                      >
                        <div className="stepper-node-marker">
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        <div className="stepper-node-content">
                          <strong className="stepper-node-title">{step.title}</strong>
                          <span className="stepper-node-desc">{step.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="track-details-grid">
              {/* Delivery Destination */}
              <div className="track-detail-card">
                <h3>
                  <Icon name="truck" />
                  <span>Delivery Address</span>
                </h3>
                <p className="track-address-text">{order.addressText || 'Address on file'}</p>
                <div className="track-customer-sub">
                  <span>Customer: <strong>{order.customerName}</strong></span>
                </div>
              </div>

              {/* Order Items & Payment */}
              <div className="track-detail-card">
                <h3>
                  <Icon name="tag" />
                  <span>Items &amp; Payment</span>
                </h3>
                <p className="track-items-summary">{order.itemsText || 'Plant & Agro Care Items'}</p>
                <div className="track-payment-meta">
                  <span>Total Paid: <strong>{money(order.total)}</strong></span>
                  <span className="badge-paid">✓ Paid Online</span>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Contact Card */}
            <div className="track-support-card">
              <div className="track-support-left">
                <h3>Direct Nursery Dispatch Support</h3>
                <p>
                  Have special delivery timing or want live caudex inspection photos before your Adeniums leave our Howrah nursery?
                </p>
                <div className="track-support-contacts">
                  <span>📍 Khudiram Bose Sarani, Ghosh Para, Howrah - 711227</span>
                  <span>📞 Call / WhatsApp: +91 90388 23613</span>
                </div>
              </div>
              <div className="track-support-right">
                <a
                  href={`https://wa.me/919038823613?text=${encodeURIComponent(whatsappInquiryText)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="pill whatsapp-btn"
                >
                  <Icon name="phone" />
                  <span>Live Updates on WhatsApp</span>
                </a>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
