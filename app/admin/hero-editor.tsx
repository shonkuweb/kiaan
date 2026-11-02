'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/storefront';
import { defaultHero, type HeroBanner } from '../lib/hero';

export function HeroEditor({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [banner, setBanner] = useState<HeroBanner>(defaultHero);
  const [images, setImages] = useState<string[]>(['/images/hero-flower.webp']);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  const busy = loading || uploading || saving;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
    const controller = new AbortController();
    fetch('/api/admin/hero', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        setBanner(result);
        const bannerImgs = Array.isArray(result.images) && result.images.length > 0
          ? result.images.slice(0, 3)
          : (result.imageUrl ? [result.imageUrl] : ['/images/hero-flower.webp']);
        setImages(bannerImgs);
        setLoaded(true);
      })
      .catch(err => {
        if (!controller.signal.aborted) {
          setError((err.message || 'Could not load the banner.') + ' Close and reopen to retry.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      controller.abort();
      document.body.style.overflow = oldOverflow;
      opener?.focus();
    };
  }, []);

  // 2-second rotation in live preview
  useEffect(() => {
    if (images.length <= 1) {
      setActivePreviewIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setActivePreviewIndex(prev => (prev + 1) % images.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [images.length]);

  async function upload(files?: FileList | null) {
    if (!files || !files.length || busy || !loaded) return;
    setError('');
    const selected = Array.from(files);
    if (images.length + selected.length > 3) {
      setError(`You can add up to 3 hero banner images (${images.length} already added). Remove an image to replace it.`);
      if (fileInput.current) fileInput.current.value = '';
      return;
    }
    for (const f of selected) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || !f.size || f.size > 8 * 1024 * 1024) {
        setError('Choose JPG, PNG or WebP images smaller than 8 MB each.');
        if (fileInput.current) fileInput.current.value = '';
        return;
      }
    }

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < selected.length; i++) {
        setUploadProgress(`Uploading photo ${i + 1} of ${selected.length}…`);
        const form = new FormData();
        form.append('image', selected[i]);
        const response = await fetch('/api/admin/hero/image', { method: 'POST', body: form });
        const result = await response.json();
        if (!response.ok) throw new Error(`${selected[i].name}: ${result.error || 'Upload failed.'}`);
        uploadedUrls.push(result.url);
      }
      setImages(current => [...current, ...uploadedUrls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !loaded) return;
    if (images.length === 0) {
      setError('Please add at least one banner image.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: HeroBanner = {
        title: banner.title.trim(),
        subtitle: banner.subtitle.trim(),
        imageUrl: images[0] || '/images/hero-flower.webp',
        images,
      };
      const response = await fetch('/api/admin/hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the banner.');
    } finally {
      setSaving(false);
    }
  }

  function close() {
    if (!uploading && !saving) onClose();
  }

  return (
    <dialog
      ref={dialog}
      className="admin-dialog hero-editor"
      aria-labelledby="hero-editor-title"
      onCancel={e => { e.preventDefault(); close(); }}
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      <form onSubmit={save}>
        <header className="hero-editor-header">
          <div className="hero-editor-heading">
            <span className="hero-editor-symbol"><Icon name="flower" /></span>
            <div>
              <h2 id="hero-editor-title">Edit hero banner</h2>
              <p>Add up to 3 banner images that auto-cycle every 2 seconds.</p>
            </div>
          </div>
          <button
            className="admin-icon-button"
            type="button"
            aria-label="Close banner editor"
            disabled={uploading || saving}
            onClick={close}
          >
            <Icon name="close" />
          </button>
        </header>

        <div className="hero-editor-body" aria-busy={busy}>
          <section className="hero-editor-fields" aria-label="Banner details">
            {/* Multi-image section (up to 3 images) */}
            <div className="product-photo-heading">
              <label className="hero-field-label" style={{ margin: 0 }}>Banner images</label>
              <span style={{ fontSize: '11px', color: '#768571' }}>{images.length}/3 images</span>
            </div>

            <div className="product-photo-grid">
              {images.map((url, index) => (
                <div className="product-photo-slot" key={url + index}>
                  <img src={url} alt={`Banner photo ${index + 1}`} />
                  <span>{index === 0 ? 'Cover · Slide 1' : `Slide ${index + 1}`}</span>
                  {images.length > 1 && (
                    <button
                      type="button"
                      disabled={uploading || saving}
                      aria-label={`Remove photo ${index + 1}`}
                      onClick={() => {
                        setImages(current => current.filter((_, i) => i !== index));
                        setActivePreviewIndex(0);
                      }}
                    >
                      <Icon name="close" />
                    </button>
                  )}
                  {index > 0 && (
                    <button
                      className="product-photo-cover"
                      type="button"
                      disabled={uploading || saving}
                      onClick={() => {
                        setImages(current => [current[index], ...current.filter((_, i) => i !== index)]);
                        setActivePreviewIndex(0);
                      }}
                    >
                      Make cover
                    </button>
                  )}
                </div>
              ))}
              {images.length < 3 && (
                <label className={`product-photo-add ${uploading ? 'uploading' : ''}`}>
                  <input
                    ref={fileInput}
                    type="file"
                    aria-label="Upload hero banner photos"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={busy || !loaded}
                    onChange={e => void upload(e.target.files)}
                  />
                  <Icon name={uploading ? 'return' : 'plus'} />
                  <span>{uploading ? 'Uploading…' : 'Add image'}</span>
                </label>
              )}
            </div>

            <p className="product-photo-help">
              Upload up to 3 banner images · Rotates every 2s on homepage · JPG, PNG or WebP up to 8 MB
            </p>
            {uploadProgress && <p className="product-upload-progress" role="status">{uploadProgress}</p>}

            <label className="hero-field-label" htmlFor="hero-heading" style={{ marginTop: '16px' }}>
              Heading <span>{banner.title.length}/100</span>
            </label>
            <input
              id="hero-heading"
              className="hero-text-input"
              value={banner.title}
              onChange={e => setBanner({ ...banner, title: e.target.value })}
              required
              maxLength={100}
              disabled={!loaded || saving}
            />

            <label className="hero-field-label" htmlFor="hero-description" style={{ marginTop: '12px' }}>
              Description <span>{banner.subtitle.length}/240</span>
            </label>
            <textarea
              id="hero-description"
              className="hero-text-input"
              rows={3}
              value={banner.subtitle}
              onChange={e => setBanner({ ...banner, subtitle: e.target.value })}
              required
              maxLength={240}
              disabled={!loaded || saving}
            />
          </section>

          <section className="hero-preview-column" aria-label="Hero banner preview">
            <div className="hero-preview-label">
              <span>LIVE ROTATING PREVIEW (2s)</span>
              <span className="hero-preview-dot" />
            </div>

            <div className="hero-live-preview" style={{ position: 'relative', overflow: 'hidden' }}>
              {images.map((url, idx) => (
                <img
                  key={url + idx}
                  src={url}
                  alt={`Hero banner preview ${idx + 1}`}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: idx === activePreviewIndex ? 1 : 0,
                    transition: 'opacity 0.6s ease-in-out',
                    zIndex: idx === activePreviewIndex ? 2 : 1,
                  }}
                  onError={() => {
                    if (images.length === 1) {
                      setError('The banner image could not load. Upload another image or try again.');
                    }
                  }}
                />
              ))}

              <div className="hero-preview-copy" style={{ zIndex: 3, position: 'relative' }}>
                <span>ADENIUM SPECIALISTS</span>
                <h3>{banner.title}</h3>
                <p>{banner.subtitle}</p>
                <span className="hero-preview-cta">Shop Adenium <Icon name="arrow" /></span>
              </div>

              {images.length > 1 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '6px',
                    zIndex: 4,
                  }}
                >
                  {images.map((_, i) => (
                    <span
                      key={i}
                      style={{
                        width: i === activePreviewIndex ? '18px' : '5px',
                        height: '4px',
                        borderRadius: '999px',
                        background: i === activePreviewIndex ? '#ffffff' : 'rgba(255,255,255,0.45)',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  ))}
                </div>
              )}

              {uploading && (
                <div className="hero-upload-overlay" role="status" style={{ zIndex: 5 }}>
                  <span className="hero-spinner" />{uploadProgress || 'Uploading to R2…'}
                </div>
              )}
            </div>

            <p className="hero-preview-caption">
              {loading
                ? 'Loading your banner…'
                : images.length > 1
                  ? `Showing slide ${activePreviewIndex + 1} of ${images.length} (cycling every 2s)`
                  : 'Your homepage banner, as you edit.'}
            </p>
          </section>
        </div>

        {error && <p className="admin-error hero-editor-error" role="alert">{error}</p>}

        <footer className="hero-editor-footer">
          <span>
            <Icon name="check" />
            {uploading ? 'Uploading image' : saving ? 'Saving changes' : `${images.length} banner image${images.length === 1 ? '' : 's'} configured`}
          </span>
          <div>
            <button className="admin-button secondary" type="button" disabled={uploading || saving} onClick={close}>
              Cancel
            </button>
            <button className="admin-button primary" type="submit" disabled={busy || !loaded || images.length === 0}>
              <Icon name="check" />
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}
