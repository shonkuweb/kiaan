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
type Order = {
  id: string;
  customer: string;
  details: string;
  total: number;
  status: string;
  razorpayOrderId?: string;
  paymentId?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  date: string;
};
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

const statuses = ['Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];
const tabs: { id: Tab; label: string; href: string; icon: IconName }[] = [
  { id: 'inventory', label: 'Inventory', href: '/admin', icon: 'box' },
  { id: 'orders', label: 'Orders', href: '/admin/orders', icon: 'file' },
  { id: 'categories', label: 'Categories', href: '/admin/categories', icon: 'tag' },
  { id: 'settings', label: 'Settings', href: '/admin/settings', icon: 'grid' },
];

function parseCustomer(raw: string) {
  const parts = (raw || '').split('|').map(s => s.trim());
  const name = parts[0] || 'Customer';
  let phone = '';
  let email = '';

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part.toLowerCase().includes('ph:') || /^\+?\d{10,12}$/.test(part.replace(/[\s-]/g, ''))) {
      phone = part.replace(/^ph:\s*/i, '').trim();
    } else if (part.includes('@')) {
      email = part.trim();
    }
  }

  if (!phone) {
    const phoneMatch = raw.match(/(?:\+91[\s-]?)?[6-9]\d{9}/);
    if (phoneMatch) phone = phoneMatch[0];
  }
  if (!email) {
    const emailMatch = raw.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) email = emailMatch[0];
  }

  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  return { name, phone: cleanPhone, rawPhone: phone, email };
}

function parseOrderDetails(detailsStr: string) {
  const lines = (detailsStr || '').split('\n').map(l => l.trim()).filter(Boolean);
  let itemsText = '';
  let addressText = '';
  let shippingText = '';
  let notesText = '';
  let paymentText = '';
  let razorpayOrderId = '';

  if (lines.length === 1 && detailsStr.includes(' | ')) {
    const pipeParts = detailsStr.split(' | ').map(p => p.trim());
    for (const part of pipeParts) {
      if (part.toLowerCase().startsWith('delivery:')) {
        addressText = part.replace(/^delivery:\s*/i, '');
      } else if (part.toLowerCase().startsWith('notes:')) {
        notesText = part.replace(/^notes:\s*/i, '');
      } else if (part.toLowerCase().startsWith('payment:')) {
        paymentText = part.replace(/^payment:\s*/i, '');
      } else if (part.toLowerCase().includes('shipping:')) {
        shippingText = part;
      } else if (!itemsText) {
        itemsText = part;
      }
    }
  } else {
    for (const line of lines) {
      if (line.toLowerCase().startsWith('items:')) {
        itemsText = line.replace(/^items:\s*/i, '');
      } else if (line.toLowerCase().startsWith('delivery address:') || line.toLowerCase().startsWith('delivery:')) {
        addressText = line.replace(/^(?:delivery address|delivery):\s*/i, '');
      } else if (line.toLowerCase().startsWith('shipping:')) {
        shippingText = line.replace(/^shipping:\s*/i, '');
      } else if (line.toLowerCase().startsWith('notes:')) {
        notesText = line.replace(/^notes:\s*/i, '');
      } else if (line.toLowerCase().startsWith('razorpay order id:')) {
        razorpayOrderId = line.replace(/^razorpay order id:\s*/i, '');
      } else if (line.toLowerCase().startsWith('payment:')) {
        paymentText = line.replace(/^payment:\s*/i, '');
      } else if (!itemsText && !addressText) {
        itemsText = line;
      }
    }
  }

  const rawItems = itemsText ? itemsText.split(/[;,]\s*(?=[A-Za-z0-9])/).map(s => s.trim()).filter(Boolean) : [];

  return {
    rawItems: rawItems.length > 0 ? rawItems : (itemsText ? [itemsText] : []),
    address: addressText,
    shipping: shippingText,
    notes: notesText,
    paymentText,
    razorpayOrderId,
  };
}

export const ORDER_STAGES = [
  'Order Confirmed',
  'Plant Selection',
  'Botanical Packaging',
  'Dispatched',
  'Delivered',
] as const;

export type OrderStage = typeof ORDER_STAGES[number];

function getStageIndex(status: string): number {
  const s = (status || '').toLowerCase();
  if (s.includes('deliver')) return 4;
  if (s.includes('dispatch') || s.includes('transit') || s.includes('shipped')) return 3;
  if (s.includes('pack')) return 2;
  if (s.includes('select') || s.includes('plant') || s.includes('process') || s.includes('prep')) return 1;
  return 0; // Order Confirmed
}

function getStageTheme(stageIndex: number) {
  switch (stageIndex) {
    case 0:
      return {
        name: 'Order Confirmed',
        cardBg: '#f8fafc',
        cardBorder: '#cbd5e1',
        accent: '#2563eb',
        accentBg: '#eff6ff',
        accentText: '#1e40af',
        trackFill: '#3b82f6',
        badgeBorder: '#bfdbfe',
      };
    case 1:
      return {
        name: 'Plant Selection',
        cardBg: '#fffdf5',
        cardBorder: '#fde68a',
        accent: '#d97706',
        accentBg: '#fef3c7',
        accentText: '#92400e',
        trackFill: '#f59e0b',
        badgeBorder: '#fcd34d',
      };
    case 2:
      return {
        name: 'Botanical Packaging',
        cardBg: '#faf5ff',
        cardBorder: '#e9d5ff',
        accent: '#9333ea',
        accentBg: '#f3e8ff',
        accentText: '#6b21a8',
        trackFill: '#a855f7',
        badgeBorder: '#d8b4fe',
      };
    case 3:
      return {
        name: 'Dispatched',
        cardBg: '#f0fdfa',
        cardBorder: '#99f6e4',
        accent: '#0d9488',
        accentBg: '#ccfbf1',
        accentText: '#115e59',
        trackFill: '#14b8a6',
        badgeBorder: '#5eead4',
      };
    case 4:
      return {
        name: 'Delivered',
        cardBg: '#f0fdf4',
        cardBorder: '#86efac',
        accent: '#16a34a',
        accentBg: '#dcfce7',
        accentText: '#15803d',
        trackFill: '#22c55e',
        badgeBorder: '#86efac',
      };
    default:
      return {
        name: 'Order Confirmed',
        cardBg: '#f8fafc',
        cardBorder: '#cbd5e1',
        accent: '#2563eb',
        accentBg: '#eff6ff',
        accentText: '#1e40af',
        trackFill: '#3b82f6',
        badgeBorder: '#bfdbfe',
      };
  }
}

function getStatusTheme(status: string) {
  return getStageTheme(getStageIndex(status));
}

export function AdminPanel({ tab }: { tab: Tab }) {
  const [data, setData] = useState<Data>(initial);
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [query, setQuery] = useState('');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
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
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          sessionStorage.removeItem('kiaan_admin_auth');
          setIsAuthenticated(false);
        }
        throw new Error(data.error || 'Upload failed');
      }
      setCategoryImage(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image.');
    } finally {
      setCategoryImageUploading(false);
    }
  }

  useEffect(() => {
    fetch('/api/admin/auth')
      .then(res => (res.ok ? res.json() : { authenticated: false }))
      .then(authData => {
        if (authData.authenticated) {
          sessionStorage.setItem('kiaan_admin_auth', 'true');
          setIsAuthenticated(true);
          loadData();
        } else {
          sessionStorage.removeItem('kiaan_admin_auth');
          setIsAuthenticated(false);
          setReady(true);
        }
      })
      .catch(() => {
        const localAuth = typeof window !== 'undefined' ? sessionStorage.getItem('kiaan_admin_auth') : null;
        if (localAuth === 'true') {
          setIsAuthenticated(true);
          loadData();
        } else {
          setIsAuthenticated(false);
          setReady(true);
        }
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

  async function saveProduct(item: Item): Promise<{ ok: boolean; error?: string }> {
    try {
      const isEdit = Boolean(editingProduct);
      const res = await fetch('/api/admin/products', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });

      const result = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          sessionStorage.removeItem('kiaan_admin_auth');
          setIsAuthenticated(false);
        }
        const errorMsg = result.error || 'Failed to save product.';
        setError(errorMsg);
        return { ok: false, error: errorMsg };
      }

      setData(prev => ({
        ...prev,
        products: isEdit ? prev.products.map(p => (p.id === result.id ? result : p)) : [result, ...prev.products],
      }));
      setCategoryId(result.categoryId);
      setMessage(isEdit ? 'Product updated.' : 'Product added.');
      close();
      return { ok: true };
    } catch {
      const errorMsg = 'Failed to reach backend database.';
      setError(errorMsg);
      return { ok: false, error: errorMsg };
    }
  }

  async function deleteCurrentProduct(productToDelete: Item) {
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(productToDelete.id)}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          sessionStorage.removeItem('kiaan_admin_auth');
          setIsAuthenticated(false);
        }
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
        if (res.status === 401 || res.status === 403) {
          sessionStorage.removeItem('kiaan_admin_auth');
          setIsAuthenticated(false);
        }
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
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            sessionStorage.removeItem('kiaan_admin_auth');
            setIsAuthenticated(false);
          }
          return setError(result.error || 'Failed to save category.');
        }

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
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            sessionStorage.removeItem('kiaan_admin_auth');
            setIsAuthenticated(false);
          }
          return setError(result.error || 'Failed to save settings.');
        }

        setData(prev => ({ ...prev, settings: result }));
        setMessage('Store settings updated successfully.');
        close();
      } catch {
        setError('Failed to save settings.');
      }
    } else if (modal === 'order') {
      const customer = value('customer');
      const details = value('details');
      const total = Number(value('total'));

      if (!customer) return setError('Customer name & phone are required.');
      if (!details) return setError('Ordered items & address are required.');
      if (!Number.isFinite(total) || total <= 0) return setError('Enter a valid order total amount.');

      try {
        const res = await fetch('/api/admin/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer,
            details,
            total,
            status: 'Confirmed',
          }),
        });
        const result = await res.json();
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            sessionStorage.removeItem('kiaan_admin_auth');
            setIsAuthenticated(false);
          }
          return setError(result.error || 'Failed to create manual order.');
        }

        setData(prev => ({
          ...prev,
          orders: [result, ...prev.orders],
        }));
        setMessage('Manual confirmed order recorded.');
        close();
      } catch {
        setError('Could not reach backend.');
      }
    }
  }

  async function updateOrderStatus(id: string, nextStatus: string) {
    // Optimistically update order status in state
    setData(prev => ({
      ...prev,
      orders: prev.orders.map(o => (o.id === id ? { ...o, status: nextStatus } : o)),
    }));
    setSelectedOrderDetails(prev => (prev && prev.id === id ? { ...prev, status: nextStatus } : prev));

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const result = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          sessionStorage.removeItem('kiaan_admin_auth');
          setIsAuthenticated(false);
        }
        return setError(result.error || 'Failed to update order status.');
      }
      setMessage(`Status updated to "${nextStatus}".`);
    } catch {
      setError('Could not update status.');
    }
  }

  async function deleteCompletedOrder(id: string) {
    const shortId = id.slice(0, 8).toUpperCase();
    if (!window.confirm(`Are you sure you want to delete completed order #KIAAN-${shortId}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/orders?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          sessionStorage.removeItem('kiaan_admin_auth');
          setIsAuthenticated(false);
        }
        return setError(result.error || 'Failed to delete order.');
      }
      setData(prev => ({
        ...prev,
        orders: prev.orders.filter(o => o.id !== id),
      }));
      if (selectedOrderDetails?.id === id) {
        setSelectedOrderDetails(null);
      }
      setMessage(`Completed order #KIAAN-${shortId} deleted.`);
    } catch {
      setError('Could not delete order.');
    }
  }

  function copyOrderId(id: string) {
    const shortId = id.slice(0, 8).toUpperCase();
    navigator.clipboard.writeText(`#KIAAN-${shortId}`);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2000);
  }

  const activeCategory = data.categories.find(c => c.id === categoryId) || data.categories[0];
  const categoryProducts = data.products.filter(p => p.categoryId === activeCategory?.id);
  const visibleProducts = categoryProducts.filter(p => p.name.toLowerCase().includes(query.toLowerCase().trim()));

  function selectCategory(id: string) {
    setCategoryId(id);
    setQuery('');
  }

  // Filter confirmed orders
  const confirmedOrdersList = data.orders.filter(
    o => o.status !== 'Pending Payment' && o.status !== 'Pending' && o.paymentStatus !== 'pending'
  );

  const visibleOrders = confirmedOrdersList.filter(o => {
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      const match = `${o.customer} ${o.id} ${o.details} ${o.paymentId || ''} ${o.razorpayOrderId || ''}`.toLowerCase();
      if (!match.includes(q)) return false;
    }
    return true;
  });
  const current = tabs.find(t => t.id === tab)!;

  if (isAuthenticated === null) {
    return (
      <div className="admin-login-screen">
        <div className="admin-login-loading">
          <img
            src="/images/kiaan-logo-dark.png"
            alt="Kiaan Nursery"
            width="170"
            height="55"
            style={{ objectFit: 'contain' }}
          />
          <div className="admin-login-spinner" />
          <p>Verifying admin session…</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="admin-login-screen">
        <div className="admin-login-card">
          <div className="admin-login-badge">
            <span className="admin-login-badge-dot" />
            <span>SECURE WORKSPACE</span>
          </div>

          <div className="admin-login-logo">
            <img
              src="/images/kiaan-logo-dark.png"
              alt="Kiaan Nursery"
              width="175"
              height="56"
              style={{ objectFit: 'contain' }}
            />
          </div>

          <div className="admin-login-header">
            <h1>Admin Sign In</h1>
            <p>Enter your administrator password to access orders, inventory, and store settings.</p>
          </div>

          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="admin-login-field">
              <label htmlFor="admin-pwd">Administrator Password</label>
              <div className="admin-password-input-wrap">
                <div className="admin-password-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  id="admin-pwd"
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="Enter administrator password"
                  value={loginPassword}
                  onChange={e => {
                    setLoginPassword(e.target.value);
                    setLoginError('');
                  }}
                  className="admin-password-input"
                />
                <button
                  type="button"
                  className="admin-password-toggle-btn"
                  onClick={() => setShowLoginPassword(prev => !prev)}
                  title={showLoginPassword ? 'Hide password' : 'Show password'}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="admin-login-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn || !loginPassword.trim()}
              className="admin-login-submit-btn"
            >
              {isLoggingIn ? (
                <>
                  <span className="admin-btn-spinner" />
                  <span>Authenticating…</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  <span>Sign In to Workspace</span>
                </>
              )}
            </button>
          </form>

          <div className="admin-login-footer">
            <Link href="/" className="admin-back-store-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Return to Storefront</span>
            </Link>
          </div>

          <div className="admin-login-bottom-hint">
            <span>Kiaan Nursery & Agro Care Management System</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          <img
            src="/images/kiaan-logo-dark.png"
            alt="Kiaan Nursery & Agrocare"
            style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
          />
          <span className="admin-brand-badge">ADMIN</span>
        </Link>
        <p className="admin-nav-label">WORKSPACE</p>
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
          <Link href="/" target="_blank" rel="noreferrer" className="admin-view-store">
            <Icon name="arrow" />
            <span>View storefront</span>
          </Link>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <Link href="/admin" className="admin-topbar-mobile-brand" title="Kiaan Nursery Admin">
              <img
                src="/images/kiaan-logo-dark.png"
                alt="Kiaan Nursery"
                width="84"
                height="28"
                style={{ objectFit: 'contain' }}
              />
              <span className="admin-brand-badge">ADMIN</span>
            </Link>
            <div className="admin-topbar-breadcrumb">
              <span className="admin-breadcrumb-home">Admin</span>
              <span className="admin-divider">/</span>
              <strong>{current.label}</strong>
            </div>
          </div>
          <div className="admin-account">
            <Link href="/" target="_blank" rel="noreferrer" className="admin-topbar-store-link" title="Open Storefront in new tab">
              <Icon name="leaf" />
              <span className="admin-store-link-label">Storefront</span>
            </Link>
            <div className="admin-user-chip">
              <span className="admin-avatar">K</span>
              <span className="admin-user-title">Admin</span>
            </div>
            <button
              type="button"
              className="admin-logout-btn"
              onClick={handleLogout}
              title="Sign out of Admin Panel"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign out</span>
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
                              <small>Offer / Price</small>
                              <strong>{money(p.price)}</strong>
                              {p.originalPrice && p.originalPrice > p.price && (
                                <span style={{ display: 'block', fontSize: '11px', textDecoration: 'line-through', color: '#94a3b8' }}>
                                  {money(p.originalPrice)}
                                </span>
                              )}
                              {p.deliveryCharge !== undefined && p.deliveryCharge !== null && (
                                <span style={{ display: 'block', fontSize: '11px', color: '#0d9488', fontWeight: 600 }}>
                                  Delivery: {money(p.deliveryCharge)}
                                </span>
                              )}
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
                <section className="admin-orders-container">
                  {/* Clean Simple Toolbar */}
                  <div className="admin-orders-simple-toolbar">
                    <div className="admin-orders-simple-title">
                      <h2>
                        Customer Orders
                        <span className="admin-orders-simple-badge">{visibleOrders.length}</span>
                      </h2>
                    </div>

                    <div className="admin-orders-simple-search">
                      <label className="admin-search-simple">
                        <Icon name="search" />
                        <input
                          aria-label="Search orders"
                          value={query}
                          onChange={e => setQuery(e.target.value)}
                          placeholder="Search customer name, phone, or order ID…"
                        />
                        {query && (
                          <button
                            type="button"
                            className="admin-search-clear"
                            onClick={() => setQuery('')}
                            aria-label="Clear search"
                          >
                            <Icon name="close" />
                          </button>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Responsive Grid of Order Cards */}
                  <div className="admin-order-cards-grid">
                    {visibleOrders.map(o => {
                      const shortId = o.id.slice(0, 8).toUpperCase();
                      const cust = parseCustomer(o.customer);
                      const det = parseOrderDetails(o.details);
                      const stageIndex = getStageIndex(o.status);
                      const stageTheme = getStageTheme(stageIndex);
                      const formattedDate = new Date(o.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      });

                      return (
                        <article
                          key={o.id}
                          className="admin-order-simple-card"
                          style={{
                            backgroundColor: stageTheme.cardBg,
                            borderColor: stageTheme.cardBorder,
                          }}
                          onClick={() => setSelectedOrderDetails(o)}
                          title="Click card to view complete user and order details"
                        >
                          {/* Top Row: Order ID, Date, Total & Delete for Completed */}
                          <div className="admin-order-card-top-row">
                            <div className="admin-order-ref-group">
                              <span className="admin-order-ref-tag">#KIAAN-{shortId}</span>
                              <span className="admin-order-date-tag">{formattedDate}</span>
                            </div>
                            <div className="admin-order-top-right-group">
                              <div className="admin-order-amount-tag">
                                {money(o.total)}
                              </div>
                              {stageIndex === 4 && (
                                <button
                                  type="button"
                                  className="admin-order-card-delete-btn"
                                  onClick={e => {
                                    e.stopPropagation();
                                    deleteCompletedOrder(o.id);
                                  }}
                                  title="Delete completed order"
                                  aria-label="Delete completed order"
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Customer Details */}
                          <div className="admin-order-customer-box">
                            <span
                              className="admin-order-avatar-circle"
                              style={{
                                background: stageTheme.accentBg,
                                color: stageTheme.accentText,
                                borderColor: stageTheme.badgeBorder,
                              }}
                            >
                              {cust.name.slice(0, 2).toUpperCase()}
                            </span>
                            <div className="admin-order-cust-info">
                              <strong className="admin-order-cust-name">{cust.name}</strong>
                              <span className="admin-order-cust-phone">
                                <Icon name="phone" /> +91 {cust.phone || cust.rawPhone || 'N/A'}
                              </span>
                            </div>
                          </div>

                          {/* Order Details: Ordered Items */}
                          <div className="admin-order-items-box">
                            <span className="admin-order-section-title">Order Items:</span>
                            <div className="admin-order-items-preview-list">
                              {det.rawItems.map((itemStr, idx) => (
                                <div key={idx} className="admin-order-item-chip">
                                  <span className="item-leaf">🌱</span>
                                  <span className="item-text">{itemStr}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 5-Stage Sliding Bar */}
                          <div
                            className="admin-order-slider-wrapper"
                            onClick={e => e.stopPropagation()}
                          >
                            <div className="admin-order-slider-meta">
                              <span className="admin-order-slider-title">Order Status</span>
                              <span
                                className="admin-order-stage-badge"
                                style={{
                                  background: stageTheme.accentBg,
                                  color: stageTheme.accentText,
                                  borderColor: stageTheme.badgeBorder,
                                }}
                              >
                                <span className="stage-status-dot" style={{ background: stageTheme.accent }} />
                                {ORDER_STAGES[stageIndex]}
                              </span>
                            </div>

                            {/* Slider interactive track & range */}
                            <div className="admin-stage-slider-track-container">
                              <div className="admin-stage-slider-bar-bg">
                                <div
                                  className="admin-stage-slider-bar-fill"
                                  style={{
                                    width: `${stageIndex * 25}%`,
                                    background: stageTheme.trackFill,
                                  }}
                                />
                              </div>

                              {/* 5 Stage Step Nodes */}
                              <div className="admin-stage-nodes-row">
                                {ORDER_STAGES.map((stgName, idx) => {
                                  const isPassed = idx <= stageIndex;
                                  const isCurrent = idx === stageIndex;
                                  return (
                                    <button
                                      key={stgName}
                                      type="button"
                                      className={`admin-stage-node-circle ${isPassed ? 'passed' : ''} ${isCurrent ? 'current' : ''}`}
                                      onClick={e => {
                                        e.stopPropagation();
                                        updateOrderStatus(o.id, ORDER_STAGES[idx]);
                                      }}
                                      title={`Set status to ${stgName}`}
                                      style={{
                                        borderColor: isPassed ? stageTheme.accent : '#cbd5e1',
                                        backgroundColor: isCurrent ? stageTheme.accent : isPassed ? stageTheme.accentBg : '#ffffff',
                                        color: isCurrent ? '#ffffff' : stageTheme.accentText,
                                      }}
                                    >
                                      {isPassed ? '✓' : idx + 1}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Native range slider */}
                              <input
                                type="range"
                                min={0}
                                max={4}
                                step={1}
                                value={stageIndex}
                                onChange={e => {
                                  e.stopPropagation();
                                  updateOrderStatus(o.id, ORDER_STAGES[Number(e.target.value)]);
                                }}
                                className="admin-stage-range-slider"
                                aria-label={`Update status for order ${shortId}`}
                                style={{ accentColor: stageTheme.accent }}
                              />
                            </div>

                            {/* 5 Stage Step Labels */}
                            <div className="admin-stage-labels-row">
                              {['Confirmed', 'Selection', 'Packaging', 'Dispatched', 'Delivered'].map((stepLabel, idx) => {
                                const isCurrent = idx === stageIndex;
                                return (
                                  <button
                                    key={stepLabel}
                                    type="button"
                                    className={`admin-stage-label-item ${isCurrent ? 'active' : ''}`}
                                    onClick={e => {
                                      e.stopPropagation();
                                      updateOrderStatus(o.id, ORDER_STAGES[idx]);
                                    }}
                                    style={{
                                      color: isCurrent ? stageTheme.accentText : '#64748b',
                                      fontWeight: isCurrent ? 700 : 500,
                                    }}
                                  >
                                    {stepLabel}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {!visibleOrders.length && (
                    <div className="admin-empty">
                      <span className="admin-empty-icon"><Icon name="box" /></span>
                      <h3>{confirmedOrdersList.length ? 'No orders match your search' : 'No confirmed orders yet'}</h3>
                      <p>
                        {confirmedOrdersList.length
                          ? 'Try searching by a different name, phone, or order ID.'
                          : 'When customers place orders, they will appear here with customer and order details and the 5-stage status slider.'}
                      </p>
                    </div>
                  )}
                </section>
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
                    <p>Customize the headline, description and up to 3 rotating hero images (2s auto-cycle).</p>
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
        className={`admin-dialog ${modal === 'settings' ? 'settings-editor' : ''}`}
        onCancel={e => { e.preventDefault(); close(); }}
        onClick={e => { if (e.target === e.currentTarget) close(); }}
      >
        <div className="admin-dialog-inner">
          <div className="admin-dialog-heading">
            <h2>
              {deleting
                ? 'Delete product?'
                : modal === 'settings'
                ? 'Change Settings'
                : modal === 'order'
                ? 'Record Confirmed Order'
                : modal === 'category'
                ? editingCategory
                  ? 'Edit category'
                  : 'Add category'
                : 'Settings'}
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
              {modal === 'order' && (
                <>
                  <p>Record a confirmed phone, WhatsApp, or nursery walk-in order. It will be added as Confirmed immediately.</p>
                  <label>
                    Customer Name &amp; Phone Number *
                    <input
                      name="customer"
                      required
                      maxLength={100}
                      placeholder="e.g. Ranita Dev | Ph: 9876543210"
                    />
                  </label>
                  <label>
                    Items &amp; Delivery Address *
                    <textarea
                      name="details"
                      rows={4}
                      required
                      maxLength={1500}
                      placeholder="Items: Double Dark Red Adenium (Qty: 2, ₹599 each)&#10;Delivery Address: Flat 3B, Ghosh Para, Howrah - 711227"
                    />
                  </label>
                  <label>
                    Order Total (₹) *
                    <input
                      name="total"
                      type="number"
                      min="1"
                      max="10000000"
                      step="1"
                      required
                      placeholder="e.g. 1198"
                    />
                  </label>
                </>
              )}

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

              {modal === 'settings' && (
                <div className="admin-settings-form-body">
                  <div className="admin-settings-group">
                    <div className="admin-settings-group-header">
                      <Icon name="shield" />
                      <h3>Admin Panel Password</h3>
                    </div>
                    <p className="admin-settings-group-desc">
                      Change the password required to access this admin panel. Leave blank if you don&apos;t want to change it.
                    </p>
                    <div className="admin-settings-fields-grid">
                      <label style={{ gridColumn: 'span 2' }}>
                        <span>Current Admin Password</span>
                        <input
                          type="password"
                          name="currentPassword"
                          placeholder="Required only when setting a new password"
                          autoComplete="current-password"
                        />
                      </label>
                      <label>
                        <span>New Password</span>
                        <input
                          type="password"
                          name="newPassword"
                          placeholder="At least 4 characters"
                          autoComplete="new-password"
                        />
                      </label>
                      <label>
                        <span>Confirm New Password</span>
                        <input
                          type="password"
                          name="confirmPassword"
                          placeholder="Repeat new password"
                          autoComplete="new-password"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="admin-settings-group">
                    <div className="admin-settings-group-header">
                      <Icon name="tag" />
                      <h3>Order Limits & Minimums</h3>
                    </div>
                    <p className="admin-settings-group-desc">
                      Enforce minimum cart values or quantities for customer checkout across the storefront.
                    </p>
                    <div className="admin-settings-fields-grid">
                      <label>
                        <span>Minimum Order Value (₹)</span>
                        <input
                          type="number"
                          name="minOrderValue"
                          min="0"
                          step="1"
                          defaultValue={data.settings.minOrderValue ?? 0}
                          required
                        />
                        <small>Customers cannot checkout below this subtotal (set 0 for no minimum).</small>
                      </label>
                      <label>
                        <span>Minimum Order Quantity (items)</span>
                        <input
                          type="number"
                          name="minOrderQuantity"
                          min="1"
                          step="1"
                          defaultValue={data.settings.minOrderQuantity ?? 1}
                          required
                        />
                        <small>Total count of plants or items required per order.</small>
                      </label>
                    </div>
                  </div>

                  <div className="admin-settings-group">
                    <div className="admin-settings-group-header">
                      <Icon name="box" />
                      <h3>Delivery Charges</h3>
                    </div>
                    <p className="admin-settings-group-desc">
                      Manage standard shipping fee and free delivery threshold applied in the cart and checkout.
                    </p>
                    <div className="admin-settings-fields-grid">
                      <label>
                        <span>Standard Delivery Charge (₹)</span>
                        <input
                          type="number"
                          name="deliveryCharge"
                          min="0"
                          step="1"
                          defaultValue={data.settings.deliveryCharge ?? 69}
                          required
                        />
                        <small>Standard courier fee added to checkout orders.</small>
                      </label>
                      <label>
                        <span>Free Delivery Threshold (₹)</span>
                        <input
                          type="number"
                          name="freeDeliveryThreshold"
                          min="0"
                          step="1"
                          defaultValue={data.settings.freeDeliveryThreshold ?? 999}
                          required
                        />
                        <small>Orders at or above this value qualify for free delivery (set 0 to disable).</small>
                      </label>
                    </div>
                  </div>

                  <div className="admin-settings-group">
                    <div className="admin-settings-group-header">
                      <Icon name="grid" />
                      <h3>Homepage Sections Visibility</h3>
                    </div>
                    <p className="admin-settings-group-desc">
                      Choose which homepage sections to show or hide on your live website.
                    </p>
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
                          defaultChecked={Boolean(data.settings[s.key as keyof Settings])}
                          role="switch"
                        />
                        <span className="admin-toggle-track" aria-hidden="true" />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="admin-error" role="alert">{error}</p>}

              <div className="admin-form-actions">
                <button className="admin-button secondary" type="button" onClick={close}>Cancel</button>
                <button className="admin-button primary" type="submit">
                  {modal === 'category'
                    ? editingCategory
                      ? 'Save changes'
                      : 'Add category'
                    : modal === 'order'
                    ? 'Save Confirmed Order'
                    : 'Save settings'}
                </button>
              </div>
            </form>
          )}
        </div>
      </dialog>

      {/* Individual Order Details Modal */}
      {selectedOrderDetails && (() => {
        const modalShortId = selectedOrderDetails.id.slice(0, 8).toUpperCase();
        const modalCust = parseCustomer(selectedOrderDetails.customer);
        const modalDet = parseOrderDetails(selectedOrderDetails.details);
        const modalStageIndex = getStageIndex(selectedOrderDetails.status);
        const modalStageTheme = getStageTheme(modalStageIndex);
        const modalDate = new Date(selectedOrderDetails.date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <dialog
            className="admin-dialog admin-order-modal-dialog"
            open
            onClick={e => {
              if (e.target === e.currentTarget) setSelectedOrderDetails(null);
            }}
          >
            <div className="admin-dialog-inner admin-order-modal-inner">
              <div className="admin-order-modal-header">
                <div>
                  <span className="admin-order-modal-kicker">ORDER DETAILS</span>
                  <h2>#KIAAN-{modalShortId}</h2>
                  <span className="admin-order-modal-date">Placed on {modalDate}</span>
                </div>
                <button
                  type="button"
                  className="admin-order-modal-close-btn"
                  onClick={() => setSelectedOrderDetails(null)}
                  aria-label="Close details"
                >
                  <Icon name="close" />
                </button>
              </div>

              <div className="admin-order-modal-body-grid">
                {/* Customer Details */}
                <div className="admin-order-modal-card">
                  <div className="admin-order-modal-card-title">
                    <Icon name="phone" />
                    <h3>Customer Details</h3>
                  </div>
                  <div className="admin-modal-field-item">
                    <span className="modal-field-label">Name</span>
                    <strong className="modal-field-value">{modalCust.name}</strong>
                  </div>
                  <div className="admin-modal-field-item">
                    <span className="modal-field-label">Phone</span>
                    <div className="modal-field-value">
                      {modalCust.phone ? (
                        <a href={`tel:+91${modalCust.phone}`} className="admin-modal-phone-link">
                          +91 {modalCust.phone}
                        </a>
                      ) : (
                        <span className="text-muted">Not recorded</span>
                      )}
                    </div>
                  </div>
                  {modalCust.email && (
                    <div className="admin-modal-field-item">
                      <span className="modal-field-label">Email</span>
                      <a href={`mailto:${modalCust.email}`} className="admin-modal-email-link">
                        {modalCust.email}
                      </a>
                    </div>
                  )}
                  <div className="admin-modal-field-item">
                    <span className="modal-field-label">Delivery Address</span>
                    <p className="modal-field-value address">{modalDet.address || 'Address on record'}</p>
                  </div>
                  {modalDet.notes && (
                    <div className="admin-modal-field-item">
                      <span className="modal-field-label">Customer Instructions</span>
                      <p className="modal-field-value notes">&ldquo;{modalDet.notes}&rdquo;</p>
                    </div>
                  )}
                </div>

                {/* Order Details */}
                <div className="admin-order-modal-card">
                  <div className="admin-order-modal-card-title">
                    <Icon name="tag" />
                    <h3>Order Details</h3>
                  </div>
                  <div className="admin-modal-field-item">
                    <span className="modal-field-label">Total Amount</span>
                    <strong className="modal-field-value total">{money(selectedOrderDetails.total)}</strong>
                  </div>
                  <div className="admin-modal-field-item">
                    <span className="modal-field-label">Payment Status</span>
                    <span className="admin-modal-paid-badge">✓ Paid Online (Razorpay)</span>
                  </div>
                  <div className="admin-modal-field-item">
                    <span className="modal-field-label">Items Ordered</span>
                    <div className="admin-modal-items-list">
                      {modalDet.rawItems.map((itemStr, idx) => (
                        <div key={idx} className="admin-modal-item-row">
                          <span className="item-bullet">🌱</span>
                          <span className="item-name">{itemStr}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Slider in Modal */}
              <div
                className="admin-order-modal-slider-box"
                style={{
                  backgroundColor: modalStageTheme.cardBg,
                  borderColor: modalStageTheme.cardBorder,
                }}
              >
                <div className="admin-order-slider-meta">
                  <span className="admin-order-slider-title">Order Status</span>
                  <span
                    className="admin-order-stage-badge"
                    style={{
                      background: modalStageTheme.accentBg,
                      color: modalStageTheme.accentText,
                      borderColor: modalStageTheme.badgeBorder,
                    }}
                  >
                    <span className="stage-status-dot" style={{ background: modalStageTheme.accent }} />
                    {ORDER_STAGES[modalStageIndex]}
                  </span>
                </div>

                <div className="admin-stage-slider-track-container">
                  <div className="admin-stage-slider-bar-bg">
                    <div
                      className="admin-stage-slider-bar-fill"
                      style={{
                        width: `${modalStageIndex * 25}%`,
                        background: modalStageTheme.trackFill,
                      }}
                    />
                  </div>
                  <div className="admin-stage-nodes-row">
                    {ORDER_STAGES.map((stgName, idx) => {
                      const isPassed = idx <= modalStageIndex;
                      const isCurrent = idx === modalStageIndex;
                      return (
                        <button
                          key={stgName}
                          type="button"
                          className={`admin-stage-node-circle ${isPassed ? 'passed' : ''} ${isCurrent ? 'current' : ''}`}
                          onClick={() => updateOrderStatus(selectedOrderDetails.id, ORDER_STAGES[idx])}
                          title={`Set status to ${stgName}`}
                          style={{
                            borderColor: isPassed ? modalStageTheme.accent : '#cbd5e1',
                            backgroundColor: isCurrent ? modalStageTheme.accent : isPassed ? modalStageTheme.accentBg : '#ffffff',
                            color: isCurrent ? '#ffffff' : modalStageTheme.accentText,
                          }}
                        >
                          {isPassed ? '✓' : idx + 1}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={4}
                    step={1}
                    value={modalStageIndex}
                    onChange={e => updateOrderStatus(selectedOrderDetails.id, ORDER_STAGES[Number(e.target.value)])}
                    className="admin-stage-range-slider"
                    aria-label={`Update status for order ${modalShortId}`}
                    style={{ accentColor: modalStageTheme.accent }}
                  />
                </div>

                <div className="admin-stage-labels-row">
                  {['Confirmed', 'Selection', 'Packaging', 'Dispatched', 'Delivered'].map((stepLabel, idx) => {
                    const isCurrent = idx === modalStageIndex;
                    return (
                      <button
                        key={stepLabel}
                        type="button"
                        className={`admin-stage-label-item ${isCurrent ? 'active' : ''}`}
                        onClick={() => updateOrderStatus(selectedOrderDetails.id, ORDER_STAGES[idx])}
                        style={{
                          color: isCurrent ? modalStageTheme.accentText : '#64748b',
                          fontWeight: isCurrent ? 700 : 500,
                        }}
                      >
                        {stepLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Order Modal Actions */}
              <div className="admin-order-modal-actions">
                {modalStageIndex === 4 && (
                  <button
                    type="button"
                    className="admin-button danger admin-order-modal-delete-btn"
                    onClick={() => deleteCompletedOrder(selectedOrderDetails.id)}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                    <span>Delete Completed Order</span>
                  </button>
                )}
                <button
                  type="button"
                  className="admin-button secondary"
                  onClick={() => setSelectedOrderDetails(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </dialog>
        );
      })()}

      <div className={`admin-toast ${message ? 'show' : ''}`} role="status">
        {message && <><Icon name="check" />{message}</>}
      </div>
    </div>
  );
}
