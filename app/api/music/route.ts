import { Innertube } from 'youtubei.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

let yt: Promise<Innertube> | null = null;
const client = () => (yt ??= Innertube.create({ generate_session_locally: true }));

const txt = (x: any): string => (!x ? '' : typeof x === 'string' ? x : x.text ?? String(x));
const best = (a: any): string => {
  const arr = Array.isArray(a) ? a : a?.contents;
  return arr?.length ? arr[arr.length - 1]?.url ?? '' : '';
};
const who = (i: any, fb = ''): string => (i.artists ?? []).map((a: any) => a.name).join(', ') || fb;
const cache = { 'Cache-Control': 's-maxage=1800, stale-while-revalidate' };

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const kind = sp.get('kind');
  const id = sp.get('id') ?? '';
  const q = sp.get('q')?.trim() ?? '';
  try {
    const y = await client();

    if (kind === 'artists') {
      if (!q) return Response.json({ artists: [] });
      const r: any = await y.music.search(q, { type: 'artist' });
      const items: any[] = (r.contents ?? []).flatMap((s: any) => s.contents ?? []);
      const artists = items
        .filter((i) => i?.id && (i.item_type === 'artist' || String(i.id).startsWith('UC')))
        .map((i) => ({ id: i.id as string, name: txt(i.name ?? i.title), thumb: best(i.thumbnails) }))
        .slice(0, 10);
      return Response.json({ artists }, { headers: cache });
    }

    if (kind === 'artist') {
      const a: any = await y.music.getArtist(id);
      const h: any = a.header;
      const name = txt(h?.title);
      const songs: any[] = [];
      const sections: any[] = [];
      for (const s of a.sections ?? []) {
        if (s.type === 'MusicShelf') {
          if (!songs.length) {
            for (const i of s.contents ?? []) {
              if (i?.id) songs.push({ id: i.id, title: txt(i.title ?? i.name), artist: who(i, name), thumb: best(i.thumbnails), duration: i.duration?.seconds ?? 0 });
            }
          }
        } else if (s.type === 'MusicCarouselShelf') {
          const items = (s.contents ?? [])
            .map((i: any) => ({
              id: i.id ?? i.endpoint?.payload?.browseId ?? i.endpoint?.payload?.videoId,
              title: txt(i.title ?? i.name),
              sub: txt(i.subtitle) || who(i),
              thumb: best(i.thumbnail) || best(i.thumbnails),
              kind: i.item_type ?? '',
            }))
            .filter((x: any) => x.id && x.title);
          if (items.length) sections.push({ title: txt(s.header?.title), items });
        }
      }
      return Response.json({ name, description: txt(h?.description), thumb: best(h?.thumbnails) || best(h?.foreground_thumbnails) || best(h?.thumbnail), songs, sections }, { headers: cache });
    }

    if (kind === 'album') {
      const a: any = id.startsWith('MPRE') ? await y.music.getAlbum(id) : await y.music.getPlaylist(id);
      const h: any = a.header;
      const thumb = best(h?.thumbnails);
      const owner = h?.author?.name ?? '';
      const list: any[] = a.contents ?? a.items ?? [];
      const tracks = list
        .filter((i) => i?.id)
        .map((i) => ({ id: i.id as string, title: txt(i.title ?? i.name), artist: who(i, owner), thumb: best(i.thumbnails) || thumb, duration: i.duration?.seconds ?? 0 }));
      return Response.json({ title: txt(h?.title), subtitle: txt(h?.subtitle), thumb, tracks }, { headers: cache });
    }

    return Response.json({ error: 'bad_request' }, { status: 400 });
  } catch (e) {
    yt = null;
    return Response.json({ error: 'failed', message: String(e) }, { status: 502 });
  }
        }
