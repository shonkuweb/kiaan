'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Icon, type IconName } from '../components/storefront';
import { money, getProductImageUrl } from '../lib/products';
import './admin.css';
import { HeroEditor } from './hero-editor';
import { ProductEditor } from './product-editor';
import type { InventoryProduct, ProductCategory } from './product-types';

type Tab = 'inventory' | 'orders' | 'categories' | 'settings';
type Category = ProductCategory;
type Item = InventoryProduct;
type Order = { id: string; customer: string; details: string; total: number; status: string; date: string };
type Settings = {
  title: string;
  subtitle: string;
  hero: boolean;
  featured: boolean;
  reviews: boolean;
  newsletter: boolean;
  adminPassword?: string;
  minOrderValue?: number;
  minOrderQuantity?: number;
  deliveryCharge?: number;
  freeDeliveryThreshold?: number;
  hasPassword?: boolean;
};
type Data = { categories: Category[]; products: Item[]; orders: Order[]; settings: Settings };

const initialSettings: Settings = {
  title: 'Beautiful Adenium Plants for Your Garden',
  subtitle: 'Rare varieties, healthy plants and complete care support.',
  hero: true,
  featured: true,
  reviews: true,
  newsletter: true,
  minOrderValue: 0,
  minOrderQuantity: 1,
  deliveryCharge: 69,
  freeDeliveryThreshold: 999,
};

const initial: Data = {
  categories: [],
  products: [],
  orders: [],
  settings: initialSettings,
};

const statuses = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];
const tabs: { id: Tab; label: string; href: string; icon: IconName }[] = [
  { id: 'inventory', label: 'Inventory', href: '/admin', icon: 'box' },
  { id: 'orders', label: 'Orders', href: '/admin/orders', icon: 'file' },
  { id: 'categories', label: 'Categories', href: '/admin/categories', icon: 'tag' },
  { id: 'settings', label: 'Store settings', href: '/admin/settings', icon: 'grid' },
];

export function AdminPanel({ tab }: { tab: Tab }) {
  const [data, setData] = useState<Data>(initial);
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All orders');
  const [categoryId, setCategoryId] = useState('');
  const [editingProduct, setEditingProduct] = useState<Item | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryImage, setCategoryImage] = useState('');
  const [categoryImageUploading, setCategoryImageUploading] = useState(false);
  const [modal, setModal] = useState<'product' | 'hero' | 'category' | 'settings' | 'order' | 'visibility' | null>(null);
  const [deleting, setDeleting] = useState<Item | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  async function loadData() {
    try {
      const [prodRes, catRes, ordRes, setRes] = await Promise.all([
        fetch('/api/admin/products', { cache: 'no-store' }),
        fetch('/api/admin/categories', { cache: 'no-store' }),
        fetch('/api/admin/orders', { cache: 'no-store' }),
        fetch('/api/admin/settings', { cache: 'no-store' }),
      ]);

      const [products, categories, orders, settings] = await Promise.all([
        prodRes.ok ? prodRes.json() : [],
        catRes.ok ? catRes.json() : [],
        ordRes.ok ? ordRes.json() : [],
        setRes.ok ? setRes.json() : initialSettings,
      ]);

      const validCategories: Category[] = Array.isArray(categories) ? categories : [];
      setData({
        categories: validCategories,
        products: Array.isArray(products) ? products : [],
        orders: Array.isArray(orders) ? orders : [],
        settings: settings || initialSettings,
      });

      if (validCategories.length > 0 && !categoryId) {
        setCategoryId(validCategories[0].id);
      }
    } catch {
      setError('Could not connect to database backend.');
    } finally {
      setReady(true);
    }
  }

  async function handleCategoryImageUpload(file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      return setError('Choose a JPG, PNG or WebP file up to 8 MB.');
    }
    setCategoryImageUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/admin/products/images', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setCategoryImage(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image.');
    } finally {
      setCategoryImageUploading(false);
    }
  }

  useEffect(() => {
    const localAuth = typeof window !== 'undefined' ? sessionStorage.getItem('kiaan_admin_auth') : null;
    if (localAuth === 'true') {
      setIsAuthenticated(true);
      loadData();
      return;
    }

    fetch('/api/admin/auth')
      .then(res => (res.ok ? res.json() : { authenticated: false }))
      .then(authData => {
        if (authData.authenticated) {
          setIsAuthenticated(true);
          loadData();
        } else {
          setIsAuthenticated(false);
          setReady(true);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        setReady(true);
      });
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword }),
      });
      const resData = await res.json();
      if (!res.ok) {
        setLoginError(resData.error || 'Incorrect admin password.');
        setIsLoggingIn(false);
        return;
      }
      sessionStorage.setItem('kiaan_admin_auth', 'true');
      setIsAuthenticated(true);
      setLoginPassword('');
      loadData();
    } catch {
      setLoginError('Could not connect to authentication service.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleLogout() {
    sessionStorage.removeItem('kiaan_admin_auth');
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
    } catch {}
    setIsAuthenticated(false);
  }

  useEffect(() => {
    if ((modal && modal !== 'hero' && modal !== 'product') || deleting) {
      opener.current = document.activeElement as HTMLElement;
      dialog.current?.showModal();
    }
  }, [modal, deleting]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 4500);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (modal === 'category') {
      setCategoryImage(editingCategory?.image || '');
    }
  }, [modal, editingCategory]);

  function close() {
    dialog.current?.close();
    setModal(null);
    setDeleting(null);
    setEditingCategory(null);
    setEditingProduct(null);
    setCategoryImage('');
    setCategoryImageUploading(false);
    setError('');
    opener.current?.focus();
  }

  async function saveProduct(item: Item): Promise<boolean> {
    try {
      const isEdit = Boolean(editingProduct);
      const res = await fetch('/api/admin/products', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || 'Failed to save product.');
        return false;
      }

      setData(prev => ({
        ...prev,
        products: isEdit ? prev.products.map(p => (p.id === result.id ? result : p)) : [result, ...prev.products],
      }));
      setCategoryId(result.categoryId);
      setMessage(isEdit ? 'Product updated.' : 'Product added.');
      close();
      return true;
    } catch {
      setError('Failed to reach backend database.');
      return false;
    }
  }

  async function deleteCurrentProduct(productToDelete: Item) {
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(productToDelete.id)}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to delete product.');
      }
      setData(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== productToDelete.id),
      }));
      setMessage('Product removed from database.');
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete product.');
    }
  }

  async function removeCategory(category: Category) {
    if (data.products.some(p => p.categoryId === category.id)) return;
    try {
      const res = await fetch(`/api/admin/categories?id=${encodeURIComponent(category.id)}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok) {
        return setError(result.error || 'Failed to remove category.');
      }
      setData(prev => {
        const nextCats = prev.categories.filter(c => c.id !== category.id);
        if (categoryId === category.id && nextCats.length > 0) {
          setCategoryId(nextCats[0].id);
        }
        return { ...prev, categories: nextCats };
      });
      setMessage('Category removed.');
    } catch {
      setError('Could not remove category.');
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) || '').trim();

    if (modal === 'category') {
      const name = value('categoryName').replace(/\s+/g, ' ');
      const isVisible = form.has('isVisible');
      if (!name || name.length > 50) return setError('Enter a category name of up to 50 characters.');

      const isEdit = Boolean(editingCategory);
      try {
        const res = await fetch('/api/admin/categories', {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            isEdit
              ? { id: editingCategory!.id, name, isVisible, image: categoryImage.trim() }
              : { name, isVisible, image: categoryImage.trim() }
          ),
        });
        const result = await res.json();
        if (!res.ok) return setError(result.error || 'Failed to save category.');

        setData(prev => ({
          ...prev,
          categories: isEdit
            ? prev.categories.map(c => (c.id === result.id ? result : c))
            : [...prev.categories, result],
        }));
        if (!categoryId) setCategoryId(result.id);
        setMessage(isEdit ? 'Category updated.' : 'Category added.');
        close();
      } catch {
        setError('Failed to reach backend.');
      }
    } else if (modal === 'settings') {
      const currentPassword = String(form.get('currentPassword') || '').trim();
      const newPassword = String(form.get('newPassword') || '').trim();
      const confirmPassword = String(form.get('confirmPassword') || '').trim();

      if (newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) {
          return setError('New password and confirm password do not match.');
        }
        if (newPassword.length < 4) {
          return setError('New password must be at least 4 characters long.');
        }
      }

      const minOrderValue = Math.max(0, Number(form.get('minOrderValue')) || 0);
      const minOrderQuantity = Math.max(1, Number(form.get('minOrderQuantity')) || 1);
      const deliveryCharge = Math.max(0, Number(form.get('deliveryCharge')) || 0);
      const freeDeliveryThreshold = Math.max(0, Number(form.get('freeDeliveryThreshold')) || 0);

      const payload: Record<string, any> = {
        minOrderValue,
        minOrderQuantity,
        deliveryCharge,
        freeDeliveryThreshold,
        hero: form.has('hero'),
        featured: form.has('featured'),
        reviews: form.has('reviews'),
        newsletter: form.has('newsletter'),
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      try {
        const res = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) return setError(result.error || 'Failed to save settings.');

        setData(prev => ({ ...prev, settings: result }));
        setMessage('Store settings updated successfully.');
        close();
      } catch {
        setError('Failed to save settings.');
      }
    }
  }

  async function updateOrderStatus(id: string, nextStatus: string) {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const result = await res.json();
      if (!res.ok) return setError(result.error || 'Failed to update order status.');
      setData(prev => ({
        ...prev,
        orders: prev.orders.map(o => (o.id === id ? { ...o, status: nextStatus } : o)),
      }));
      setMessage('Order status updated.');
    } catch {
      setError('Could not update status.');
    }
  }

  const activeCategory = data.categories.find(c => c.id === categoryId) || data.categories[0];
  const categoryProducts = data.products.filter(p => p.categoryId === activeCategory?.id);
  const visibleProducts = categoryProducts.filter(p => p.name.toLowerCase().includes(query.toLowerCase().trim()));

  function selectCategory(id: string) {
    setCategoryId(id);
    setQuery('');
  }

  const visibleOrders = data.orders.filter(
    o =>
      (filter === 'All orders' || o.status === filter) &&
      `${o.customer} ${o.id} ${o.details}`.toLowerCase().includes(query.toLowerCase().trim())
  );
  const current = tabs.find(t => t.id === tab)!;

  if (isAuthenticated === false) {
    return (
      <div className="admin-login-screen">
        <div className="admin-login-card">
          <div className="admin-login-logo">
            <img
              src="https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/kiaan/brand/kiaan-logo-dark-1793535754883.png"
              alt="Kiaan Nursery"
              width="170"
              height="55"
              style={{ objectFit: 'contain' }}
            />
          </div>
          <h1>Admin Sign In</h1>
          <p>Please enter your administrator password to access inventory, orders, and store settings.</p>
          <form onSubmit={handleLogin}>
            <div className="admin-login-field">
              <label htmlFor="admin-pwd">Admin Password</label>
              <input
                id="admin-pwd"
                type="password"
                required
                autoFocus
                placeholder="Enter password (default: admin)"
                value={loginPassword}
                onChange={e => {
                  setLoginPassword(e.target.value);
                  setLoginError('');
                }}
              />
            </div>
            {loginError && <p className="admin-login-error">{loginError}</p>}
            <button
              type="submit"
              disabled={isLoggingIn || !loginPassword.trim()}
              className="admin-button primary"
              style={{ width: '100%', marginTop: '14px', height: '44px' }}
            >
              {isLoggingIn ? 'Verifying…' : 'Sign In to Admin Panel'}
            </button>
          </form>
          <div className="admin-login-footer">
            <Link href="/" className="admin-back-store">
              ← Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px' }}>
          <img
            src="https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/kiaan/brand/kiaan-logo-dark-1793535754883.png"
            alt="Kiaan Nursery & Agrocare"
            style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
          />
        </Link>
        <p className="admin-nav-label">YOUR WORKSPACE</p>
        <nav aria-label="Admin navigation">
          {tabs.map(t => (
            <Link key={t.id} href={t.href} className={tab === t.id ? 'selected' : ''} aria-current={tab === t.id ? 'page' : undefined}>
              <Icon name={t.icon} />
              <span>{t.label}</span>
              {tab === t.id && <span className="admin-nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-grow">
            <Icon name="leaf" />
            <strong>A little care. A lot of growth.</strong>
            <p>Database connected & live.</p>
          </div>
          <Link href="/" className="admin-view-store">View storefront <Icon name="arrow" /></Link>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <span>Workspace <span className="admin-divider">/</span> <strong>{current.label}</strong></span>
          <div className="admin-account" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="admin-avatar">K</span>
            <span>Kiaan Nursery<small>Admin workspace</small></span>
            <button
              type="button"
              className="admin-logout-btn"
              onClick={handleLogout}
              title="Sign out of Admin Panel"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="admin-main">
          <div className="admin-page-heading">
            <div>
              {tab !== 'settings' && <p className="admin-kicker">KIAAN AGRO CARE & NURSERY</p>}
              <h1>{current.label}</h1>
              {tab !== 'settings' && (
                <p>
                  {tab === 'inventory'
                    ? 'Manage your database-backed nursery inventory.'
                    : tab === 'orders'
                    ? 'Keep every order moving, from your nursery to their home.'
                    : 'Organize your products into categories and control visibility.'}
                </p>
              )}
            </div>
            {tab !== 'settings' && tab !== 'orders' && (
              <button
                className="admin-button primary"
                disabled={!ready || (tab === 'inventory' && !data.categories.length)}
                onClick={() => {
                  setEditingCategory(null);
                  setEditingProduct(null);
                  setModal(tab === 'inventory' ? 'product' : 'category');
                }}
              >
                <Icon name="plus" />
                {tab === 'inventory' ? 'Add product' : 'Add category'}
              </button>
            )}
          </div>

          {tab !== 'settings' && (
            <div className="admin-draft-note">
              <span className="admin-status-dot" />
              <p>
                <strong>Live Database Connected</strong> · Products, categories, and featured flags are saved to the backend database and immediately reflected on your storefront.
              </p>
            </div>
          )}

          {error && !modal && !deleting && <p className="admin-error" role="alert">{error}</p>}

          {!ready ? (
            <div className="admin-empty" role="status">Loading your workspace from database…</div>
          ) : (
            <>
              {tab === 'inventory' && (
                <>
                  <div className="admin-category-tabs" role="tablist" aria-label="Inventory categories">
                    {data.categories.map(c => (
                      <button
                        key={c.id}
                        id={`category-tab-${c.id}`}
                        type="button"
                        role="tab"
                        aria-selected={activeCategory?.id === c.id}
                        aria-controls="category-products"
                        tabIndex={activeCategory?.id === c.id ? 0 : -1}
                        onClick={() => selectCategory(c.id)}
                      >
                        <span>{c.name}</span>
                        {!c.isVisible && <small style={{ background: '#f5e9e2', color: '#a15838' }}>Hidden</small>}
                        <small>{data.products.filter(p => p.categoryId === c.id).length}</small>
                      </button>
                    ))}
                  </div>

                  <div id="category-products" role="tabpanel" aria-labelledby={activeCategory ? `category-tab-${activeCategory.id}` : undefined} tabIndex={0}>
                    <section className="admin-stats" aria-label="Inventory summary">
                      {[
                        { label: 'Category products', value: categoryProducts.length, icon: 'box' },
                        { label: 'Featured in store', value: categoryProducts.filter(p => p.isFeatured).length, icon: 'flower' },
                        { label: 'Total units in stock', value: categoryProducts.reduce((n, p) => n + p.stock, 0), icon: 'leaf' },
                      ].map(s => (
                        <div className="admin-stat" key={s.label}>
                          <div>
                            <p>{s.label}</p>
                            <strong>{s.value}</strong>
                          </div>
                          <span><Icon name={s.icon as IconName} /></span>
                        </div>
                      ))}
                    </section>

                    <section className="admin-card">
                      <div className="admin-card-header">
                        <div>
                          <h2>{activeCategory?.name || 'Your products'} <span>{categoryProducts.length}</span></h2>
                        </div>
                        <label className="admin-search">
                          <Icon name="search" />
                          <input aria-label="Search products" placeholder="Search products…" value={query} onChange={e => setQuery(e.target.value)} />
                        </label>
                      </div>

                      <div className="admin-product-head">
                        <span>Product</span>
                        <span>Price</span>
                        <span>Stock & Status</span>
                        <span>Action</span>
                      </div>

                      <div className="admin-product-list">
                        {visibleProducts.map(p => (
                          <article className="admin-product-row" key={p.id}>
                            <div className="admin-product-name">
                              <img src={getProductImageUrl(p)} alt="" width="56" height="56" />
                              <div>
                                <strong>{p.name}</strong>
                                <small>
                                  {activeCategory?.name}
                                  {p.isFeatured && ' · Featured'}
                                </small>
                              </div>
                            </div>
                            <div className="admin-price">
                              <small>Price</small>
                              {money(p.price)}
                            </div>
                            <div className="admin-stock" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <span className={`admin-badge ${p.stock ? 'green' : 'neutral'}`}>
                                {p.stock ? `${p.stock} in stock` : 'Out of stock'}
                              </span>
                              {p.isFeatured ? (
                                <span className="admin-badge featured" title="Shown in Featured Collection on storefront">
                                  ★ Featured
                                </span>
                              ) : (
                                <span className="admin-badge standard" title="Visible in Adenium plants card section">
                                  Catalog only
                                </span>
                              )}
                            </div>
                            <div className="admin-product-actions">
                              <button
                                className="admin-edit"
                                aria-label={`Edit ${p.name}`}
                                onClick={() => { setEditingProduct(p); setModal('product'); }}
                              >
                                Edit
                              </button>
                              <button
                                className="admin-delete"
                                aria-label={`Delete ${p.name}`}
                                onClick={() => setDeleting(p)}
                              >
                                <Icon name="trash" />
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>

                      {visibleProducts.length === 0 && (
                        <div className="admin-empty">
                          <Icon name="leaf" />
                          <h3>{query ? 'No matching products' : 'Room for something green'}</h3>
                          <p>{query ? 'Try a different product name.' : activeCategory ? `Add your first product to ${activeCategory.name}.` : 'Create a category to start adding products.'}</p>
                          {!activeCategory && <Link className="admin-button secondary" href="/admin/categories">Add a category <Icon name="arrow" /></Link>}
                        </div>
                      )}

                      <div className="admin-card-footer">
                        {visibleProducts.length} of {categoryProducts.length} products
                        <span>Products marked with ★ Featured appear in the storefront featured section.</span>
                      </div>
                    </section>
                  </div>
                </>
              )}

              {tab === 'orders' && (
                <>
                  <section className="admin-stats" aria-label="Order summary">
                    {[
                      { label: 'Total orders', value: data.orders.length },
                      { label: 'To fulfil', value: data.orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length },
                      { label: 'Delivered', value: data.orders.filter(o => o.status === 'Delivered').length },
                    ].map(s => (
                      <div className="admin-stat" key={s.label}>
                        <div>
                          <p>{s.label}</p>
                          <strong>{s.value}</strong>
                        </div>
                        <span><Icon name="box" /></span>
                      </div>
                    ))}
                  </section>

                  <section className="admin-card">
                    <div className="admin-card-header">
                      <div>
                        <h2>Your orders</h2>
                        <p>Track store and customer orders and update their progress.</p>
                      </div>
                      <div className="admin-order-tools">
                        <label className="admin-search">
                          <Icon name="search" />
                          <input aria-label="Search orders" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search orders…" />
                        </label>
                        <select aria-label="Filter order status" value={filter} onChange={e => setFilter(e.target.value)}>
                          <option>All orders</option>
                          {statuses.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    {visibleOrders.map(o => (
                      <article className="admin-order-row" key={o.id}>
                        <div>
                          <small>#{o.id.slice(0, 8).toUpperCase()} · {new Date(o.date).toLocaleDateString('en-IN')}</small>
                          <h3>{o.customer}</h3>
                          <p>{o.details}</p>
                        </div>
                        <strong>{money(o.total)}</strong>
                        <label>
                          <span className="sr-only">Status for {o.customer}</span>
                          <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}>
                            {statuses.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </label>
                      </article>
                    ))}

                    {!visibleOrders.length && (
                      <div className="admin-empty">
                        <span className="admin-empty-icon"><Icon name="box" /></span>
                        <h3>{data.orders.length ? 'No matching orders' : 'No orders yet'}</h3>
                        <p>{data.orders.length ? 'Try a different search or status.' : 'New orders placed through the website will appear here automatically.'}</p>
                      </div>
                    )}
                  </section>
                </>
              )}

              {tab === 'categories' && (
                <section className="admin-card">
                  <div className="admin-card-header">
                    <h2>Your categories <span>{data.categories.length}</span></h2>
                  </div>
                  <div className="admin-category-list">
                    {data.categories.map(c => {
                      const count = data.products.filter(p => p.categoryId === c.id).length;
                      const thumb = c.image || (c.id === 'agrocare' ? '/images/essentials.webp' : '/images/collection.webp');
                      return (
                        <article className="admin-category-row" key={c.id}>
                          <span
                            className="admin-category-thumb"
                            style={{
                              width: '46px',
                              height: '46px',
                              minWidth: '46px',
                              maxWidth: '46px',
                              aspectRatio: '1 / 1',
                              flex: '0 0 46px',
                              borderRadius: '50%',
                              overflow: 'hidden',
                              border: '2px solid #dce5d0',
                              background: '#f2f5ed',
                              flexShrink: 0,
                              display: 'grid',
                              placeItems: 'center',
                            }}
                          >
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={c.name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  aspectRatio: '1 / 1',
                                  objectFit: 'cover',
                                  display: 'block',
                                }}
                              />
                            ) : (
                              <Icon name={c.id === 'adenium' ? 'leaf' : 'tag'} />
                            )}
                          </span>
                          <div className="admin-category-info">
                            <h3>
                              {c.name}
                              {c.isVisible ? (
                                <span className="admin-badge green" style={{ marginLeft: '10px' }}>Visible</span>
                              ) : (
                                <span className="admin-badge neutral" style={{ marginLeft: '10px' }}>Hidden</span>
                              )}
                            </h3>
                            <p>{count} {count === 1 ? 'product' : 'products'}</p>
                          </div>
                          <div className="admin-category-actions">
                            <button
                              className="admin-button secondary"
                              onClick={() => {
                                setEditingCategory(c);
                                setCategoryImage(c.image || '');
                                setModal('category');
                              }}
                              aria-label={`Edit ${c.name}`}
                            >
                              Edit
                            </button>
                            <button
                              className="admin-delete"
                              disabled={count > 0}
                              title={count > 0 ? 'Remove products from this category first' : `Remove ${c.name}`}
                              aria-label={`Remove ${c.name}`}
                              onClick={() => removeCategory(c)}
                            >
                              <Icon name="trash" />
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {!data.categories.length && (
                    <div className="admin-empty">
                      <Icon name="tag" />
                      <h3>Create your first category</h3>
                      <p>Categories appear as tabs in your inventory and filters on your storefront.</p>
                      <button className="admin-button secondary" onClick={() => setModal('category')}>Add category</button>
                    </div>
                  )}
                </section>
              )}

              {tab === 'settings' && (
                <div className="admin-settings-grid">
                  <button className="admin-setting-tile" onClick={() => setModal('hero')}>
                    <span className="admin-setting-icon"><Icon name="file" /></span>
                    <span className="admin-tile-arrow"><Icon name="arrow" /></span>
                    <h2>Edit hero banner</h2>
                    <p>Customize the headline, description and featured hero image on your homepage.</p>
                  </button>
                  <button className="admin-setting-tile" onClick={() => setModal('settings')}>
                    <span className="admin-setting-icon sage"><Icon name="shield" /></span>
                    <span className="admin-tile-arrow"><Icon name="arrow" /></span>
                    <h2>Change Settings</h2>
                    <p>Manage admin panel password, minimum order limits, and delivery charges.</p>
                  </button>
                </div>
              )}
            </>
          )}
        </main>
        <footer className="admin-footer">Made for growing things.<span>Kiaan Nursery · Admin</span></footer>
      </div>

      {modal === 'product' && (
        <ProductEditor
          product={editingProduct}
          categories={data.categories}
          categoryId={activeCategory?.id || ''}
          onClose={close}
          onSave={saveProduct}
        />
      )}

      {modal === 'hero' && (
        <HeroEditor
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            setMessage('Hero banner updated.');
          }}
        />
      )}

      <dialog
        ref={dialog}
        className="admin-dialog"
        onCancel={e => { e.preventDefault(); close(); }}
        onClick={e => { if (e.target === e.currentTarget) close(); }}
      >
        <div className="admin-dialog-inner">
          <div className="admin-dialog-heading">
            <h2>
              {deleting
                ? 'Delete product?'
                : modal === 'order'
                ? 'Add manual order'
                : modal === 'category'
                ? editingCategory
                  ? 'Edit category'
                  : 'Add category'
                : 'Visibility'}
            </h2>
            <button className="admin-icon-button" aria-label="Close dialog" onClick={close}>
              <Icon name="close" />
            </button>
          </div>

          {deleting ? (
            <>
              <p>Remove <strong>{deleting.name}</strong> from the database? This action cannot be undone.</p>
              <div className="admin-form-actions">
                <button className="admin-button secondary" onClick={close}>Keep product</button>
                <button className="admin-button danger" onClick={() => deleteCurrentProduct(deleting)}>Delete product</button>
              </div>
            </>
          ) : (
            <form onSubmit={submit} key={modal + (editingCategory ? editingCategory.id : 'new')}>
              {modal === 'category' && (
                <>
                  <label>
                    Category name
                    <input
                      name="categoryName"
                      defaultValue={editingCategory?.name || ''}
                      required
                      maxLength={50}
                      placeholder="e.g. Pots & planters"
                    />
                  </label>

                  <div style={{ marginTop: '18px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px', color: '#33482f' }}>
                      Category thumbnail image
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: '#f2f5ed',
                        border: '3px solid #cbd7c0',
                        flexShrink: 0,
                        display: 'grid',
                        placeItems: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                      }}>
                        {categoryImage ? (
                          <img src={categoryImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Icon name="leaf" />
                        )}
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <label className="admin-button secondary" style={{ cursor: 'pointer', margin: 0, padding: '8px 14px' }}>
                            <Icon name="plus" />
                            <span>{categoryImageUploading ? 'Uploading…' : 'Upload photo'}</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              style={{ display: 'none' }}
                              disabled={categoryImageUploading}
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleCategoryImageUpload(file);
                              }}
                            />
                          </label>
                          {categoryImage && (
                            <button
                              type="button"
                              className="admin-button secondary"
                              onClick={() => setCategoryImage('')}
                              style={{ padding: '8px 12px' }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          type="url"
                          placeholder="Or paste image URL (/images/... or https://...)"
                          value={categoryImage}
                          onChange={e => setCategoryImage(e.target.value)}
                          style={{ fontSize: '12px', padding: '8px 10px' }}
                        />
                      </div>
                    </div>
                  </div>

                  <label className="admin-toggle-row" style={{ marginTop: '18px' }}>
                    <span>
                      <strong>Visible on Storefront</strong>
                      <small>When enabled, this category appears in storefront menus, filters, and collection tabs.</small>
                    </span>
                    <input
                      type="checkbox"
                      name="isVisible"
                      defaultChecked={editingCategory ? editingCategory.isVisible : true}
                      role="switch"
                    />
                    <span className="admin-toggle-track" aria-hidden="true" />
                  </label>
                </>
              )}

              {modal === 'order' && (
                <>
                  <p>Use this for a phone or WhatsApp enquiry. No payment is collected here.</p>
                  <label>Customer name<input name="customer" required maxLength={100} /></label>
                  <label>Products & delivery notes<textarea name="details" rows={4} required maxLength={1500} placeholder="Products, quantities, contact and delivery details" /></label>
                  <label>Order total (₹)<input name="total" type="number" min="0.01" max="10000000" step="0.01" required /></label>
                </>
              )}

              {modal === 'visibility' && (
                <>
                  <p>Choose the homepage sections to display on your storefront.</p>
                  {[
                    { key: 'hero', label: 'Hero banner', text: 'Your homepage welcome banner' },
                    { key: 'featured', label: 'Featured plants', text: 'A selection of your Adenium plants' },
                    { key: 'reviews', label: 'Customer reviews', text: 'Ratings and customer stories' },
                    { key: 'newsletter', label: 'Newsletter', text: 'The new arrivals signup section' },
                  ].map(s => (
                    <label className="admin-toggle-row" key={s.key}>
                      <span>
                        <strong>{s.label}</strong>
                        <small>{s.text}</small>
                      </span>
                      <input
                        type="checkbox"
                        name={s.key}
                        defaultChecked={data.settings[s.key as keyof Settings] as boolean}
                        role="switch"
                      />
                      <span className="admin-toggle-track" aria-hidden="true" />
                    </label>
                  ))}
                </>
              )}

              {error && <p className="admin-error" role="alert">{error}</p>}

              <div className="admin-form-actions">
                <button className="admin-button secondary" type="button" onClick={close}>Cancel</button>
                <button className="admin-button primary" type="submit">
                  {modal === 'order'
                    ? 'Save order'
                    : modal === 'category'
                    ? editingCategory
                      ? 'Save changes'
                      : 'Add category'
                    : 'Save settings'}
                </button>
              </div>
            </form>
          )}
        </div>
      </dialog>

      <div className={`admin-toast ${message ? 'show' : ''}`} role="status">
        {message && <><Icon name="check" />{message}</>}
      </div>
    </div>
  );
}
