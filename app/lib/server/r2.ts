import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { defaultHero, type HeroBanner } from '../hero';

const heroKey = 'kiaan/settings/hero.json';
export function r2Config() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) throw new Error('R2 is not configured.');
  return {
    bucket: R2_BUCKET_NAME, publicUrl: R2_PUBLIC_URL.replace(/\/$/, ''),
    client: new S3Client({ region: 'auto', endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY }, forcePathStyle: true, requestChecksumCalculation: 'WHEN_REQUIRED', maxAttempts: 2 }),
  };
}
export async function readHero(): Promise<HeroBanner> {
  try {
    const { client, bucket } = r2Config();
    const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: heroKey }));
    const hero = JSON.parse(await response.Body!.transformToString());
    if (typeof hero.title === 'string' && typeof hero.subtitle === 'string') {
      const images: string[] = Array.isArray(hero.images) && hero.images.length > 0
        ? hero.images.slice(0, 3)
        : (hero.imageUrl ? [hero.imageUrl] : (defaultHero.images || [defaultHero.imageUrl]));
      return {
        title: hero.title,
        subtitle: hero.subtitle,
        imageUrl: images[0] || defaultHero.imageUrl,
        images,
      };
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'NoSuchKey') return defaultHero;
  }

  // SQLite fallback if R2 is unavailable
  try {
    const { getDatabase } = await import('./db');
    const db = getDatabase();
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('hero_banner') as { value: string } | undefined;
    if (row && row.value) {
      const hero = JSON.parse(row.value);
      if (typeof hero.title === 'string' && typeof hero.subtitle === 'string') {
        const images: string[] = Array.isArray(hero.images) && hero.images.length > 0
          ? hero.images.slice(0, 3)
          : (hero.imageUrl ? [hero.imageUrl] : (defaultHero.images || [defaultHero.imageUrl]));
        return {
          title: hero.title,
          subtitle: hero.subtitle,
          imageUrl: images[0] || defaultHero.imageUrl,
          images,
        };
      }
    }
  } catch {
    // ignore db error
  }

  return defaultHero;
}
export async function writeHero(hero: HeroBanner): Promise<HeroBanner> {
  const images = Array.isArray(hero.images) && hero.images.length > 0
    ? hero.images.slice(0, 3)
    : [hero.imageUrl || defaultHero.imageUrl];
  const payload: HeroBanner = {
    title: hero.title.trim(),
    subtitle: hero.subtitle.trim(),
    imageUrl: images[0],
    images,
  };

  // Save to SQLite
  try {
    const { getDatabase } = await import('./db');
    const db = getDatabase();
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(
      'hero_banner',
      JSON.stringify(payload)
    );
  } catch {
    // ignore db error
  }

  // Save to R2 if configured
  try {
    const { client, bucket } = r2Config();
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: heroKey, Body: JSON.stringify(payload), ContentType: 'application/json', CacheControl: 'no-store' }));
  } catch {
    // ignore R2 error if local DB succeeded
  }

  return payload;
}
export function checkLocalAdmin(request: Request): Response | null {
  // Verify admin session cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const hasAdminCookie =
    /(?:^|;\s*)kiaan_admin_session=authenticated(?:\s*;|$)/.test(cookieHeader) ||
    cookieHeader.includes('kiaan_admin_session=authenticated');

  const requestHost =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    '';
  const host = requestHost.split(':')[0].toLowerCase();
  const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(host);
  const isDev = process.env.NODE_ENV === 'development';

  // Allow authenticated admin, or local development on localhost
  if (!hasAdminCookie && !(isDev && isLocalhost)) {
    return Response.json(
      { error: 'Admin session expired or unauthorized. Please sign in to the admin panel.' },
      { status: 401 }
    );
  }

  // Origin validation when Origin header is present
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (!['http:', 'https:'].includes(originUrl.protocol)) {
        return Response.json({ error: 'Please submit from the admin panel.' }, { status: 403 });
      }
      const originHost = originUrl.hostname.toLowerCase();
      // Allow matching host or internal/localhost proxy origins
      if (
        host &&
        originHost !== host &&
        !['localhost', '127.0.0.1', '[::1]'].includes(host) &&
        !['localhost', '127.0.0.1', '[::1]'].includes(originHost)
      ) {
        return Response.json({ error: 'Cross-origin request rejected. Please use the admin panel.' }, { status: 403 });
      }
    } catch {
      return Response.json({ error: 'Please submit from the admin panel.' }, { status: 403 });
    }
  }

  return null;
}
