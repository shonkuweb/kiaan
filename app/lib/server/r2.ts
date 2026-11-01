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
  const { client, bucket } = r2Config();
  try {
    const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: heroKey }));
    const hero = JSON.parse(await response.Body!.transformToString());
    if (typeof hero.title !== 'string' || typeof hero.subtitle !== 'string' || typeof hero.imageUrl !== 'string') throw new Error('Invalid saved banner.');
    return hero;
  } catch (error) {
    if (error instanceof Error && error.name === 'NoSuchKey') return defaultHero;
    throw error;
  }
}
export async function writeHero(hero: HeroBanner) {
  const { client, bucket } = r2Config();
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: heroKey, Body: JSON.stringify(hero), ContentType: 'application/json', CacheControl: 'no-store' }));
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
