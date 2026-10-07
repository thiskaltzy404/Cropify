export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const BASE = 'https://lrclib.net/api';
const H = { 'User-Agent': 'Cropify/1.0 (learning project)' };

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const title = sp.get('title') ?? '';
  const artist = sp.get('artist') ?? '';
  const duration = sp.get('duration') ?? '';
  try {
    const p = new URLSearchParams({ track_name: title, artist_name: artist });
    if (duration && duration !== '0') p.set('duration', String(Math.round(Number(duration))));
    const r = await fetch(`${BASE}/get?${p}`, { headers: H });
    let j: any = r.ok ? await r.json() : null;
    if (!j?.syncedLyrics) {
      const s = await fetch(`${BASE}/search?${new URLSearchParams({ q: `${title} ${artist}` })}`, { headers: H });
      const arr: any[] = s.ok ? await s.json() : [];
      j = arr.find((x) => x.syncedLyrics) ?? null;
    }
    return Response.json({ lrc: j?.syncedLyrics ?? null }, { headers: { 'Cache-Control': 's-maxage=86400' } });
  } catch {
    return Response.json({ lrc: null });
  }
}
