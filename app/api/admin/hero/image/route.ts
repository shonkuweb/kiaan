import path from 'node:path';
import fs from 'node:fs';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { checkLocalAdmin, r2Config } from '../../../../lib/server/r2';
export const runtime = 'nodejs';
const maxBytes = 8 * 1024 * 1024;
export async function POST(request: Request) {
  const denied = checkLocalAdmin(request);
  if (denied) return denied;
  if (Number(request.headers.get('content-length')) > maxBytes + 65536) return Response.json({ error: 'Choose an image smaller than 8 MB.' }, { status: 413 });
  try {
    // Bound the incoming stream before parsing multipart data.
    const reader = request.body?.getReader();
    if (!reader) return Response.json({ error: 'Choose an image to upload.' }, { status: 400 });
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length;
      if (size > maxBytes + 65536) { await reader.cancel(); return Response.json({ error: 'Choose an image smaller than 8 MB.' }, { status: 413 }); }
      chunks.push(value);
    }
    const form = await new Response(Buffer.concat(chunks), { headers: { 'Content-Type': request.headers.get('content-type') || '' } }).formData();
    const file = form.get('image');
    if (!(file instanceof File) || file.size === 0 || file.size > maxBytes) return Response.json({ error: 'Choose a JPG, PNG or WebP image smaller than 8 MB.' }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const type = bytes.subarray(0, 3).equals(Buffer.from([0xff,0xd8,0xff])) ? 'jpeg' : bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'png' : bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP' ? 'webp' : null;
    if (!type || file.type !== `image/${type}`) return Response.json({ error: 'This file is not a supported image. Choose JPG, PNG or WebP.' }, { status: 400 });

    let uploadUrl = '';
    try {
      const { client, bucket, publicUrl } = r2Config();
      const key = `kiaan/hero/${crypto.randomUUID()}.${type}`;
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: `image/${type}`, CacheControl: 'public, max-age=31536000, immutable' }));
      uploadUrl = `${publicUrl}/${key}`;
    } catch {
      const filename = `hero-${crypto.randomUUID()}.${type}`;
      const uploadsDir = path.join(process.cwd(), 'public', 'images');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      fs.writeFileSync(path.join(uploadsDir, filename), bytes);
      uploadUrl = `/images/${filename}`;
    }

    return Response.json({ url: uploadUrl, name: file.name });
  } catch { return Response.json({ error: 'Image upload failed. Please try again.' }, { status: 502 }); }
}
