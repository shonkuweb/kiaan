import { checkLocalAdmin, r2Config, readHero, writeHero } from '../../../lib/server/r2';
export const runtime = 'nodejs';
export async function GET() {
  try { return Response.json(await readHero(), { headers: { 'Cache-Control': 'no-store' } }); }
  catch { return Response.json({ error: 'Could not load the hero banner from R2. Please try again.' }, { status: 502 }); }
}
export async function PUT(request: Request) {
  const denied = checkLocalAdmin(request);
  if (denied) return denied;
  if (Number(request.headers.get('content-length')) > 4096) return Response.json({ error: 'Banner text is too long.' }, { status: 413 });
  try {
    const body = await request.json();
    if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 100 || typeof body.subtitle !== 'string' || !body.subtitle.trim() || body.subtitle.trim().length > 240 || typeof body.imageUrl !== 'string') return Response.json({ error: 'Enter a heading (up to 100 characters) and description (up to 240 characters).' }, { status: 400 });
    const { publicUrl } = r2Config();
    if (body.imageUrl !== '/images/hero-flower.webp' && !body.imageUrl.startsWith(`${publicUrl}/kiaan/hero/`)) return Response.json({ error: 'Please upload a banner image first.' }, { status: 400 });
    const hero = { title: body.title.trim(), subtitle: body.subtitle.trim(), imageUrl: body.imageUrl };
    await writeHero(hero);
    return Response.json(hero);
  } catch { return Response.json({ error: 'Could not save the banner to R2. Your current banner has not changed.' }, { status: 502 }); }
}
