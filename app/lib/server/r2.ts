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
// Until administrator sign-in is connected, writes are limited to local development.
// Never expose a credential-backed upload endpoint anonymously in production.
export function checkLocalAdmin(request: Request): Response | null {
  const requestHost = request.headers.get('host') || '';
  const host = new URL(`http://${requestHost || 'invalid'}`).hostname;
  const origin = request.headers.get('origin');
  let originUrl: URL;
  try { originUrl = new URL(origin || ''); } catch { return Response.json({ error: 'Please upload from the admin panel.' }, { status: 403 }); }
  if (process.env.NODE_ENV !== 'development' || !['localhost', '127.0.0.1', '[::1]'].includes(host)) return Response.json({ error: 'Admin changes are available in local development until admin sign-in is configured.' }, { status: 403 });
  if (!['http:', 'https:'].includes(originUrl.protocol) || originUrl.host !== requestHost) return Response.json({ error: 'Please upload from the admin panel.' }, { status: 403 });
  return null;
}
