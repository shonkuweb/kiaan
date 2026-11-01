'use client';
import Link from 'next/link';
import { useState, useRef } from 'react';
import { money, getProductImageUrl, type Product } from '../lib/products';
import { Icon, ProductCard, useStore, type IconName } from './storefront';

function Breadcrumb({ product }: { product?: Product }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link href="/">Home</Link>
      <span aria-hidden="true">›</span>
      {product ? (
        <>
          <Link href="/collections/adenium">Adenium Plants</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{product.name}</span>
        </>
      ) : (
        <span aria-current="page">Adenium Plants</span>
      )}
    </nav>
  );
}

export function CollectionPage({ initialProducts = [] }: { initialProducts?: Product[] }) {
  const { products: storeProducts } = useStore();
  const products = initialProducts.length > 0
    ? initialProducts
    : storeProducts.filter(p => p.categoryId === 'adenium' || !p.categoryId);

  const [sort, setSort] = useState('popular');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [color, setColor] = useState('all');
  const [price, setPrice] = useState('all');
  const [singleColumn, setSingleColumn] = useState(false);

  const displayed = products
    .filter(p => (color === 'all' || p.color === color) && (price === 'all' || p.price <= Number(price)))
    .sort((a, b) =>
      sort === 'price-low'
        ? a.price - b.price
        : sort === 'price-high'
        ? b.price - a.price
        : sort === 'name'
        ? a.name.localeCompare(b.name)
        : (b.reviews || 0) - (a.reviews || 0)
    );

  return (
    <main className="shop-page collection-page">
      <Breadcrumb />
      <section className="collection-banner">
        <div className="collection-banner-art" />
        <div>
          <h1>Adenium<br />Collection</h1>
          <p>Exotic Varieties • Healthy Plants • Home Delivered</p>
        </div>
      </section>
      <div className="collection-controls">
        <button
          className={`filter-button ${filtersOpen ? 'is-active' : ''}`}
          aria-expanded={filtersOpen}
          aria-controls="collection-filters"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <Icon name="filter" />Filter
          {(color !== 'all' || price !== 'all') && <span className="filter-indicator" />}
        </button>
        <label className="sort-control">
          <span className="sr-only">Sort plants</span>
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option value="popular">Sort: Popular</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name: A to Z</option>
          </select>
          <Icon name="chevron" />
        </label>
        <button
          className="grid-toggle"
          aria-label={singleColumn ? 'Show two columns' : 'Show one column'}
          aria-pressed={singleColumn}
          onClick={() => setSingleColumn(!singleColumn)}
        >
          <Icon name="grid" />
        </button>
      </div>
      {filtersOpen && (
        <div className="collection-filters" id="collection-filters">
          <label>
            Flower color
            <select value={color} onChange={e => setColor(e.target.value)}>
              <option value="all">All colors</option>
              <option value="red">Red</option>
              <option value="pink">Pink & white</option>
              <option value="yellow">Yellow</option>
            </select>
          </label>
          <label>
            Price range
            <select value={price} onChange={e => setPrice(e.target.value)}>
              <option value="all">All prices</option>
              <option value="599">Up to ₹599</option>
              <option value="649">Up to ₹649</option>
            </select>
          </label>
          <button onClick={() => { setColor('all'); setPrice('all'); }}>Clear filters</button>
        </div>
      )}
      <p className="results-count" role="status">
        {displayed.length} {displayed.length === 1 ? 'Plant' : 'Plants'} Found
      </p>
      <div className={`collection-product-grid ${singleColumn ? 'single-column' : ''}`}>
        {displayed.map(product => (
          <ProductCard key={product.id} product={product} collection />
        ))}
      </div>
      {displayed.length === 0 && (
        <p className="empty-state">No plants match these filters. Try another color or price range.</p>
      )}
    </main>
  );
}

export function ProductDetails({
  product,
  relatedProducts = [],
}: {
  product: Product;
  relatedProducts?: Product[];
}) {
  const { wishlist, favorite, add, setPanel, products: storeProducts } = useStore();
  const [amount, setAmount] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const galleryTrackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  const gallery =
    product.images && product.images.length > 0
      ? product.images.map((url, i) => ({
          image: url,
          label: `${product.name} photo ${i + 1}`,
        }))
      : [{ image: getProductImageUrl(product), label: product.name }];

  const scrollToIndex = (index: number) => {
    const el = galleryTrackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(index, gallery.length - 1));
    el.scrollTo({
      left: clamped * el.clientWidth,
      behavior: 'smooth',
    });
    setActiveImage(clamped);
  };

  const handleTrackScroll = () => {
    const el = galleryTrackRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== activeImage && index >= 0 && index < gallery.length) {
      setActiveImage(index);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || gallery.length <= 1) return;
    const el = galleryTrackRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const el = galleryTrackRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
      el.scrollLeft = scrollLeftRef.current - walk;
    }
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const el = galleryTrackRef.current;
    if (el) {
      const index = Math.round(el.scrollLeft / el.clientWidth);
      scrollToIndex(index);
    }
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 50);
  };

  const related =
    relatedProducts.length > 0
      ? relatedProducts
      : storeProducts.filter(p => p.id !== product.id).slice(0, 2);

  const specs: { icon: IconName; name: string; value: string }[] = [];
  if (product.potSize) {
    specs.push({ icon: 'pot', name: 'Pot / Size', value: product.potSize });
  } else {
    specs.push({
      icon: 'pot',
      name: 'Size',
      value: product.categoryId === 'agrocare' ? 'Standard Pack' : '4–5 inch pot',
    });
  }
  if (product.plantHeight) {
    specs.push({ icon: 'height', name: 'Dimensions', value: product.plantHeight });
  } else if (product.categoryId !== 'agrocare') {
    specs.push({ icon: 'height', name: 'Plant Height', value: '~15–20 cm' });
  }
  specs.push({
    icon: 'leaf',
    name: 'Category',
    value: product.categoryId === 'agrocare' ? 'Agro Care' : 'Adenium Plant',
  });
  specs.push({
    icon: 'shield',
    name: 'Stock Status',
    value: product.stock > 0 ? (product.stock <= 5 ? `Only ${product.stock} left` : 'In Stock') : 'Out of Stock',
  });

  return (
    <main className="shop-page detail-page">
      <Breadcrumb product={product} />
      <section className="product-gallery" aria-label={`${product.name} photos`}>
        <div className="detail-main-photo">
          <div
            className="detail-gallery-track"
            ref={galleryTrackRef}
            onScroll={handleTrackScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            tabIndex={0}
            role="region"
            aria-label={`${product.name} photos, swipeable carousel`}
          >
            {gallery.map((photo, index) => {
              const photoSrc =
                photo.image.startsWith('http') || photo.image.startsWith('/')
                  ? photo.image
                  : `/images/${photo.image}.webp`;
              return (
                <div className="detail-slide" key={photo.image + index}>
                  <img
                    src={photoSrc}
                    alt={photo.label}
                    width="780"
                    height="780"
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    draggable={false}
                  />
                </div>
              );
            })}
          </div>

          <button
            className={`favorite ${wishlist.includes(product.id) ? 'selected' : ''}`}
            aria-label={`${wishlist.includes(product.id) ? 'Remove' : 'Save'} ${product.name} ${wishlist.includes(product.id) ? 'from' : 'to'} wishlist`}
            aria-pressed={wishlist.includes(product.id)}
            onClick={() => favorite(product.id)}
          >
            <Icon name="heart" />
          </button>

          {gallery.length > 1 && (
            <>
              <button
                type="button"
                className="gallery-nav-arrow prev"
                onClick={() => scrollToIndex(activeImage - 1)}
                disabled={activeImage === 0}
                aria-label="Previous photo"
              >
                <Icon name="arrow" />
              </button>
              <button
                type="button"
                className="gallery-nav-arrow next"
                onClick={() => scrollToIndex(activeImage + 1)}
                disabled={activeImage === gallery.length - 1}
                aria-label="Next photo"
              >
                <Icon name="arrow" />
              </button>
              <div className="gallery-slide-indicator" aria-hidden="true">
                {gallery.map((_, i) => (
                  <span
                    key={i}
                    className={`indicator-dot ${activeImage === i ? 'active' : ''}`}
                    onClick={() => scrollToIndex(i)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        {gallery.length > 1 && (
          <div className="gallery-thumbnails" role="tablist" aria-label="Photo thumbnails">
            {gallery.map((photo, index) => {
              const photoSrc =
                photo.image.startsWith('http') || photo.image.startsWith('/')
                  ? photo.image
                  : `/images/${photo.image}.webp`;
              return (
                <button
                  type="button"
                  role="tab"
                  className={activeImage === index ? 'active' : ''}
                  onClick={() => scrollToIndex(index)}
                  key={photo.image + index}
                  aria-label={`View ${photo.label.toLowerCase()}`}
                  aria-selected={activeImage === index}
                >
                  <img src={photoSrc} alt="" width="180" height="180" />
                </button>
              );
            })}
          </div>
        )}
      </section>
      <section className="detail-information">
        <h1>{product.name}</h1>
        <div className="detail-rating">
          <span className="stars" aria-label="5 out of 5 stars">★★★★★</span>
          <span>{(product.rating || 4.9).toFixed(1)} ({product.reviews || 0} reviews)</span>
        </div>
        <div className="detail-price-row">
          {product.originalPrice && product.originalPrice > product.price ? (
            <div className="detail-price-split-wrap">
              <span className="detail-offer-price">{money(product.price)}</span>
              <span className="detail-original-price">{money(product.originalPrice)}</span>
              <span className="detail-discount-tag">
                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
              </span>
            </div>
          ) : (
            <p className="detail-price">{money(product.price)}</p>
          )}
          <span className={`stock-badge ${product.stock <= 0 ? 'out-of-stock' : ''}`}>
            <Icon name="check" />
            {product.stock > 0 ? (product.stock <= 5 ? `Only ${product.stock} left` : 'In Stock') : 'Out of Stock'}
          </span>
        </div>
        <p className="product-description">{product.description}</p>
        <div className="product-specs">
          {specs.map(s => (
            <div key={s.name}>
              <Icon name={s.icon} />
              <strong>{s.name}</strong>
              <span>{s.value}</span>
            </div>
          ))}
        </div>
        <div className="detail-purchase">
          <div className="reference-quantity">
            <button onClick={() => setAmount(n => Math.max(1, n - 1))} aria-label="Decrease quantity" disabled={amount === 1 || product.stock <= 0}>
              <Icon name="minus" />
            </button>
            <span aria-live="polite">{amount}</span>
            <button onClick={() => setAmount(n => Math.min(Math.max(1, product.stock), n + 1))} aria-label="Increase quantity" disabled={amount >= product.stock}>
              <Icon name="plus" />
            </button>
          </div>
          <button className="pill dark detail-add" disabled={product.stock <= 0} onClick={() => add(product, amount)}>
            <Icon name="cart" />{product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
        <div className="product-accordions">
          {[
            {
              icon: 'file',
              title: 'Product Details',
              content: (
                <p>
                  {product.details || product.description || 'Quality plant grown with care at Kiaan Nursery.'}
                </p>
              ),
            },
            {
              icon: 'truck',
              title: 'Shipping & Delivery',
              content: (
                <p>
                  {product.shippingInfo || 'Plants and products are packed with special care for safe nationwide transit. Contact our team to verify pin-code serviceability, transit duration, and shipping charges before ordering.'}
                </p>
              ),
            },
            {
              icon: 'return',
              title: 'Returns & Refunds',
              content: (
                <p>
                  {product.returnsInfo || 'If your shipment arrives damaged or with issues, contact Kiaan Nursery promptly on WhatsApp with photos of the plant and packaging. We assist with replacements and care advice.'}
                </p>
              ),
            },
          ].map(item => (
            <details key={item.title}>
              <summary>
                <Icon name={item.icon as IconName} />
                <strong>{item.title}</strong>
                <Icon name="chevron" />
              </summary>
              <div>{item.content}</div>
            </details>
          ))}
        </div>
      </section>
      <section className="related-products">
        <div className="section-heading">
          <h2>You May Also Like</h2>
          <Link className="view-link" href="/collections/adenium">View All <Icon name="arrow" /></Link>
        </div>
        <div className="related-grid">
          {related.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </main>
  );
}
