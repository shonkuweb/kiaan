'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStore, Icon } from '../components/storefront';
import { money, getProductImageUrl } from '../lib/products';

type PaymentOption = 'razorpay' | 'cod';

interface OrderSuccessData {
  orderId: string;
  paymentId?: string;
  paymentMethod: string;
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

// Dynamically load Razorpay checkout script
function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
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

  const [paymentOption, setPaymentOption] = useState<PaymentOption>('razorpay');
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
      setSubmitError('Please provide a valid 6-digit Indian PIN code.');
      return;
    }

    setIsSubmitting(true);

    // --- OPTION 1: ONLINE PAYMENT VIA RAZORPAY ---
    if (paymentOption === 'razorpay') {
      try {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error('Failed to load Razorpay payment gateway. Please check your internet connection and try again.');
        }

        // 1. Create order on our backend
        const orderRes = await fetch('/api/checkout/razorpay/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: cleanPhone,
            email: form.email.trim(),
            address: form.address.trim(),
            landmark: form.landmark.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            pincode: cleanPin,
            notes: form.notes.trim(),
            items: items.map(p => ({
              id: p.id,
              name: p.name,
              price: p.price,
              quantity: cart[p.id],
            })),
          }),
        });

        const orderData = await orderRes.json();
        if (!orderRes.ok || !orderData.success) {
          throw new Error(orderData.error || 'Failed to initialize Razorpay payment order.');
        }

        // 2. Open Razorpay Checkout modal
        type RazorpayPaymentSuccess = {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        };

        const razorpayOptions = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'Kiaan Nursery & Agro Care',
          description: `Adenium & Nursery Order #${orderData.receipt}`,
          image: '/images/kiaan-logo-dark.png',
          order_id: orderData.razorpayOrderId,
          prefill: {
            name: form.name.trim(),
            contact: cleanPhone,
            email: form.email.trim() || undefined,
          },
          notes: {
            address: orderData.customer.address,
          },
          theme: {
            color: '#214d36', // Brand dark green
          },
          modal: {
            ondismiss: () => {
              setIsSubmitting(false);
              setSubmitError('Payment modal was closed. You can retry payment whenever you are ready.');
            },
          },
          handler: async (response: RazorpayPaymentSuccess) => {
            try {
              setIsSubmitting(true);
              setSubmitError(null);

              // 3. Verify signature on backend
              const verifyRes = await fetch('/api/checkout/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: orderData.orderId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });

              const verifyData = await verifyRes.json();
              if (!verifyRes.ok || !verifyData.success) {
                throw new Error(verifyData.error || 'Payment verification failed. Please contact nursery support.');
              }

              // Success! Show confirmation
              setOrderResult({
                orderId: orderData.orderId,
                paymentId: response.razorpay_payment_id,
                paymentMethod: 'Razorpay Online (UPI / Cards / NetBanking)',
                customer: orderData.customer,
                items: orderData.items,
                subtotal: orderData.subtotal,
                shipping: orderData.shipping,
                total: orderData.total,
                date: new Date().toISOString(),
              });

              clearCart();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (err) {
              setSubmitError(err instanceof Error ? err.message : 'Payment verification failed.');
            } finally {
              setIsSubmitting(false);
            }
          },
        };

        const RazorpayConstructor = (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void; on: (event: string, cb: (res: unknown) => void) => void } }).Razorpay;
        const rzp = new RazorpayConstructor(razorpayOptions);
        rzp.on('payment.failed', (failRes: unknown) => {
          const failure = failRes as { error?: { description?: string } };
          setSubmitError(`Payment failed: ${failure.error?.description || 'Transaction was declined.'}`);
          setIsSubmitting(false);
        });
        rzp.open();
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'An error occurred during payment initiation.');
        setIsSubmitting(false);
      }
      return;
    }

    // --- OPTION 2: CASH ON DELIVERY ---
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
        paymentMethod: 'Cash on Delivery (COD)',
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

      setOrderResult({
        orderId: data.orderId,
        paymentMethod: 'Cash on Delivery (COD)',
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
    const isOnlinePaid = Boolean(orderResult.paymentId);
    const whatsappText = `Hello Kiaan Nursery & Agro Care!\nI have placed an order on your site.\n\n*Order ID:* #KIAAN-${shortId}\n*Customer:* ${orderResult.customer.name}\n*Phone:* ${orderResult.customer.phone}\n*Payment Method:* ${orderResult.paymentMethod}${orderResult.paymentId ? `\n*Payment ID:* ${orderResult.paymentId}` : ''}\n*Items:*\n${orderResult.items.map(i => `• ${i.name} × ${i.quantity} (₹${i.price * i.quantity})`).join('\n')}\n*Total:* ₹${orderResult.total}\n*Delivery Address:* ${orderResult.customer.address}\n\nPlease confirm availability and dispatch details. Thank you!`;

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
              {isOnlinePaid
                ? 'Your payment was successfully verified. Your healthy plants and care essentials are being prepped for dispatch at our Habra nursery.'
                : 'Your order has been received by our nursery team in Habra and will be dispatched with botanical packaging.'}
            </p>

            <div className="order-id-badge">
              <span>Order Reference</span>
              <strong>#KIAAN-{shortId}</strong>
            </div>

            <div className="success-summary-box">
              <div className="summary-row">
                <span>Payment Method</span>
                <strong>{orderResult.paymentMethod}</strong>
              </div>
              {orderResult.paymentId && (
                <div className="summary-row">
                  <span>Razorpay Payment ID</span>
                  <span style={{ fontFamily: 'monospace', color: '#135818', fontWeight: 600 }}>
                    {orderResult.paymentId}
                  </span>
                </div>
              )}
              <div className="summary-row">
                <span>Order Status</span>
                <span className={`status-badge ${isOnlinePaid ? 'paid' : 'pending'}`} style={isOnlinePaid ? { background: '#d6edd4', color: '#135818', padding: '3px 9px', borderRadius: '6px', fontWeight: 700 } : undefined}>
                  {isOnlinePaid ? '✓ Paid & Confirmed' : 'Received • Cash on Delivery'}
                </span>
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

            {/* Step 3: Payment Options (Razorpay Online vs COD) */}
            <section className="form-card">
              <div className="form-card-header">
                <span className="step-number">3</span>
                <h2>Payment Method</h2>
              </div>
              <div className="payment-options-grid">
                <label className={`payment-card ${paymentOption === 'razorpay' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentOption === 'razorpay'}
                    onChange={() => setPaymentOption('razorpay')}
                  />
                  <div className="payment-card-content">
                    <div className="payment-card-title">
                      <strong>Razorpay Online Payment (UPI, Cards, NetBanking)</strong>
                      <span className="payment-badge green">Instant &bull; Recommended</span>
                    </div>
                    <p>
                      Pay securely using Google Pay, PhonePe, Paytm, BHIM UPI, Debit/Credit Card, or NetBanking. Instant automated confirmation.
                    </p>
                  </div>
                </label>

                <label className={`payment-card ${paymentOption === 'cod' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentOption === 'cod'}
                    onChange={() => setPaymentOption('cod')}
                  />
                  <div className="payment-card-content">
                    <div className="payment-card-title">
                      <strong>Cash on Delivery (COD)</strong>
                      <span className="payment-badge">Pay on Delivery</span>
                    </div>
                    <p>
                      Pay comfortably via Cash or UPI to the delivery courier when your plants arrive at your doorstep.
                    </p>
                  </div>
                </label>
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
                  <span>Processing Payment…</span>
                ) : paymentOption === 'razorpay' ? (
                  <>
                    <span>Pay {money(totalAmount)} with Razorpay</span>
                    <Icon name="arrow" />
                  </>
                ) : (
                  <>
                    <span>Place Cash on Delivery Order • {money(totalAmount)}</span>
                    <Icon name="arrow" />
                  </>
                )}
              </button>

              <div className="checkout-security-guarantee">
                <Icon name="shield" />
                <span>
                  {paymentOption === 'razorpay'
                    ? '128-bit Encrypted Razorpay Gateway • 100% Secure • Instant Dispatch Queue'
                    : 'Pay on Delivery • 100% Safe Botanical Transit • Hand-packaged at Habra'}
                </span>
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
                        <p className="checkout-item-sub">
                          Pot: 4–5 inch &bull; {p.categoryId === 'agrocare' ? 'Plant Care' : 'Adenium'}
                        </p>
                        <div className="checkout-item-calc">
                          <span className="item-unit-price">{money(p.price)} &times; {qty}</span>
                          <strong className="item-line-price">{money(p.price * qty)}</strong>
                        </div>
                      </div>
                      <div className="checkout-item-actions">
                        <div className="item-qty-pills">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => quantity(p.id, -1)}
                          >
                            <Icon name="minus" />
                          </button>
                          <span>{qty}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={qty >= 99}
                            onClick={() => quantity(p.id, 1)}
                          >
                            <Icon name="plus" />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="item-remove-link"
                          aria-label={`Remove ${p.name}`}
                          onClick={() => remove(p.id)}
                        >
                          <Icon name="trash" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Free shipping indicator */}
              {!isFreeShipping && (
                <div className="free-shipping-progress">
                  <div className="free-shipping-text">
                    <Icon name="truck" />
                    <span>
                      Add <strong>{money(freeShippingThreshold - subtotal)}</strong> more for <strong>FREE Delivery</strong>
                    </span>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100))}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Price Breakdown */}
              <dl className="checkout-breakdown">
                <div className="breakdown-row">
                  <dt>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</dt>
                  <dd>{money(subtotal)}</dd>
                </div>
                <div className="breakdown-row">
                  <dt>
                    <span>Delivery Charges</span>
                    {isFreeShipping && <small className="free-tag">FREE</small>}
                  </dt>
                  <dd>
                    {isFreeShipping ? (
                      <span className="free-val">₹0</span>
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

              {/* Support Hotline Box */}
              <div className="checkout-support-card">
                <div className="support-card-content">
                  <Icon name="support" />
                  <div>
                    <strong>Need help with your order?</strong>
                    <p>Call or WhatsApp our nursery specialists in Habra.</p>
                  </div>
                </div>
                <a
                  href="https://wa.me/916289417338"
                  target="_blank"
                  rel="noreferrer"
                  className="support-phone-link"
                >
                  <Icon name="phone" />
                  +91 62894 17338
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
