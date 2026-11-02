import { checkLocalAdmin, readHero, writeHero } from '../../../lib/server/r2';
export const runtime = 'nodejs';
export async function GET() {
  try {
    const hero = await readHero();
    return Response.json(hero, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Could not load the hero banner. Please try again.' }, { status: 502 });
  }
}
export async function PUT(request: Request) {
  const denied = checkLocalAdmin(request);
  if (denied) return denied;
  if (Number(request.headers.get('content-length')) > 32768) {
    return Response.json({ error: 'Banner data is too long.' }, { status: 413 });
  }
  try {
    const body = await request.json();
    if (
      typeof body.title !== 'string' ||
      !body.title.trim() ||
      body.title.trim().length > 100 ||
      typeof body.subtitle !== 'string' ||
      !body.subtitle.trim() ||
      body.subtitle.trim().length > 240
    ) {
      return Response.json(
        { error: 'Enter a heading (up to 100 characters) and description (up to 240 characters).' },
        { status: 400 }
      );
    }

    const images: string[] = [];
    if (Array.isArray(body.images) && body.images.length > 0) {
      for (const img of body.images) {
        if (typeof img === 'string' && img.trim()) {
          images.push(img.trim());
        }
      }
    } else if (typeof body.imageUrl === 'string' && body.imageUrl.trim()) {
      images.push(body.imageUrl.trim());
    }

    if (images.length === 0 || images.length > 3) {
      return Response.json({ error: 'Please choose between 1 and 3 banner images.' }, { status: 400 });
    }

    const hero = {
      title: body.title.trim(),
      subtitle: body.subtitle.trim(),
      imageUrl: images[0],
      images: images.slice(0, 3),
    };
    const saved = await writeHero(hero);
    return Response.json(saved);
  } catch {
    return Response.json({ error: 'Could not save the banner. Your current banner has not changed.' }, { status: 502 });
  }
}
