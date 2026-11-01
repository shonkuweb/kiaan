'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/storefront';
import type { InventoryProduct, ProductCategory } from './product-types';

export function ProductEditor({ product, categories, categoryId, onClose, onSave }: {
  product: InventoryProduct | null; categories: ProductCategory[]; categoryId: string;
  onClose: () => void; onSave: (product: InventoryProduct) => boolean | Promise<boolean>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [isFeatured, setIsFeatured] = useState<boolean>(product?.isFeatured ?? false);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
    return () => { document.body.style.overflow = overflow; opener?.focus(); };
  }, []);

  async function upload(files: FileList | null) {
    if (!files?.length || uploading) return;
    const selected = Array.from(files);
    setError('');
    if (images.length + selected.length > 3) {
      setError('You can add up to 3 photos per product. Remove a photo to replace it.');
      if (fileInput.current) fileInput.current.value = '';
      return;
    }
    if (selected.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > 8 * 1024 * 1024)) {
      setError('Choose JPG, PNG or WebP files up to 8 MB each.');
      if (fileInput.current) fileInput.current.value = '';
      return;
    }
    setUploading(true);
    try {
      for (let index = 0; index < selected.length; index++) {
        setProgress(`Uploading photo ${index + 1} of ${selected.length}…`);
        const form = new FormData();
        form.append('image', selected[index]);
        const response = await fetch('/api/admin/products/images', { method: 'POST', body: form });
        const result = await response.json();
        if (!response.ok) throw new Error(`${selected[index].name}: ${result.error || 'Upload failed.'}`);
        setImages(current => [...current, result.url]);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress('');
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading) return;
    setError('');
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) || '').trim();
    const price = Number(text('price'));
    const stock = Number(text('stock'));
    if (!text('name') || !categories.some(c => c.id === text('categoryId'))) {
      return setError('Enter a name and choose a category.');
    }
    if (!Number.isFinite(price) || price <= 0 || price > 10000000 || !Number.isInteger(stock) || stock < 0 || stock > 1000000) {
      return setError('Enter a valid price and whole-number stock quantity.');
    }
    if (!images.length || images.length > 3) {
      return setError('Add between 1 and 3 square product photos.');
    }

    const saved = await onSave({
      id: product?.id || crypto.randomUUID(),
      name: text('name'),
      categoryId: text('categoryId'),
      price,
      stock,
      image: images[0] || product?.image || '',
      images,
      description: text('description'),
      isFeatured,
      color: product?.color || 'pink',
      rating: product?.rating ?? 4.9,
      reviews: product?.reviews ?? 0,
    });
    if (!saved) setError('Your browser could not save this product. Free some storage and try again.');
  }

  function close() {
    if (!uploading) onClose();
  }

  return (
    <dialog
      ref={dialog}
      className="admin-dialog product-editor"
      aria-labelledby="product-editor-title"
      onCancel={e => { e.preventDefault(); close(); }}
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      <form onSubmit={submit}>
        <header className="hero-editor-header">
          <div className="hero-editor-heading">
            <span className="hero-editor-symbol"><Icon name="box" /></span>
            <div>
              <h2 id="product-editor-title">{product ? 'Edit product' : 'Add a product'}</h2>
              <p>{product ? 'Update the details, visibility and photos.' : 'A new addition to your nursery.'}</p>
            </div>
          </div>
          <button className="admin-icon-button" type="button" aria-label="Close product editor" disabled={uploading} onClick={close}>
            <Icon name="close" />
          </button>
        </header>

        <div className="product-editor-body">
          <section className="product-photo-section" aria-label="Product photos">
            <div className="product-photo-heading">
              <strong>Product photos</strong>
              <span>{images.length}/3</span>
            </div>
            <div className="product-photo-grid">
              {images.map((url, index) => (
                <div className="product-photo-slot" key={url}>
                  <img src={url} alt={`Product photo ${index + 1}`} />
                  <span>{index === 0 ? 'Cover' : index + 1}</span>
                  <button type="button" disabled={uploading} aria-label={`Remove photo ${index + 1}`} onClick={() => setImages(current => current.filter((_, i) => i !== index))}>
                    <Icon name="close" />
                  </button>
                  {index > 0 && (
                    <button className="product-photo-cover" type="button" disabled={uploading} onClick={() => setImages(current => [current[index], ...current.filter((_, i) => i !== index)])}>
                      Make cover
                    </button>
                  )}
                </div>
              ))}
              {images.length < 3 && (
                <label className={`product-photo-add ${uploading ? 'uploading' : ''}`}>
                  <input ref={fileInput} type="file" aria-label="Upload product photos" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading} onChange={e => void upload(e.target.files)} />
                  <Icon name={uploading ? 'return' : 'plus'} />
                  <span>{uploading ? 'Uploading…' : 'Add photos'}</span>
                </label>
              )}
            </div>
            <p className="product-photo-help">1:1 square · JPG, PNG or WebP · Up to 8 MB each</p>
            <p className="product-upload-progress" role="status">{progress}</p>
          </section>

          <div className="product-detail-fields">
            <label>
              Product name
              <input name="name" defaultValue={product?.name || ''} required maxLength={100} placeholder="e.g. Adenium Ruby Bloom" disabled={uploading} />
            </label>

            <label>
              Category
              <select name="categoryId" defaultValue={product?.categoryId || categoryId} required disabled={uploading}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>

            <div className="admin-form-grid">
              <label>
                Price (₹)
                <input name="price" type="number" min="0.01" max="10000000" step="0.01" defaultValue={product?.price} required disabled={uploading} />
              </label>
              <label>
                Stock quantity
                <input name="stock" type="number" min="0" max="1000000" step="1" defaultValue={product?.stock ?? 0} required disabled={uploading} />
              </label>
            </div>

            <label>
              Description
              <textarea name="description" defaultValue={product?.description || ''} maxLength={1000} rows={3} disabled={uploading} />
            </label>

            <label className="admin-toggle-row" style={{ marginTop: '20px', borderTop: '1px solid #edf0e7', paddingTop: '16px' }}>
              <span>
                <strong>Show in Featured Collection</strong>
                <small>
                  {isFeatured
                    ? 'Highlighted in the Featured Collection on the front page as well as the Adenium Plants section.'
                    : 'Disabled: Will only be visible in the Adenium Plants card section on the storefront.'}
                </small>
              </span>
              <input
                type="checkbox"
                name="isFeatured"
                checked={isFeatured}
                onChange={e => setIsFeatured(e.target.checked)}
                role="switch"
                disabled={uploading}
              />
              <span className="admin-toggle-track" aria-hidden="true" />
            </label>
          </div>

          {error && <p className="admin-error" role="alert">{error}</p>}
        </div>

        <footer className="hero-editor-footer">
          <span><Icon name="check" />{uploading ? 'Uploading to R2' : 'Direct database save'}</span>
          <div>
            <button className="admin-button secondary" type="button" disabled={uploading} onClick={close}>Cancel</button>
            <button className="admin-button primary" type="submit" disabled={uploading}>{product ? 'Save changes' : 'Add product'}</button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}
