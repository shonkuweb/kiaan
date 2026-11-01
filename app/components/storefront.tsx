'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { money, getProductImageUrl, type Product, type Category } from '../lib/products';

export type IconName = 'menu' | 'search' | 'cart' | 'heart' | 'arrow' | 'leaf' | 'shield' | 'truck' | 'support' | 'mail' | 'close' | 'minus' | 'plus' | 'box' | 'return' | 'file' | 'phone' | 'pin' | 'instagram' | 'youtube' | 'trash' | 'tag' | 'filter' | 'grid' | 'chevron' | 'pot' | 'height' | 'flower' | 'check';

export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 16h12l1-16M10 10v8M14 10v8" /></>,
    tag: <><path d="M21 3H11L2 12l10 10 9-9V3Z" /><circle cx="16" cy="8" r="1" /></>,
    filter: <path d="M2 5h20M6 11h12M10 17h4M12 21h0" />,
    grid: <><path fill="currentColor" stroke="none" d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
    pot: <><path d="M3 6h18v4H3zM5 10l2 12h10l2-12M8 6V3h8v3" /></>,
    height: <path d="M12 2v20M8 6l4-4 4 4M8 18l4 4 4-4" />,
    flower: <><path d="M12 7c-6-10-13 1-5 5-10 2-2 13 5 5 6 8 14-3 5-5 8-4 1-15-5-5Z" /><circle cx="12" cy="12" r="3" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m6 11 5 5L22 5" /></>,
    menu: <path d="M3 5h18M3 12h18M3 19h18" />,
    search: <><circle cx="10.8" cy="10.8" r="7.5" /><path d="m16.2 16.2 5 5" /></>,
    cart: <><path d="M2 3h3l4 14h11l3-11H6" /><circle cx="10" cy="21" r="1" /><circle cx="19" cy="21" r="1" /></>,
    heart: <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />,
    arrow: <path d="M3 12h17m-6-6 6 6-6 6" />,
    leaf: <><path d="M7 22C8 12 13 7 21 3M8 16C4 16 2 12 2 7c4 0 6 2 7 5M10 17C9 7 14 3 23 2c0 10-4 15-13 15Z" /></>,
    shield: <><path d="M12 2c3 2 6 3 9 3v7c0 5-5 8-9 10-4-2-9-5-9-10V5c3 0 6-1 9-3Z" /><path d="m7 12 3 3 7-7" /></>,
    truck: <><path d="M1 4h15v14H1zM16 9h5l3 5v4h-8M17 13h6" /><circle cx="6" cy="19" r="2.5" /><circle cx="19" cy="19" r="2.5" /></>,
    support: <><path d="M3 14v-3a9 9 0 0 1 18 0v3M21 17c0 4-3 5-7 5" /><rect x="1" y="11" width="4" height="7" rx="2" /><rect x="19" y="11" width="4" height="7" rx="2" /><circle cx="13" cy="22" r="1.5" /></>,
    mail: <><rect x="2" y="4" width="20" height="16" rx="1" /><path d="m2 5 10 8L22 5" /></>,
    close: <path d="m5 5 14 14M19 5 5 19" />,
    minus: <path d="M5 12h14" />,
    plus: <path d="M5 12h14M12 5v14" />,
    box: <><path d="m12 2 10 5v12l-10 5-10-5V7L12 2Zm0 10v12M2 7l10 5 10-5M7 4l10 5" /></>,
    return: <><path d="M3 8a8 8 0 0 1 14-3l3 3M20 2v6h-6M21 16a8 8 0 0 1-14 3l-3-3M4 22v-6h6" /></>,
    file: <><path d="M5 2h10l5 5v15H5V2Zm10 0v6h5M8 12h9M8 16h9M8 20h6" /></>,
    phone: <path d="m5 2 4 5-3 3a17 17 0 0 0 8 8l3-3 5 4c-1 5-6 5-12 1S0 8 2 4l3-2Z" />,
    pin: <><path d="M20 10c0 6-8 13-8 13S4 16 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".6" /></>,
    youtube: <><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 6 3-6 3Z" /></>,
  };
  return (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function Brand() {
  const { setPanel, setInfo } = useStore();
  return (
    <Link className="brand" href="/" aria-label="Kiaan Nursery home" onClick={() => { setPanel(null); setInfo(null); }}>
      <img
        src="https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/kiaan/brand/kiaan-logo-1793535536482.png"
        alt="Kiaan Nursery & Agrocare"
        className="brand-logo-img"
        width="170"
        height="75"
      />
    </Link>
  );
}

type Cart = Record<string, number>;
type Panel = 'menu' | 'search' | 'cart' | 'guide' | null;
type Store = {
  products: Product[];
  cart: Cart;
  wishlist: string[];
  add: (product: Product, amount?: number) => void;
  quantity: (id: string, delta: number) => void;
  remove: (id: string) => void;
  clearCart: () => void;
  favorite: (id: string) => void;
  setPanel: (panel: Panel) => void;
  setInfo: (info: string | null) => void;
};

const StoreContext = createContext<Store | null>(null);

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('Storefront provider is required');
  return store;
}

export function ProductCard({ product, compact = false, collection = false }: { product: Product; compact?: boolean; collection?: boolean }) {
  const { wishlist, favorite, add } = useStore();
  const imageUrl = getProductImageUrl(product);

  return (
    <article className={`product-card ${compact ? 'compact' : ''} ${collection ? 'collection-card' : ''}`}>
      <div className="product-photo">
        <Link href={`/products/${product.id}`} aria-label={`View ${product.name}`}>
          <img src={imageUrl} alt={`${product.name} flower with green foliage`} loading="lazy" width="470" height="241" />
        </Link>
        {!collection && (
          <button
            className={`favorite ${wishlist.includes(product.id) ? 'selected' : ''}`}
            aria-label={`${wishlist.includes(product.id) ? 'Remove' : 'Save'} ${product.name} ${wishlist.includes(product.id) ? 'from' : 'to'} wishlist`}
            aria-pressed={wishlist.includes(product.id)}
            onClick={() => favorite(product.id)}
          >
            <Icon name="heart" />
          </button>
        )}
      </div>
      <div className="product-details">
        <h3><Link href={`/products/${product.id}`}>{product.name}</Link></h3>
        {collection && <p className="product-rating"><span>★</span> {(product.rating || 4.9).toFixed(1)} ({product.reviews || 0})</p>}
        <p className="price">{money(product.price)}</p>
        {!compact && (
          <button className="add-cart" onClick={() => add(product)}>
            <Icon name="cart" />Add to Cart
          </button>
        )}
      </div>
    </article>
  );
}

function SiteHeader({ modal = false }: { modal?: boolean }) {
  const { cart, setPanel } = useStore();
  const count = Object.values(cart).reduce((sum, n) => sum + n, 0);
  return (
    <header className="site-header" id={modal ? undefined : 'home'}>
      <div className="header-inner">
        <button className="icon-button menu-toggle" aria-label="Open navigation" onClick={() => setPanel('menu')}>
          <Icon name="menu" />
        </button>
        <Brand />
        <div className="header-actions">
          <button className="icon-button" aria-label="Search plants" onClick={() => setPanel('search')}>
            <Icon name="search" />
          </button>
          <button className="icon-button cart-toggle" aria-label={`Open cart, ${count} items`} onClick={() => setPanel('cart')}>
            <Icon name="cart" />
            <span className="cart-count">{count}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export function Storefront({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [panel, setPanel] = useState<'menu' | 'search' | 'cart' | 'guide' | null>(null);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [cart, setCart] = useState<Cart>({});
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    fetch('/api/products')
      .then(res => (res.ok ? res.json() : []))
      .then(items => {
        if (Array.isArray(items)) setCatalog(items);
      })
      .catch(() => {});

    fetch('/api/categories')
      .then(res => (res.ok ? res.json() : []))
      .then(cats => {
        if (Array.isArray(cats)) setCategories(cats);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem('kiaan-cart') || '{}');
      const savedWishlist = JSON.parse(localStorage.getItem('kiaan-wishlist') || '[]');
      if (savedCart && typeof savedCart === 'object' && !Array.isArray(savedCart)) {
        setCart(
          Object.fromEntries(
            Object.entries(savedCart).filter(
              ([, n]) => Number.isInteger(n) && Number(n) > 0 && Number(n) <= 99
            )
          ) as Cart
        );
      }
      if (Array.isArray(savedWishlist)) setWishlist(savedWishlist);
    } catch {
      // LocalStorage error fallback
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      try { localStorage.setItem('kiaan-cart', JSON.stringify(cart)); } catch {}
    }
  }, [cart, hydrated]);

  useEffect(() => {
    if (hydrated) {
      try { localStorage.setItem('kiaan-wishlist', JSON.stringify(wishlist)); } catch {}
    }
  }, [wishlist, hydrated]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!panel && !info) return;
    openerRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => panelRef.current?.querySelector<HTMLElement>('button, input, a')?.focus(), 0);
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') { setPanel(null); setInfo(null); }
      if (event.key === 'Tab') {
        const items = panelRef.current?.querySelectorAll<HTMLElement>('button, input, a[href]');
        if (!items?.length) return;
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    window.addEventListener('keydown', keydown);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
      window.removeEventListener('keydown', keydown);
      openerRef.current?.focus();
    };
  }, [panel, info]);

  const count = Object.values(cart).reduce((sum, n) => sum + n, 0);

  function add(product: Product, amount = 1) {
    setCart(c => ({ ...c, [product.id]: Math.min(99, (c[product.id] || 0) + amount) }));
    setToast(`${product.name} added to your cart`);
  }

  function quantity(id: string, delta: number) {
    setCart(c => {
      const next = { ...c };
      next[id] = Math.min(99, (next[id] || 0) + delta);
      if (next[id] <= 0) delete next[id];
      return next;
    });
  }

  function favorite(id: string) {
    setWishlist(w => (w.includes(id) ? w.filter(item => item !== id) : [...w, id]));
  }

  function remove(id: string) {
    setCart(c => {
      const next = { ...c };
      delete next[id];
      return next;
    });
  }

  function clearCart() {
    setCart({});
    try { localStorage.removeItem('kiaan-cart'); } catch {}
  }

  useEffect(() => {
    setPanel(null);
    setInfo(null);
  }, [pathname]);

  if (pathname === '/admin' || pathname.startsWith('/admin/')) return <>{children}</>;

  const wishlistProducts = catalog.filter(p => wishlist.includes(p.id));
  const searchResults = catalog.filter(p => p.name.toLowerCase().includes(query.toLowerCase().trim()));

  return (
    <StoreContext.Provider value={{ products: catalog, cart, wishlist, add, quantity, remove, clearCart, favorite, setPanel, setInfo }}>
      <SiteHeader />
      {children}
      <footer className="footer" id="contact">
        <svg className="footer-wave" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true">
          <path fill="#4f7e23" d="M0 50C150-30 210 120 470 50S970-20 1440 30V100H0Z" />
          <path fill="#103812" d="M0 90C170 0 230 130 480 60S1000-20 1440 60V100H0Z" />
        </svg>
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <Brand />
              <p>Grow greener, live better.<br />With Kiaan.</p>
              <div className="socials">
                <button aria-label="YouTube" onClick={() => setInfo('Follow Kiaan')}><Icon name="youtube" /></button>
                <button aria-label="Instagram" onClick={() => setInfo('Follow Kiaan')}><Icon name="instagram" /></button>
                <button aria-label="Facebook" onClick={() => setInfo('Follow Kiaan')}><b>f</b></button>
                <a href="https://wa.me/916289417338" target="_blank" rel="noreferrer" aria-label="Contact Kiaan on WhatsApp"><Icon name="phone" /></a>
              </div>
            </div>
            <div className="footer-links">
              <h2>Quick Links</h2>
              {[
                ['Home', '/'],
                ['Shop All', '/collections/adenium'],
                ['Adenium Collection', '/collections/adenium'],
                ['About Us', '/about'],
                ['Checkout', '/checkout'],
                ['Contact Us', '#contact'],
              ].map(([label, href]) => (
                <Link key={label} href={href}>{label}<span>›</span></Link>
              ))}
            </div>
            <div className="footer-links customer-care">
              <h2>Customer Care</h2>
              {[
                ['support', 'Help & Support'],
                ['box', 'Shipping Info'],
                ['return', 'Returns & Refunds'],
                ['shield', 'Privacy Policy'],
                ['file', 'Terms & Conditions'],
              ].map(([icon, label]) => (
                <button key={label} onClick={() => setInfo(label)}>
                  <Icon name={icon as IconName} />{label}
                </button>
              ))}
            </div>
          </div>
          <div className="footer-middle">
            <div className="get-in-touch">
              <h2>Get in Touch</h2>
              <a href="tel:+916289417338"><Icon name="phone" />+91 62894 17338</a>
              <a href="mailto:kiaan@nursery.in"><Icon name="mail" />kiaan@nursery.in</a>
              <p><Icon name="pin" /><span>Habra, North 24 Parganas,<br />West Bengal</span></p>
            </div>
            <div className="footer-newsletter">
              <h2>Stay Updated</h2>
              <p>Get the latest updates on new plants,<br />offers and more.</p>
              <NewsletterForm footer />
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 Kiaan Nursery. All rights reserved.</p>
            <p>Made with <span className="red-heart">♥</span> in Kolkata</p>
          </div>
        </div>
        <svg className="bottom-wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
          <path fill="#2e5d18" d="M0 0c280 160 300-40 650 55s290-90 790 30v35H0Z" />
          <path fill="#527e1e" d="M0 90C300-80 390 10 740 80s400-70 700-30v70H0Z" />
          <path fill="#204e16" d="M0 110C300 40 360-10 700 70s480 25 740-15v65H0Z" />
        </svg>
      </footer>

      {(panel || info) && (
        <div className="modal-backdrop" onClick={() => { setPanel(null); setInfo(null); }}>
          <div
            className={`dialog ${panel === 'menu' ? 'nav-dialog reference-cart-dialog fullscreen-menu' : ''} ${panel === 'cart' ? 'cart-dialog reference-cart-dialog' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            ref={panelRef}
            onClick={e => e.stopPropagation()}
          >
            {(panel === 'cart' || panel === 'menu') && <SiteHeader modal />}
            <div className={panel === 'cart' || panel === 'menu' ? 'cart-modal-body' : 'dialog-body'}>
              <div className="dialog-heading">
                <h2 id="dialog-title">
                  {panel === 'cart' && <Icon name="cart" />}
                  {info || (panel === 'menu' ? 'Welcome to Kiaan' : panel === 'search' ? 'Find your perfect Adenium' : panel === 'cart' ? <>Your Cart <span className="cart-title-count">({count} {count === 1 ? 'Item' : 'Items'})</span></> : 'Adenium Care Guide')}
                </h2>
                <button className="icon-button" aria-label="Close dialog" onClick={() => { setPanel(null); setInfo(null); }}>
                  <Icon name="close" />
                </button>
              </div>

              {panel === 'menu' && (
                <nav className="drawer-nav">
                  <Link href="/" onClick={() => setPanel(null)}>
                    Home<Icon name="arrow" />
                  </Link>

                  {/* Categories Accordion / Dropdown */}
                  <div className="drawer-accordion-wrap">
                    <button
                      type="button"
                      className={`drawer-accordion-btn ${categoriesOpen ? 'is-open' : ''}`}
                      onClick={() => setCategoriesOpen(!categoriesOpen)}
                      aria-expanded={categoriesOpen}
                    >
                      <span className="drawer-accordion-title">
                        <span>Categories</span>
                        {categories.length > 0 && <small className="drawer-accordion-badge">{categories.length}</small>}
                      </span>
                      <Icon name="chevron" className={`drawer-accordion-arrow ${categoriesOpen ? 'rotated' : ''}`} />
                    </button>

                    {categoriesOpen && (
                      <div className="drawer-categories-sublist">
                        {categories.map(c => {
                          const thumb = c.image || (c.id === 'agrocare' ? '/images/essentials.webp' : '/images/collection.webp');
                          return (
                            <Link
                              key={c.id}
                              href={`/?category=${c.id}#store-catalog`}
                              className="drawer-category-item"
                              onClick={() => {
                                setPanel(null);
                                window.dispatchEvent(new CustomEvent('select-category', { detail: c.id }));
                              }}
                            >
                              <div className="drawer-category-thumb">
                                <img src={thumb} alt="" width="36" height="36" />
                              </div>
                              <span className="drawer-category-name">{c.name}</span>
                              <Icon name="arrow" className="drawer-category-arrow" />
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <Link href="/about" onClick={() => setPanel(null)}>
                    About Us<Icon name="arrow" />
                  </Link>
                  <Link href="/checkout" onClick={() => setPanel(null)}>
                    Checkout<Icon name="arrow" />
                  </Link>
                  <Link href="/#reviews" onClick={() => setPanel(null)}>
                    Customer Reviews<Icon name="arrow" />
                  </Link>
                  <Link href="/#care" onClick={() => setPanel(null)}>
                    Plant Care<Icon name="arrow" />
                  </Link>
                  <Link href="#contact" onClick={() => setPanel(null)}>
                    Contact Us<Icon name="arrow" />
                  </Link>
                  <p className="wishlist-summary"><Icon name="heart" />{wishlist.length} plants in your wishlist</p>
                  {wishlist.length > 0 && (
                    <div className="mini-results">
                      {wishlistProducts.map(p => (
                        <div key={p.id}>
                          <img src={getProductImageUrl(p)} alt="" />
                          <span>{p.name}<small>{money(p.price)}</small></span>
                          <button aria-label={`Add ${p.name} to cart`} onClick={() => add(p)}>
                            <Icon name="plus" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </nav>
              )}

              {panel === 'search' && (
                <>
                  <div className="search-field">
                    <Icon name="search" />
                    <input autoFocus aria-label="Search Adenium plants" placeholder="Search by name or color…" value={query} onChange={e => setQuery(e.target.value)} />
                  </div>
                  <div className="search-results">
                    {searchResults.map(p => (
                      <div key={p.id}>
                        <img src={getProductImageUrl(p)} alt={p.name} />
                        <span>
                          <Link href={`/products/${p.id}`} onClick={() => setPanel(null)}>
                            <strong>{p.name}</strong>
                          </Link>
                          <small>{money(p.price)}</small>
                        </span>
                        <button className="small-add" onClick={() => add(p)} aria-label={`Add ${p.name} to cart`}>
                          <Icon name="plus" />
                        </button>
                      </div>
                    ))}
                    {searchResults.length === 0 && (
                      <p className="empty-state">No plants found. Try “pink”, “red”, or “Adenium”.</p>
                    )}
                  </div>
                </>
              )}

              {panel === 'cart' && <CartContent />}

              {panel === 'guide' && (
                <div className="guide-content">
                  <img src="/images/care-guide.webp" alt="Flowering Adenium in a pot" />
                  <p>A little care goes a long way. Give your Adenium the right conditions for healthy growth and beautiful flowers.</p>
                  <h3>Let the sunshine in</h3>
                  <p>Choose a bright spot with plenty of direct sunlight. Introduce plants to stronger sun gradually.</p>
                  <h3>Water with care</h3>
                  <p>Allow the potting mix to dry between waterings. Avoid standing water, especially during cool or rainy weather.</p>
                  <h3>Keep roots happy</h3>
                  <p>Use a pot with drainage holes and a loose, well-draining growing mix. Protect your plant from cold and frost.</p>
                  <h3>A little extra love</h3>
                  <p>Feed lightly during active growth and check leaves regularly. Keep plants away from children and pets.</p>
                  <a href="https://wa.me/916289417338" className="text-link" target="_blank" rel="noreferrer">
                    Ask us about your plant <Icon name="arrow" />
                  </a>
                </div>
              )}

              {info && (
                <div className="info-content">
                  {info === 'Customer reviews' ? (
                    <p>The reviews and rating shown on this homepage reproduce the supplied design. Verified customer reviews will appear here when the store launches.</p>
                  ) : info === 'About Kiaan' ? (
                    <p>Kiaan Agro Care &amp; Nursery is based in Habra, North 24 Parganas, West Bengal. We bring beautiful Adenium varieties and plant care support to your garden.</p>
                  ) : info === 'Follow Kiaan' ? (
                    <p>Our social profiles will be linked here when the store launches. For now, connect with us on WhatsApp for plant updates.</p>
                  ) : (
                    <p>{info === 'Help & Support' ? 'Need help choosing or caring for an Adenium? Get in touch with our nursery team.' : 'Our store is getting ready to launch. Please contact the nursery for current details before placing an order.'}</p>
                  )}
                  <a href="mailto:kiaan@nursery.in"><Icon name="mail" />kiaan@nursery.in</a>
                  <a href="tel:+916289417338"><Icon name="phone" />+91 62894 17338</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className={`toast ${toast ? 'visible' : ''}`} role="status" aria-live="polite">{toast}</div>
    </StoreContext.Provider>
  );
}

export function NewsletterForm({ footer = false }: { footer?: boolean }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  function subscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.location.href = `mailto:kiaan@nursery.in?subject=${encodeURIComponent('New arrivals subscription')}&body=${encodeURIComponent(`Please add ${email.trim()} to Kiaan's new arrivals and offers mailing list.`)}`;
    setMessage('Send the email request to join our updates.');
  }
  return (
    <form className={`newsletter-form ${footer ? 'footer-form' : ''}`} onSubmit={subscribe}>
      <div className="email-field">
        <Icon name="mail" />
        <input aria-label="Email address for nursery updates" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={254} />
      </div>
      <button className="pill dark" type="submit">Subscribe <Icon name="arrow" /></button>
      {message && <p className="form-message" role="status">{message}</p>}
    </form>
  );
}

function CartContent() {
  const { cart, quantity, remove, setPanel, products: catalog } = useStore();
  const [promoOpen, setPromoOpen] = useState(false);
  const [promo, setPromo] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [checkout, setCheckout] = useState(false);

  const count = Object.values(cart).reduce((sum, n) => sum + n, 0);
  const items = catalog.filter(p => cart[p.id]);
  const subtotal = items.reduce((sum, p) => sum + p.price * cart[p.id], 0);

  return count === 0 ? (
    <div className="empty-state">
      <Icon name="cart" />
      <h3>Your garden starts here</h3>
      <p>Your cart is waiting for something beautiful.</p>
      <Link href="/collections/adenium" className="pill dark" onClick={() => setPanel(null)}>
        Explore plants <Icon name="arrow" />
      </Link>
    </div>
  ) : (
    <div className="reference-cart-content">
      <div className="reference-cart-items">
        {items.map(p => (
          <article className="reference-cart-item" key={p.id}>
            <Link href={`/products/${p.id}`} onClick={() => setPanel(null)} className="cart-product-image">
              <img src={getProductImageUrl(p)} alt={p.name} />
            </Link>
            <div className="cart-product-info">
              <h3><Link href={`/products/${p.id}`} onClick={() => setPanel(null)}>{p.name}</Link></h3>
              <p className="cart-unit-price">{money(p.price)}</p>
              <p className="cart-pot-size">Pot Size: 4–5 inch</p>
            </div>
            <button className="remove-item icon-button" aria-label={`Remove ${p.name} from cart`} onClick={() => remove(p.id)}>
              <Icon name="trash" />
            </button>
            <div className="reference-quantity">
              <button aria-label={`Decrease ${p.name} quantity`} onClick={() => quantity(p.id, -1)}><Icon name="minus" /></button>
              <span>{cart[p.id]}</span>
              <button aria-label={`Increase ${p.name} quantity`} onClick={() => quantity(p.id, 1)} disabled={cart[p.id] >= 99}><Icon name="plus" /></button>
            </div>
            <strong className="cart-line-total">{money(p.price * cart[p.id])}</strong>
          </article>
        ))}
      </div>
      <section className="promo-code">
        <button className="promo-code-toggle" aria-expanded={promoOpen} onClick={() => setPromoOpen(!promoOpen)}>
          <Icon name="tag" />
          <strong>Have a promo code?</strong>
          <span>Apply <Icon name="arrow" /></span>
        </button>
        {promoOpen && (
          <form className="promo-code-form" onSubmit={e => { e.preventDefault(); setPromoMessage('Promo codes will be available when online checkout launches.'); }}>
            <input value={promo} onChange={e => setPromo(e.target.value)} placeholder="Enter promo code" aria-label="Promo code" required maxLength={40} />
            <button type="submit" className="pill dark">Apply</button>
            {promoMessage && <p role="status">{promoMessage}</p>}
          </form>
        )}
      </section>
      <section className="order-summary">
        <img src="https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/kiaan/brand/kiaan-logo-1793535536482.png" alt="" className="summary-watermark" />
        <h3>Order Summary</h3>
        <dl>
          <div>
            <dt>Subtotal ({count} {count === 1 ? 'item' : 'items'})</dt>
            <dd>{money(subtotal)}</dd>
          </div>
          <div>
            <dt>Shipping (calculated at checkout)</dt>
            <dd>—</dd>
          </div>
          <div className="summary-total">
            <dt>Total</dt>
            <dd>{money(subtotal)}</dd>
          </div>
        </dl>
      </section>
      <Link
        href="/checkout"
        className="checkout-button pill dark"
        onClick={() => setPanel(null)}
      >
        Proceed to Checkout <Icon name="arrow" />
      </Link>
      <div className="cart-whatsapp-option">
        <a
          className="text-link"
          target="_blank"
          rel="noreferrer"
          href={`https://wa.me/916289417338?text=${encodeURIComponent(
            `Hello Kiaan! I'm looking at these plants:\n${items.map(p => `${p.name} × ${cart[p.id]} — ${money(p.price * cart[p.id])}`).join('\n')}\nSubtotal: ${money(subtotal)}`
          )}`}
        >
          Or enquire directly on WhatsApp <Icon name="arrow" />
        </a>
      </div>
    </div>
  );
}
