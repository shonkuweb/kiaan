'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/storefront';
import { defaultHero, type HeroBanner } from '../lib/hero';

export function HeroEditor({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [banner, setBanner] = useState<HeroBanner>(defaultHero);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageReady, setImageReady] = useState(true);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const busy = loading || uploading || saving;
  useEffect(() => {
    const opener = document.activeElement as HTMLElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
    const controller = new AbortController();
    fetch('/api/admin/hero', { cache: 'no-store', signal: controller.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setBanner(result);
      setLoaded(true);
    }).catch(error => { if (!controller.signal.aborted) setError((error.message || 'Could not load the banner.') + ' Close and reopen to retry.'); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); document.body.style.overflow = oldOverflow; opener?.focus(); };
  }, []);
  async function upload(file?: File) {
    if (!file || busy || !loaded) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > 8 * 1024 * 1024) {
      setError('Choose a JPG, PNG or WebP image smaller than 8 MB.'); return;
    }
    setUploading(true);
    try {
      const form = new FormData(); form.append('image', file);
      const response = await fetch('/api/admin/hero/image', { method: 'POST', body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      // Only the confirmed R2 URL is rendered. No local blob or base64 is used.
      setImageReady(false);
      setBanner(current => ({ ...current, imageUrl: result.url }));
      setFileName(file.name);
    } catch (error) { setError(error instanceof Error ? error.message : 'Image upload failed.'); }
    finally { setUploading(false); if (fileInput.current) fileInput.current.value = ''; }
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || !loaded || !imageReady) return;
    setSaving(true); setError('');
    try {
      const response = await fetch('/api/admin/hero', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(banner) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      onSaved();
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not save the banner.'); }
    finally { setSaving(false); }
  }
  function close() { if (!uploading && !saving) onClose(); }
  return <dialog ref={dialog} className="admin-dialog hero-editor" aria-labelledby="hero-editor-title" onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) close(); }}>
    <form onSubmit={save}>
      <header className="hero-editor-header"><div className="hero-editor-heading"><span className="hero-editor-symbol"><Icon name="flower" /></span><div><h2 id="hero-editor-title">Edit hero banner</h2><p>A fresh first impression.</p></div></div><button className="admin-icon-button" type="button" aria-label="Close banner editor" disabled={uploading || saving} onClick={close}><Icon name="close" /></button></header>
      <div className="hero-editor-body" aria-busy={busy}>
        <section className="hero-editor-fields" aria-label="Banner details"><label className="hero-field-label" htmlFor="hero-upload">Banner image</label>
          <div className={`hero-upload-zone ${dragging ? 'dragging' : ''}`} onDragOver={e => { e.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); void upload(e.dataTransfer.files[0]); }}>
            <input ref={fileInput} id="hero-upload" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || !loaded} onChange={e => void upload(e.target.files?.[0])} />
            <span className="hero-upload-icon"><Icon name={uploading ? 'return' : 'plus'} /></span><strong>{uploading ? 'Uploading image…' : 'Upload a new image'}</strong><span>Choose a file or drag it here</span><small>JPG, PNG or WebP · Up to 8 MB</small>
          </div>
          {fileName && <p className="hero-upload-success" role="status"><Icon name="check" /><span>{fileName}</span><small>Uploaded</small></p>}
          <label className="hero-field-label" htmlFor="hero-heading">Heading <span>{banner.title.length}/100</span></label><input id="hero-heading" className="hero-text-input" value={banner.title} onChange={e => setBanner({ ...banner, title: e.target.value })} required maxLength={100} disabled={!loaded || saving} />
          <label className="hero-field-label" htmlFor="hero-description">Description <span>{banner.subtitle.length}/240</span></label><textarea id="hero-description" className="hero-text-input" rows={4} value={banner.subtitle} onChange={e => setBanner({ ...banner, subtitle: e.target.value })} required maxLength={240} disabled={!loaded || saving} />
        </section>
        <section className="hero-preview-column" aria-label="Hero banner preview"><div className="hero-preview-label"><span>LIVE PREVIEW</span><span className="hero-preview-dot" /></div><div className="hero-live-preview"><img src={banner.imageUrl} alt="Hero banner preview" onLoad={() => setImageReady(true)} onError={() => { setImageReady(false); setError('The banner image could not load. Upload another image or try again.'); }} /><div className="hero-preview-copy"><span>ADENIUM SPECIALISTS</span><h3>{banner.title}</h3><p>{banner.subtitle}</p><span className="hero-preview-cta">Shop Adenium <Icon name="arrow" /></span></div>{uploading && <div className="hero-upload-overlay" role="status"><span className="hero-spinner" />Uploading to R2…</div>}</div><p className="hero-preview-caption">{loading ? 'Loading your banner…' : 'Your homepage banner, as you edit.'}</p></section>
      </div>
      {error && <p className="admin-error hero-editor-error" role="alert">{error}</p>}
      <footer className="hero-editor-footer"><span><Icon name="check" />{uploading ? 'Uploading image' : saving ? 'Saving changes' : 'Ready when you are'}</span><div><button className="admin-button secondary" type="button" disabled={uploading || saving} onClick={close}>Cancel</button><button className="admin-button primary" type="submit" disabled={busy || !loaded || !imageReady}><Icon name="check" />{saving ? 'Saving…' : 'Save changes'}</button></div></footer>
    </form>
  </dialog>;
}
