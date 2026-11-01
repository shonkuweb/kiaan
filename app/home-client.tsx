'use client';

import { useEffect, useState } from 'react';
import { type HeroBanner } from './lib/hero';
import { Icon, ProductCard, NewsletterForm, useStore, type IconName } from './components/storefront';
import { type Product, type Category } from './lib/products';

const adeniumBenefits: { icon: IconName; title: React.ReactNode }[] = [
  { icon: 'leaf', title: <>Premium<br />Plants</> },
  { icon: 'shield', title: <>Healthy<br />&amp; Disease-Free</> },
  { icon: 'truck', title: <>Safe<br />Delivery</> },
  { icon: 'support', title: <>Plant<br />Support</> },
];

const agroCareBenefits: { icon: IconName; title: React.ReactNode }[] = [
  { icon: 'shield', title: <>100% Organic<br />Formulas</> },
  { icon: 'leaf', title: <>Root &amp; Bloom<br />Nutrition</> },
  { icon: 'truck', title: <>Safe<br />Delivery</> },
  { icon: 'support', title: <>Expert Care<br />Guidance</> },
];

export function HomeClient({
  initialProducts = [],
  initialCategories = [],
}: {
  initialProducts?: Product[];
  initialCategories?: Category[];
}) {
  const { setPanel, setInfo, products: storeProducts } = useStore();
  const [slide, setSlide] = useState(0);
  const [hero, setHero] = useState<HeroBanner | null>(null);

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    initialCategories[0]?.id || 'adenium'
  );

  const products = initialProducts.length > 0 ? initialProducts : storeProducts;

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/hero', { cache: 'no-store', signal: controller.signal })
      .then(response => (response.ok ? response.json() : null))
      .then(banner => {
        if (banner) setHero(banner);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.ok ? r.json() : [])
      .then(cats => {
        if (Array.isArray(cats) && cats.length > 0) {
          setCategories(cats);
          if (!cats.some(c => c.id === activeCategoryId)) {
            setActiveCategoryId(cats[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onSelectCategory(e: Event) {
      const custom = e as CustomEvent<string>;
      if (custom.detail) {
        setActiveCategoryId(custom.detail);
        const el = document.getElementById('store-catalog');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    window.addEventListener('select-category', onSelectCategory);
    return () => window.removeEventListener('select-category', onSelectCategory);
  }, []);

  const activeCategory = categories.find(c => c.id === activeCategoryId) || categories[0];
  const isAdenium = activeCategoryId === 'adenium';
  const displayedBenefits = isAdenium ? adeniumBenefits : agroCareBenefits;

  // Filter products by currently selected category
  const storeCategoryProducts = products.filter(p =>
    p.categoryId === activeCategoryId || (!p.categoryId && activeCategoryId === 'adenium')
  );

  // Featured list: ONLY products where isFeatured is true
  const featuredList = storeCategoryProducts.filter(p => p.isFeatured);

  // General catalog list: all products in this category
  const catalogList = storeCategoryProducts;

  return (
    <main>
      <section className={`hero hero-slide-${slide}`} aria-label="Adenium collection">
        <div
          className="hero-art"
          style={slide === 0 && hero ? { backgroundImage: `url("${hero.imageUrl}")` } : undefined}
        />
        <div className="hero-content">
          <p className="eyebrow">— &nbsp;Adenium Specialists&nbsp; —</p>
          <h1>
            {slide === 0 && hero ? (
              hero.title
            ) : slide === 0 ? (
              <>Beautiful Adenium<br />Plants for Your Garden</>
            ) : slide === 1 ? (
              <>Rare Varieties,<br />Extraordinary Blooms</>
            ) : (
              <>A Little Green.<br />A Lot of Happiness.</>
            )}
          </h1>
          <p className="hero-description">
            {slide === 0 && hero ? (
              hero.subtitle
            ) : slide === 0 ? (
              <>Rare varieties, healthy plants<br />and complete care support.</>
            ) : slide === 1 ? (
              <>Find your favorite colors<br />in our Adenium collection.</>
            ) : (
              <>Carefully grown plants,<br />delivered with care.</>
            )}
          </p>
          <a className="pill light" href="/collections/adenium">
            Shop Adenium <Icon name="arrow" />
          </a>
        </div>
        <div className="slide-dots" aria-label="Hero slides">
          {[0, 1, 2].map(n => (
            <button
              key={n}
              onClick={() => setSlide(n)}
              className={slide === n ? 'active' : ''}
              aria-label={`Show slide ${n + 1}`}
              aria-pressed={slide === n}
            />
          ))}
        </div>
      </section>

      <div className="intro-wrap">
        <section className="benefits" aria-label="Our promise">
          {displayedBenefits.map(b => (
            <div className="benefit" key={typeof b.title === 'string' ? b.title : b.icon}>
              <Icon name={b.icon} />
              <p>{b.title}</p>
            </div>
          ))}
        </section>

        {/* Dynamic Circular Categories from Admin Panel (Visible only when 2 or more categories exist) */}
        {categories.length >= 2 && (
          <section className="store-categories-section" aria-label="Store Categories">
            <div className="store-categories-header">
              <p className="categories-eyebrow">— &nbsp;Shop by Category&nbsp; —</p>
            </div>
            <div className="category-circles-scroll-wrap">
              <div className="category-circles-row" role="tablist" aria-label="Categories">
                {categories.map(cat => {
                  const isActive = activeCategoryId === cat.id;
                  const thumbImage = cat.image || (cat.id === 'agrocare' ? '/images/essentials.webp' : '/images/collection.webp');
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls="store-catalog"
                      className={`category-circle-btn ${isActive ? 'is-active' : ''}`}
                      onClick={() => setActiveCategoryId(cat.id)}
                    >
                      <div className="category-circle-avatar">
                        <img src={thumbImage} alt={cat.name} width="84" height="84" />
                        {isActive && (
                          <span className="category-circle-check" aria-hidden="true">
                            <Icon name="check" />
                          </span>
                        )}
                      </div>
                      <strong className="category-circle-name">{cat.name}</strong>
                      <span className="category-circle-status">
                        {isActive ? (
                          <span className="category-live-pill"><span className="pulse-dot" /> Selected</span>
                        ) : (
                          <span className="category-view-pill">Select</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Featured Section (Switches dynamically based on isFeatured in database) */}
      <section className="featured" aria-labelledby="featured-title">
        <div className="section-heading">
          <div>
            <h2 id="featured-title">
              Featured {activeCategory?.name || 'Products'}
            </h2>
          </div>
          {isAdenium ? (
            <a href="/collections/adenium" className="view-link">View All <Icon name="arrow" /></a>
          ) : (
            <span className="store-badge-pill">{featuredList.length} Featured</span>
          )}
        </div>
        <div className="featured-grid store-content-animated" key={`featured-${activeCategoryId}`}>
          {featuredList.map(p => (
            <ProductCard key={p.id} product={p} compact />
          ))}
          {featuredList.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '30px', textAlign: 'center', color: '#74826b', background: '#f8faf5', borderRadius: '12px' }}>
              <p>No featured products selected in {activeCategory?.name || 'this category'} yet. You can mark products as featured in the Admin Panel.</p>
            </div>
          )}
        </div>
      </section>

      {/* Catalog Section (Switches dynamically based on selected category) */}
      <section className="catalog section-wrap" id="store-catalog" aria-labelledby="plants-title">
        <div className="section-heading">
          <div>
            <h2 id="plants-title">
              {activeCategory?.name || 'Products'}
            </h2>
            <p>
              {isAdenium
                ? 'Explore our premium hand-grafted Adenium collection'
                : `Explore our collection of ${activeCategory?.name || 'plants and garden supplies'}`}
            </p>
          </div>
          {isAdenium ? (
            <button
              className="view-link"
              onClick={() => {
                window.location.href = '/collections/adenium';
              }}
            >
              View All <Icon name="arrow" />
            </button>
          ) : (
            <span className="store-badge-pill">{catalogList.length} Available</span>
          )}
        </div>
        <div className="product-grid store-content-animated" key={`catalog-${activeCategoryId}`}>
          {catalogList.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
          {catalogList.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '40px 20px', textAlign: 'center', color: '#74826b', background: '#f8faf5', borderRadius: '16px' }}>
              <p>No products in {activeCategory?.name || 'this category'} yet. Products added from the Admin Panel will appear here automatically.</p>
            </div>
          )}
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="reviews section-wrap" id="reviews" aria-labelledby="reviews-title">
        <div className="section-heading">
          <h2 id="reviews-title">Loved by Plant Enthusiasts</h2>
          <button className="view-link" onClick={() => setInfo('Customer reviews')}>
            View All Reviews <Icon name="arrow" />
          </button>
        </div>
        <div className="review-score">
          <strong>4.9</strong>
          <span className="single-star">★</span>
          <span>from 320+ reviews</span>
        </div>
        <div className="review-grid">
          {[
            { name: 'Anirban D.', image: 'double', text: 'Healthy plant and excellent packaging. Very happy!' },
            { name: 'Riya S.', image: 'red', text: 'The plant arrived in great condition. Will order again.' },
            { name: 'Suman K.', image: 'double', text: 'Beautiful adenium and very supportive team.' },
          ].map(review => (
            <article className="review-card" key={review.name}>
              <div className="review-top">
                <img src={`/images/${review.image}.webp`} alt="" width="70" height="70" loading="lazy" />
                <span className="stars" aria-label="5 out of 5 stars">★★★★★</span>
              </div>
              <blockquote>“{review.text}”</blockquote>
              <p>— {review.name}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Why Us & Care Banner */}
      <div className="section-wrap lower-sections">
        <section className="why-us">
          <h2>Why Choose Kiaan?</h2>
          <div className="why-grid">
            {[
              {
                icon: 'leaf',
                text: isAdenium ? <>Healthy &amp;<br />Well-Grown</> : <>100% Organic<br />Formulas</>,
              },
              { icon: 'shield', text: <>Safe<br />Packaging</> },
              { icon: 'truck', text: <>Pan-India<br />Delivery</> },
              { icon: 'support', text: <>Plant Care<br />Support</> },
            ].map(b => (
              <div key={b.icon}>
                <Icon name={b.icon as IconName} />
                <p>{b.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="care-banner" id="care">
          <div className="care-art" />
          <div className="care-content">
            <h2>{isAdenium ? 'Adenium Care Guide' : 'Plant Health & Soil Guide'}</h2>
            <p>
              {isAdenium
                ? <>Simple tips for healthy growth,<br />more blooms and long life.</>
                : <>Best practices on soil drainage, organic feeding,<br />and protecting Adenium from pests.</>}
            </p>
            <button className="pill light" onClick={() => setPanel('guide')}>
              Explore Guide <Icon name="arrow" />
            </button>
          </div>
        </section>

        <section className="newsletter">
          <div className="newsletter-heading">
            <img
              src="https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/kiaan/brand/kiaan-logo-dark-1793535754883.png"
              alt="Kiaan Nursery"
              width="140"
              height="60"
              style={{ objectFit: 'contain' }}
            />
            <div>
              <h2>Get Updates on New Arrivals</h2>
              <p>Be the first to know about new varieties and special nursery offers.</p>
            </div>
          </div>
          <NewsletterForm />
        </section>
      </div>
    </main>
  );
}
