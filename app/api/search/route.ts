import { Innertube } from 'youtubei.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

let yt: Promise<Innertube> | null = null;
const client = () => (yt ??= Innertube.create({ generate_session_locally: true }));

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q')?.trim();
  if (!q) return Response.json({ tracks: [] });
  try {
    const y = await client();
    const r: any = await y.music.search(q, { type: 'song' });
    const items: any[] = (r.contents ?? []).flatMap((s: any) => s.contents ?? []);
    const tracks = items
      .filter((i) => i?.id)
      .map((i) => ({
        id: i.id as string,
        title: (i.title ?? i.name ?? '') as string,
        artist: ((i.artists ?? []).map((a: any) => a.name).join(', ') || i.author?.name || '') as string,
        thumb: (i.thumbnails?.[i.thumbnails.length - 1]?.url ?? '') as string,
        duration: (i.duration?.seconds ?? 0) as number,
      }))
      .slice(0, 20);
    return Response.json({ tracks }, { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' } });
  } catch (e) {
    yt = null;
    return Response.json({ tracks: [], error: 'search_failed' }, { status: 502 });
  }
}
