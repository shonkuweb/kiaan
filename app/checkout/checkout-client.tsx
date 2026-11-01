'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStore, Icon } from '../components/storefront';
import { money, getProductImageUrl } from '../lib/products';

interface OrderSuccessData {
  orderId: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  date: string;
}

export function CheckoutClient() {
  const { cart, products, quantity, remove, clearCart } = useStore();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    landmark: '',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<OrderSuccessData | null>(null);

  // Cart items
  const items = products.filter(p => cart[p.id]);
  const subtotal = items.reduce((sum, p) => sum + p.price * cart[p.id], 0);
  const itemCount = Object.values(cart).reduce((sum, n) => sum + n, 0);

  // Shipping logic: Free for >= 999, else 69
  const freeShippingThreshold = 999;
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const shippingFee = isFreeShipping ? 0 : (subtotal > 0 ? 69 : 0);
  const totalAmount = subtotal + shippingFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (itemCount === 0) {
      setSubmitError('Your cart is empty. Please add items before checking out.');
      return;
    }

    if (!form.name.trim()) {
      setSubmitError('Please enter your full name.');
      return;
    }

    const cleanPhone = form.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setSubmitError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!form.address.trim()) {
      setSubmitError('Please provide your delivery address.');
      return;
    }

    if (!form.city.trim()) {
      setSubmitError('Please provide your city/town.');
      return;
    }

    const cleanPin = form.pincode.replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      setSubmitError('Please provide a valid 6-digit PIN code.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        name: form.name.trim(),
        phone: cleanPhone,
        email: form.email.trim(),
        address: form.address.trim(),
        landmark: form.landmark.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: cleanPin,
        notes: form.notes.trim(),
        paymentMethod: 'Pay on Delivery / Direct Nursery Order',
        items: items.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          quantity: cart[p.id],
          image: p.image,
        })),
        subtotal,
        shipping: shippingFee,
        total: totalAmount,
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order. Please try again.');
      }

      // Order succeeded
      setOrderResult({
        orderId: data.orderId,
        customer: {
          name: form.name.trim(),
          phone: cleanPhone,
          email: form.email.trim(),
          address: data.customer?.address || `${form.address}, ${form.city} - ${cleanPin}`,
        },
        items: orderPayload.items,
        subtotal,
        shipping: shippingFee,
        total: totalAmount,
        date: data.date || new Date().toISOString(),
      });

      clearCart();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- ORDER SUCCESS VIEW ---
  if (orderResult) {
    const shortId = orderResult.orderId.slice(0, 8).toUpperCase();
    const whatsappText = `Hello Kiaan Nursery & Agro Care!\nI have placed an order on your site.\n\n*Order ID:* #KIAAN-${shortId}\n*Customer:* ${orderResult.customer.name}\n*Phone:* ${orderResult.customer.phone}\n*Items:*\n${orderResult.items.map(i => `• ${i.name} × ${i.quantity} (₹${i.price * i.quantity})`).join('\n')}\n*Total:* ₹${orderResult.total}\n*Delivery Address:* ${orderResult.customer.address}\n\nPlease confirm availability and dispatch details. Thank you!`;

    return (
      <main className="checkout-success-page">
        <div className="checkout-container">
          <div className="success-card">
            <div className="success-icon-wrap" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="success-svg">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <span className="success-tag">ORDER CONFIRMED</span>
            <h1 className="success-title">Thank You, {orderResult.customer.name}!</h1>
            <p className="success-subtitle">
              Your order has been placed successfully and received by our nursery team in Habra.
            </p>

            <div className="order-id-badge">
              <span>Order Reference</span>
              <strong>#KIAAN-{shortId}</strong>
            </div>

            <div className="success-summary-box">
              <div className="summary-row">
                <span>Status</span>
                <span className="status-badge pending">Received &bull; Pending Dispatch</span>
              </div>
              <div className="summary-row">
                <span>Delivery To</span>
                <span className="summary-address">{orderResult.customer.address}</span>
              </div>
              <div className="summary-row">
                <span>Total Amount</span>
                <strong className="summary-price">{money(orderResult.total)}</strong>
              </div>
            </div>

            <div className="success-items-list">
              <h3>Items in this order ({orderResult.items.reduce((s, i) => s + i.quantity, 0)})</h3>
              {orderResult.items.map(item => (
                <div key={item.id} className="success-item-row">
                  <span>{item.name} <strong>&times; {item.quantity}</strong></span>
                  <span>{money(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Direct WhatsApp Confirmation Button */}
            <div className="success-actions">
              <a
                href={`https://wa.me/916289417338?text=${encodeURIComponent(whatsappText)}`}
                target="_blank"
                rel="noreferrer"
                className="pill whatsapp-btn"
              >
                <Icon name="phone" />
                Connect on WhatsApp for Live Plant Photos
              </a>

              <Link href="/" className="pill light continue-btn">
                Back to Home <Icon name="arrow" />
              </Link>
            </div>

            <p className="success-note">
              🌱 We hand-pick and carefully inspect each Adenium caudex and foliage before dispatching. Our nursery experts will contact you on <strong>+91 {orderResult.customer.phone}</strong> if needed.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // --- EMPTY CART VIEW ---
  if (itemCount === 0) {
    return (
      <main className="checkout-empty-page">
        <div className="checkout-container">
          <nav className="about-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Checkout</span>
          </nav>

          <div className="checkout-empty-card">
            <div className="empty-cart-icon" aria-hidden="true">
              <Icon name="cart" />
            </div>
            <h1>Your Cart is Empty</h1>
            <p>
              Looks like you haven&apos;t added any beautiful plants or nursery supplies yet.
              Explore our hand-crafted collection of Desert Rose Adeniums and agro care essentials.
            </p>
            <div className="empty-actions">
              <Link href="/collections/adenium" className="pill dark">
                Explore Adenium Collection <Icon name="arrow" />
              </Link>
              <Link href="/" className="pill light">
                Return to Storefront
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // --- MAIN CHECKOUT VIEW ---
  return (
    <main className="checkout-page">
      <div className="checkout-container">
        {/* Breadcrumb */}
        <nav className="about-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="crumb-sep">›</span>
          <span className="crumb-current">Checkout</span>
        </nav>

        <header className="checkout-header">
          <div className="about-tag">
            <Icon name="shield" />
            <span>SECURE CHECKOUT</span>
          </div>
          <h1 className="checkout-title">Complete Your Order</h1>
          <p className="checkout-desc">
            Directly from Kiaan Nursery &amp; Agro Care to your garden. Quick, reliable dispatch with safe botanical packaging.
          </p>
        </header>

        {submitError && (
          <div className="checkout-error-banner" role="alert">
            <Icon name="close" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="checkout-layout">
          {/* LEFT: Customer & Delivery Details Form */}
          <form className="checkout-form-section" onSubmit={handleSubmit} noValidate>
            {/* Step 1: Contact Details */}
            <section className="form-card">
              <div className="form-card-header">
                <span className="step-number">1</span>
                <h2>Contact Information</h2>
              </div>
              <div className="form-grid">
                <div className="form-field field-full">
                  <label htmlFor="checkout-name">Full Name *</label>
                  <input
                    id="checkout-name"
                    type="text"
                    required
                    placeholder="e.g. Ranita Dev"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="form-field field-half">
                  <label htmlFor="checkout-phone">Mobile Number (WhatsApp) *</label>
                  <div className="phone-input-wrap">
                    <span className="phone-prefix">+91</span>
                    <input
                      id="checkout-phone"
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="98765 43210"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-field field-half">
                  <label htmlFor="checkout-email">Email Address (Optional)</label>
                  <input
                    id="checkout-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
            </section>

            {/* Step 2: Delivery Address */}
            <section className="form-card">
              <div className="form-card-header">
                <span className="step-number">2</span>
                <h2>Delivery Address</h2>
              </div>
              <div className="form-grid">
                <div className="form-field field-full">
                  <label htmlFor="checkout-address">House / Flat No., Building &amp; Street Address *</label>
                  <input
                    id="checkout-address"
                    type="text"
                    required
                    placeholder="e.g. Flat 3B, Sunshine Apartments, Jessore Road"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                  />
                </div>

                <div className="form-field field-full">
                  <label htmlFor="checkout-landmark">Landmark / Area (Optional)</label>
                  <input
                    id="checkout-landmark"
                    type="text"
                    placeholder="e.g. Near Habra Railway Station / Beside Kali Mandir"
                    value={form.landmark}
                    onChange={e => setForm({ ...form, landmark: e.target.value })}
                  />
                </div>

                <div className="form-field field-third">
                  <label htmlFor="checkout-city">City / Town *</label>
                  <input
                    id="checkout-city"
                    type="text"
                    required
                    placeholder="e.g. Kolkata / Habra"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                  />
                </div>

                <div className="form-field field-third">
                  <label htmlFor="checkout-state">State *</label>
                  <input
                    id="checkout-state"
                    type="text"
                    required
                    placeholder="West Bengal"
                    value={form.state}
                    onChange={e => setForm({ ...form, state: e.target.value })}
                  />
                </div>

                <div className="form-field field-third">
                  <label htmlFor="checkout-pincode">PIN Code *</label>
                  <input
                    id="checkout-pincode"
                    type="text"
                    required
                    maxLength={6}
                    placeholder="700001"
                    value={form.pincode}
                    onChange={e => setForm({ ...form, pincode: e.target.value })}
                  />
                </div>

                <div className="form-field field-full">
                  <label htmlFor="checkout-notes">Plant Care / Delivery Instructions (Optional)</label>
                  <textarea
                    id="checkout-notes"
                    rows={2}
                    placeholder="Any special notes for packaging, delivery timing, or greeting message?"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>
            </section>

            {/* Place Order CTA */}
            <div className="checkout-submit-wrap">
              <button
                type="submit"
                disabled={isSubmitting}
                className="checkout-place-order-btn pill dark"
              >
                {isSubmitting ? (
                  <span>Processing Your Order…</span>
                ) : (
                  <>
                    <span>Place Order • {money(totalAmount)}</span>
                    <Icon name="arrow" />
                  </>
                )}
              </button>

              <div className="checkout-security-guarantee">
                <Icon name="shield" />
                <span>Pay on Delivery &bull; 100% Safe Botanical Transit &bull; Hand-packaged at Habra</span>
              </div>
            </div>
          </form>

          {/* RIGHT: Order Summary */}
          <aside className="checkout-summary-section" aria-label="Order Summary">
            <div className="summary-sticky-card">
              <div className="summary-card-head">
                <h3>Order Summary</h3>
                <span className="summary-count-pill">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
              </div>

              {/* Items List */}
              <div className="checkout-items-scroll">
                {items.map(p => {
                  const qty = cart[p.id];
                  const img = getProductImageUrl(p);
                  return (
                    <article key={p.id} className="checkout-item-row">
                      <div className="checkout-item-thumb">
                        <img src={img} alt={p.name} width="52" height="52" />
                      </div>
                      <div className="checkout-item-details">
                        <h4>{p.name}</h4>
                        <p className="checkout-item-unit">{money(p.price)} each</p>
                        <div className="checkout-item-qty-bar">
                          <button
                            type="button"
                            aria-label={`Decrease ${p.name}`}
                            onClick={() => quantity(p.id, -1)}
                          >
                            <Icon name="minus" />
                          </button>
                          <span>{qty}</span>
                          <button
                            type="button"
                            aria-label={`Increase ${p.name}`}
                            onClick={() => quantity(p.id, 1)}
                            disabled={qty >= 99}
                          >
                            <Icon name="plus" />
                          </button>
                          <button
                            type="button"
                            className="checkout-item-del"
                            aria-label={`Remove ${p.name}`}
                            onClick={() => remove(p.id)}
                          >
                            <Icon name="trash" />
                          </button>
                        </div>
                      </div>
                      <strong className="checkout-item-total">{money(p.price * qty)}</strong>
                    </article>
                  );
                })}
              </div>

              {/* Free shipping indicator */}
              {!isFreeShipping && (
                <div className="free-shipping-progress">
                  <div className="progress-info">
                    <span>Add {money(freeShippingThreshold - subtotal)} more for <strong>FREE Delivery</strong></span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100))}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Price calculations */}
              <dl className="summary-breakdown">
                <div className="breakdown-row">
                  <dt>Items Subtotal</dt>
                  <dd>{money(subtotal)}</dd>
                </div>
                <div className="breakdown-row">
                  <dt>Shipping</dt>
                  <dd>
                    {isFreeShipping ? (
                      <span className="free-shipping-tag">FREE</span>
                    ) : (
                      money(shippingFee)
                    )}
                  </dd>
                </div>
                <div className="breakdown-row grand-total">
                  <dt>Total Amount</dt>
                  <dd>{money(totalAmount)}</dd>
                </div>
              </dl>

              {/* Trust Badges */}
              <div className="checkout-trust-badges">
                <div className="trust-badge">
                  <Icon name="flower" />
                  <span>Healthy Root &amp; Caudex Guarantee</span>
                </div>
                <div className="trust-badge">
                  <Icon name="truck" />
                  <span>Doorstep Delivery Across India</span>
                </div>
                <div className="trust-badge">
                  <Icon name="support" />
                  <span>Complete WhatsApp Care Advice</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
