import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  images: string[];
  description: string;
  categoryId: string;
  isFeatured: boolean;
  color: string;
  rating: number;
  reviews: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Category = {
  id: string;
  name: string;
  isVisible: boolean;
  image?: string;
  createdAt?: string;
};

export type Order = {
  id: string;
  customer: string;
  details: string;
  total: number;
  status: string;
  date: string;
};

export type StoreSettings = {
  title: string;
  subtitle: string;
  hero: boolean;
  featured: boolean;
  reviews: boolean;
  newsletter: boolean;
};

type DbProductRow = {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  images: string;
  description: string;
  category_id: string;
  is_featured: number;
  color: string;
  rating: number;
  reviews: number;
  created_at: string;
  updated_at: string;
};

type DbCategoryRow = {
  id: string;
  name: string;
  is_visible: number;
  image?: string;
  created_at: string;
};

type DbOrderRow = {
  id: string;
  customer: string;
  details: string;
  total: number;
  status: string;
  created_at: string;
};

type DbSettingRow = {
  key: string;
  value: string;
};

const initialCategories = [
  { id: 'adenium', name: 'Adenium', image: '/images/collection.webp' },
  { id: 'agrocare', name: 'Agrocare products', image: '/images/essentials.webp' },
];

const initialProducts = [
  {
    id: 'red',
    name: 'Adenium Hybrid Red',
    price: 599,
    stock: 12,
    image: '/images/hybrid-red.webp',
    images: ['/images/hybrid-red.webp', '/images/red-detail.webp', '/images/red-angle.webp'],
    description: 'Vibrant red blooms with a strong, healthy caudex. A favorite among Adenium lovers.',
    categoryId: 'adenium',
    isFeatured: true,
    color: 'red',
    rating: 4.9,
    reviews: 128,
  },
  {
    id: 'pink',
    name: 'Adenium Pink Pearl',
    price: 549,
    stock: 8,
    image: '/images/pink.webp',
    images: ['/images/pink.webp'],
    description: 'Delicate pink blooms and lush green foliage bring a little color to your garden.',
    categoryId: 'adenium',
    isFeatured: true,
    color: 'pink',
    rating: 4.8,
    reviews: 96,
  },
  {
    id: 'double',
    name: 'Adenium Double Bloom',
    price: 699,
    stock: 5,
    image: '/images/double.webp',
    images: ['/images/double.webp'],
    description: 'Beautiful layered white petals with a vivid pink edge, grown with care for your garden.',
    categoryId: 'adenium',
    isFeatured: true,
    color: 'white',
    rating: 4.9,
    reviews: 74,
  },
  {
    id: 'sunset',
    name: 'Adenium Sunset',
    price: 599,
    stock: 15,
    image: '/images/sunset.webp',
    images: ['/images/sunset.webp'],
    description: 'Warm yellow and pink blooms that bring the colors of sunset to your collection.',
    categoryId: 'adenium',
    isFeatured: false,
    color: 'yellow',
    rating: 4.8,
    reviews: 62,
  },
  {
    id: 'pink-star',
    name: 'Adenium Pink Star',
    price: 549,
    stock: 9,
    image: '/images/pink-star.webp',
    images: ['/images/pink-star.webp'],
    description: 'Star-like white blooms edged in bright pink, with a strong, healthy caudex.',
    categoryId: 'adenium',
    isFeatured: false,
    color: 'pink',
    rating: 4.8,
    reviews: 96,
  },
  {
    id: 'double-petal',
    name: 'Adenium Double Petal',
    price: 699,
    stock: 10,
    image: '/images/double-petal.webp',
    images: ['/images/double-petal.webp'],
    description: 'Layers of rich pink petals make this flowering Adenium a beautiful garden centerpiece.',
    categoryId: 'adenium',
    isFeatured: false,
    color: 'pink',
    rating: 4.9,
    reviews: 74,
  },
  {
    id: 'yellow-splash',
    name: 'Adenium Yellow Splash',
    price: 649,
    stock: 7,
    image: '/images/yellow-splash.webp',
    images: ['/images/yellow-splash.webp'],
    description: 'Soft yellow petals splashed with pink for an unusual, sunny addition to your garden.',
    categoryId: 'adenium',
    isFeatured: false,
    color: 'yellow',
    rating: 4.8,
    reviews: 62,
  },
  {
    id: 'bloom-booster',
    name: 'Organic Bloom Booster Tonic',
    price: 349,
    stock: 25,
    image: '/images/agro-fertilizer.webp',
    images: ['/images/agro-fertilizer.webp'],
    description: 'Specialized liquid plant nutrient formula rich in potassium & phosphorus to induce vibrant blooms and strengthen root health.',
    categoryId: 'agrocare',
    isFeatured: true,
    color: 'green',
    rating: 4.9,
    reviews: 84,
  },
  {
    id: 'neem-spray',
    name: 'Neem Bio-Defense Plant Spray',
    price: 299,
    stock: 30,
    image: '/images/agro-neem-spray.webp',
    images: ['/images/agro-neem-spray.webp'],
    description: 'Pure cold-pressed neem oil blend ready-to-use spray. Naturally protects plants against mealybugs, mites, and fungal leaf spots.',
    categoryId: 'agrocare',
    isFeatured: true,
    color: 'green',
    rating: 4.8,
    reviews: 112,
  },
  {
    id: 'adenium-soil-mix',
    name: 'Adenium Special Potting Mix (5kg)',
    price: 449,
    stock: 20,
    image: '/images/agro-potting-mix.webp',
    images: ['/images/agro-potting-mix.webp'],
    description: 'Ultra-draining coarse potting blend with perlite, river sand, charcoal, and aged compost to prevent caudex and root rot.',
    categoryId: 'agrocare',
    isFeatured: true,
    color: 'brown',
    rating: 4.9,
    reviews: 145,
  },
  {
    id: 'terracotta-planter',
    name: 'Handcrafted Terracotta Bonsai Pot',
    price: 499,
    stock: 15,
    image: '/images/agro-terracotta-pot.webp',
    images: ['/images/agro-terracotta-pot.webp'],
    description: 'Wide shallow breathable terracotta planter with drainage dish, specifically proportioned to showcase and nurture thickened Adenium caudex.',
    categoryId: 'agrocare',
    isFeatured: true,
    color: 'terracotta',
    rating: 4.9,
    reviews: 78,
  },
];

let globalDb: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (globalDb) return globalDb;

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'nursery.db');
  const db = new DatabaseSync(dbPath);

  // WAL mode for performance and concurrent reads
  try {
    db.exec('PRAGMA journal_mode = WAL;');
  } catch {
    // Continue even if PRAGMA cannot be set
  }

  // Schema creation
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_visible INTEGER NOT NULL DEFAULT 1,
      image TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      image TEXT NOT NULL DEFAULT '',
      images TEXT NOT NULL DEFAULT '[]',
      description TEXT NOT NULL DEFAULT '',
      category_id TEXT NOT NULL REFERENCES categories(id),
      is_featured INTEGER NOT NULL DEFAULT 0,
      color TEXT NOT NULL DEFAULT 'pink',
      rating REAL NOT NULL DEFAULT 4.9,
      reviews INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer TEXT NOT NULL,
      details TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  try {
    db.exec('ALTER TABLE categories ADD COLUMN is_visible INTEGER NOT NULL DEFAULT 1;');
  } catch {
    // Column already exists
  }
  try {
    db.exec('ALTER TABLE categories ADD COLUMN image TEXT NOT NULL DEFAULT "";');
  } catch {
    // Column already exists
  }
  try {
    db.prepare('UPDATE categories SET image = ? WHERE id = ? AND (image IS NULL OR image = "")').run('/images/collection.webp', 'adenium');
    db.prepare('UPDATE categories SET image = ? WHERE id = ? AND (image IS NULL OR image = "")').run('/images/essentials.webp', 'agrocare');
  } catch {
    // Ignore migration error
  }

  // Seed default categories if none exist
  const categoryCount = (db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }).count;
  if (categoryCount === 0) {
    const insertCat = db.prepare('INSERT INTO categories (id, name, is_visible, image, created_at) VALUES (?, ?, ?, ?, ?)');
    const now = new Date().toISOString();
    for (const cat of initialCategories) {
      insertCat.run(cat.id, cat.name, 1, cat.image, now);
    }
  }

  // Seed initial products if none exist
  const productCount = (db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }).count;
  if (productCount === 0) {
    const insertProd = db.prepare(`
      INSERT INTO products (
        id, name, price, stock, image, images, description, category_id,
        is_featured, color, rating, reviews, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    for (const p of initialProducts) {
      insertProd.run(
        p.id,
        p.name,
        p.price,
        p.stock,
        p.image,
        JSON.stringify(p.images),
        p.description,
        p.categoryId,
        p.isFeatured ? 1 : 0,
        p.color,
        p.rating,
        p.reviews,
        now,
        now
      );
    }
  }

  // Seed default settings if none exist
  const settingsCount = (db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number }).count;
  if (settingsCount === 0) {
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    const defaultSettings: StoreSettings = {
      title: 'Beautiful Adenium Plants for Your Garden',
      subtitle: 'Rare varieties, healthy plants and complete care support.',
      hero: true,
      featured: true,
      reviews: true,
      newsletter: true,
    };
    insertSetting.run('store_settings', JSON.stringify(defaultSettings));
  }

  globalDb = db;
  return db;
}

function rowToProduct(row: DbProductRow): Product {
  let images: string[] = [];
  try {
    images = JSON.parse(row.images);
    if (!Array.isArray(images)) images = [];
  } catch {
    images = row.image ? [row.image] : [];
  }

  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    stock: Number(row.stock),
    image: row.image,
    images: images.length > 0 ? images : row.image ? [row.image] : [],
    description: row.description || '',
    categoryId: row.category_id,
    isFeatured: row.is_featured === 1,
    color: row.color || 'pink',
    rating: Number(row.rating || 4.9),
    reviews: Number(row.reviews || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getProducts(filter?: { categoryId?: string; featuredOnly?: boolean }): Product[] {
  const db = getDatabase();
  let query = 'SELECT * FROM products';
  const params: (string | number)[] = [];
  const clauses: string[] = [];

  if (filter?.categoryId) {
    clauses.push('category_id = ?');
    params.push(filter.categoryId);
  }

  if (filter?.featuredOnly) {
    clauses.push('is_featured = 1');
  }

  if (clauses.length > 0) {
    query += ' WHERE ' + clauses.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  const rows = db.prepare(query).all(...params) as unknown as DbProductRow[];
  return rows.map(rowToProduct);
}

export function getProductById(id: string): Product | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as unknown as DbProductRow | undefined;
  return row ? rowToProduct(row) : null;
}

export function createProduct(data: {
  id?: string;
  name: string;
  price: number;
  stock: number;
  image?: string;
  images?: string[];
  description?: string;
  categoryId: string;
  isFeatured?: boolean;
  color?: string;
  rating?: number;
  reviews?: number;
}): Product {
  const db = getDatabase();
  const id = data.id || crypto.randomUUID();
  const now = new Date().toISOString();
  const images = data.images && data.images.length > 0 ? data.images : data.image ? [data.image] : [];
  const primaryImage = images[0] || data.image || '';

  const stmt = db.prepare(`
    INSERT INTO products (
      id, name, price, stock, image, images, description, category_id,
      is_featured, color, rating, reviews, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.name.trim(),
    Number(data.price),
    Number(data.stock),
    primaryImage,
    JSON.stringify(images),
    (data.description || '').trim(),
    data.categoryId,
    data.isFeatured ? 1 : 0,
    data.color || 'pink',
    data.rating ?? 4.9,
    data.reviews ?? 0,
    now,
    now
  );

  return getProductById(id)!;
}

export function updateProduct(id: string, data: Partial<Product>): Product | null {
  const db = getDatabase();
  const existing = getProductById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const name = data.name !== undefined ? data.name.trim() : existing.name;
  const price = data.price !== undefined ? Number(data.price) : existing.price;
  const stock = data.stock !== undefined ? Number(data.stock) : existing.stock;
  const images = data.images !== undefined ? data.images : existing.images;
  const primaryImage = images[0] || (data.image !== undefined ? data.image : existing.image);
  const description = data.description !== undefined ? data.description.trim() : existing.description;
  const categoryId = data.categoryId !== undefined ? data.categoryId : existing.categoryId;
  const isFeatured = data.isFeatured !== undefined ? (data.isFeatured ? 1 : 0) : (existing.isFeatured ? 1 : 0);
  const color = data.color !== undefined ? data.color : existing.color;
  const rating = data.rating !== undefined ? Number(data.rating) : existing.rating;
  const reviews = data.reviews !== undefined ? Number(data.reviews) : existing.reviews;

  const stmt = db.prepare(`
    UPDATE products SET
      name = ?,
      price = ?,
      stock = ?,
      image = ?,
      images = ?,
      description = ?,
      category_id = ?,
      is_featured = ?,
      color = ?,
      rating = ?,
      reviews = ?,
      updated_at = ?
    WHERE id = ?
  `);

  stmt.run(
    name,
    price,
    stock,
    primaryImage,
    JSON.stringify(images),
    description,
    categoryId,
    isFeatured,
    color,
    rating,
    reviews,
    now,
    id
  );

  return getProductById(id);
}

export function deleteProduct(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getCategories(filter?: { visibleOnly?: boolean }): Category[] {
  const db = getDatabase();
  let query = 'SELECT * FROM categories';
  if (filter?.visibleOnly) {
    query += ' WHERE is_visible = 1';
  }
  query += ' ORDER BY created_at ASC';
  const rows = db.prepare(query).all() as unknown as DbCategoryRow[];
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    isVisible: r.is_visible === 1,
    image: r.image || (r.id === 'agrocare' ? '/images/essentials.webp' : '/images/collection.webp'),
    createdAt: r.created_at,
  }));
}

export function createCategory(name: string, isVisible = true, id?: string, image = ''): Category {
  const db = getDatabase();
  const catId = id || crypto.randomUUID();
  const now = new Date().toISOString();
  const img = (image || '').trim();
  db.prepare('INSERT INTO categories (id, name, is_visible, image, created_at) VALUES (?, ?, ?, ?, ?)').run(
    catId,
    name.trim(),
    isVisible ? 1 : 0,
    img,
    now
  );
  return { id: catId, name: name.trim(), isVisible, image: img, createdAt: now };
}

export function updateCategory(id: string, data: { name?: string; isVisible?: boolean; image?: string }): Category | null {
  const db = getDatabase();
  const existing = (db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as unknown as DbCategoryRow | undefined);
  if (!existing) return null;

  const nextName = data.name !== undefined ? data.name.trim() : existing.name;
  const nextVisible = data.isVisible !== undefined ? (data.isVisible ? 1 : 0) : existing.is_visible;
  const nextImage = data.image !== undefined ? data.image.trim() : (existing.image || '');

  db.prepare('UPDATE categories SET name = ?, is_visible = ?, image = ? WHERE id = ?').run(nextName, nextVisible, nextImage, id);
  return { id, name: nextName, isVisible: nextVisible === 1, image: nextImage, createdAt: existing.created_at };
}

export function deleteCategory(id: string): boolean {
  const db = getDatabase();
  // Check if any products use this category
  const count = (db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?').get(id) as { count: number }).count;
  if (count > 0) return false;
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getOrders(): Order[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as unknown as DbOrderRow[];
  return rows.map(r => ({
    id: r.id,
    customer: r.customer,
    details: r.details,
    total: Number(r.total),
    status: r.status,
    date: r.created_at,
  }));
}

export function createOrder(data: { customer: string; details: string; total: number; status?: string }): Order {
  const db = getDatabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const status = data.status || 'Pending';
  db.prepare(`
    INSERT INTO orders (id, customer, details, total, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.customer.trim(), data.details.trim(), Number(data.total), status, now);

  return { id, customer: data.customer.trim(), details: data.details.trim(), total: Number(data.total), status, date: now };
}

export function updateOrderStatus(id: string, status: string): Order | null {
  const db = getDatabase();
  const result = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  if (result.changes === 0) return null;
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as unknown as DbOrderRow | undefined;
  if (!row) return null;
  return {
    id: row.id,
    customer: row.customer,
    details: row.details,
    total: Number(row.total),
    status: row.status,
    date: row.created_at,
  };
}

export function getStoreSettings(): StoreSettings {
  const db = getDatabase();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('store_settings') as unknown as DbSettingRow | undefined;
  if (row) {
    try {
      return JSON.parse(row.value);
    } catch {
      // fallback
    }
  }
  return {
    title: 'Beautiful Adenium Plants for Your Garden',
    subtitle: 'Rare varieties, healthy plants and complete care support.',
    hero: true,
    featured: true,
    reviews: true,
    newsletter: true,
  };
}

export function updateStoreSettings(settings: Partial<StoreSettings>): StoreSettings {
  const db = getDatabase();
  const current = getStoreSettings();
  const next: StoreSettings = { ...current, ...settings };
  db.prepare(`
    INSERT INTO settings (key, value) VALUES ('store_settings', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(JSON.stringify(next));
  return next;
}
