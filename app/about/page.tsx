import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '../components/storefront';

export const metadata: Metadata = {
  title: 'About Us | Kiaan Agro Care & Nursery',
  description:
    'Kiaan Nursery & Agro Care is a family-founded initiative, built on years of hands-on experience, care and a deep love for nature. Meet our founders Ranita Naskar Dev and Shambhu Nath Naskar.',
};

export default function AboutPage() {
  return (
    <main className="about-page">
      <div className="about-container">
        {/* Breadcrumb */}
        <nav className="about-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="crumb-sep">›</span>
          <span className="crumb-current">About Us</span>
        </nav>

        {/* Hero / Header Section */}
        <section className="about-header-section">
          <div className="about-header-text">
            <div className="about-tag">
              <Icon name="leaf" />
              <span>ABOUT US</span>
            </div>
            <h1 className="about-title">
              A Shared Passion <br className="break-desktop" />for <span className="highlight-green">Plants</span>
            </h1>
            <p className="about-subtitle">
              Kiaan Nursery &amp; Agro Care is a family-founded initiative, built on years of hands-on experience, care and a deep love for nature.
            </p>
          </div>

          <div className="about-hero-art" aria-hidden="true">
            <img
              src="/images/about-top-flower.webp"
              alt=""
              width="280"
              height="260"
              className="about-hero-flower-img"
            />
          </div>
        </section>

        {/* Founders Section */}
        <section className="about-founders-section" aria-labelledby="founders-title">
          <div className="founders-visual-wrap">
            <img
              src="/images/about-founders-composite.webp"
              alt="Founders Ranita Naskar Dev and Shambhu Nath Naskar"
              className="founders-photo-composite"
              width="405"
              height="246"
            />
          </div>

          <div className="founders-details">
            <h2 id="founders-title" className="founders-heading">The Founders</h2>
            <div className="founder-accent-line" aria-hidden="true" />
            <div className="founders-list">
              <div className="founder-item">
                <div className="founder-avatar-circle" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="icon">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="founder-meta">
                  <strong className="founder-name">Ranita Naskar Dev</strong>
                  <span className="founder-role">Owner</span>
                </div>
              </div>

              <div className="founder-item">
                <div className="founder-avatar-circle" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="icon">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="founder-meta">
                  <strong className="founder-name">Shambhu Nath Naskar</strong>
                  <span className="founder-role">Co-owner</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Story Milestone Cards */}
        <section className="about-story-cards" aria-label="Our Milestones and Story">
          {/* Card 1: Kiaan Nursery */}
          <article className="about-story-card">
            <div className="story-card-thumb">
              <img
                src="/images/about-adenium-card.webp"
                alt="Pink Adenium Desert Rose Flower"
                width="155"
                height="120"
              />
            </div>
            <div className="story-card-content">
              <div className="story-card-badge">
                <Icon name="leaf" />
                <span>Kiaan Nursery • Since 2018</span>
              </div>
              <h2 className="story-card-title">Our Roots in Adenium</h2>
              <p className="story-card-text">
                Since 2018, Kiaan Nursery has been dedicated to Adenium (Desert Rose). With years of experience, careful cultivation and a focus on quality, we have built a trusted name among plant lovers for premium Adenium collections and guidance.
              </p>
            </div>
            <div className="story-card-watermark" aria-hidden="true">
              <svg viewBox="0 0 100 130" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M35 125h30l5-35H30l5 35Z" />
                <path d="M26 90h48v-5H26v5Z" />
                <path d="M42 85c0-10-8-15-7-25s10-12 15-22c5 10 17 12 15 22s-8 15-8 25" />
                <circle cx="50" cy="35" r="8" />
                <path d="M50 27c-4-8-12-3-8 3-8 1-3 10 3 4 5 7 12-2 4-4 7-4 1-13-4-3-3-9-10-6-5 4-7-3-11 5-4 5 1 10 7 7" />
                <circle cx="34" cy="50" r="6" />
                <path d="M34 44c-3-6-9-2-6 2-6 1-2 8 2 3 4 5 9-1 3-3 5-3 1-10-3-2" />
                <circle cx="66" cy="52" r="6" />
                <path d="M66 46c3-6 9-2 6 2 6 1 2 8-2 3-4 5-9-1-3-3-5-3-1-10 3-2" />
              </svg>
            </div>
          </article>

          {/* Card 2: Kiaan Agro Care */}
          <article className="about-story-card">
            <div className="story-card-thumb">
              <img
                src="/images/about-agro-card.webp"
                alt="Agro Care gardening tools and supplies"
                width="155"
                height="120"
              />
            </div>
            <div className="story-card-content">
              <div className="story-card-badge">
                <Icon name="leaf" />
                <span>Kiaan Agro Care • Since 2026</span>
              </div>
              <h2 className="story-card-title">Expanding into Agro Care</h2>
              <p className="story-card-text">
                In June 2026, we launched Kiaan Agro Care to offer a wider range of agriculture and gardening solutions. From fertilizers and seeds to plant protection, pesticides and essential gardening supplies, we aim to support farmers, home gardeners and plant enthusiasts at every step.
              </p>
            </div>
            <div className="story-card-watermark" aria-hidden="true">
              <svg viewBox="0 0 100 130" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M50 120V30" />
                <path d="M50 95c15-5 30 2 35 15-5-20-20-25-35-20" />
                <path d="M50 75c-15-5-30 2-35 15 5-20 20-25 35-20" />
                <path d="M50 55c14-5 28 2 33 14-5-19-19-24-33-19" />
                <path d="M50 35c-14-5-28 2-33 14 5-19 19-24 33-19" />
                <path d="M50 30c-5-12 0-25 0-25s5 13 0 25" />
              </svg>
            </div>
          </article>
        </section>

        {/* Bottom Quote Banner */}
        <section className="about-quote-banner" aria-label="Our Shared Commitment">
          <div className="quote-banner-image">
            <img
              src="/images/about-banner-leaf.webp"
              alt="Fresh green foliage"
              width="250"
              height="136"
            />
          </div>
          <div className="quote-banner-body">
            <div className="quote-leaf-icon" aria-hidden="true">
              <Icon name="leaf" />
            </div>
            <blockquote className="quote-banner-text">
              More than a business, this is our shared commitment of trust, experience, responsibility and love for nature— a journey that began in 2018 with Kiaan Nursery, and continues to grow with Kiaan Agro Care.
            </blockquote>
          </div>
        </section>
      </div>
    </main>
  );
}
