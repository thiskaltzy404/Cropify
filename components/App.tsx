'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import YouTube from 'react-youtube';
import { Capacitor } from '@capacitor/core';
import { MediaSession as NativeMS } from '@jofr/capacitor-media-session';
import { Ic } from '../lib/icons';

type T = { id: string; title: string; artist: string; thumb: string; duration: number };
type Ln = { t: number; s: string };
type Cat = { t: string; q: string; h: number; i: string };
type Ar = { id: string; name: string; thumb: string };
type Sub = { type: 'artist' | 'album'; id: string; name?: string };

const URL_ = 'https://saweria.co/thiskaltzy404';
const NAV: [string, string][] = [['home', 'Beranda'], ['search', 'Cari'], ['lib', 'Pustaka'], ['coffee', 'Traktir']];
const CHIPS: [string, string][] = [
  ['Semua', 'lagu indonesia populer'], ['Rilis Baru', 'rilis lagu terbaru 2026'],
  ['Trending', 'trending music indonesia'], ['Santai', 'lagu santai'], ['Fokus', 'lofi study'],
];
const PERKS: [string, string, string][] = [
  ['block', 'Tanpa iklan, selamanya', 'Dengarkan tanpa gangguan'],
  ['spark', 'Fitur baru rutin', 'Dukunganmu jadi semangat update'],
  ['server', 'Biaya server & domain', 'Supaya Cropify tetap online'],
];
const TR: Record<string, string> = {
  Songs: 'Lagu teratas', Albums: 'Album', Singles: 'Single & EP', 'Singles & EPs': 'Single & EP',
  Videos: 'Video', 'Live performances': 'Pertunjukan langsung', 'Featured on': 'Termasuk di',
  'Fans might also like': 'Penggemar mungkin juga suka', Playlists: 'Playlist',
};

const C = (t: string, q: string, h: number, i: string): Cat => ({ t, q, h, i });
const CI: Record<string, string> = {
  wave: '<path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0M2 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  moon: '<path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z"/>',
  heart: '<path d="M12 20s-8-4.7-9-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-1 5.3-9 10-9 10z"/>',
  road: '<path d="M8 3L5 21M16 3l3 18M12 4v3M12 11v3M12 18v3"/>',
  disco: '<circle cx="12" cy="13" r="8"/><path d="M4 13h16M12 5v16M7 7.5c3 2 7 2 10 0M7 18.5c3-2 7-2 10 0"/>',
  note: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  guitar: '<path d="M20 4l-6 6M18 2l4 4M11 9a4 4 0 0 0-4 4v1a3 3 0 1 0 3 3h1a4 4 0 0 0 4-4 4 4 0 0 0-4-4z"/>',
  leaf: '<path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15zM5 19l8-8"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  piano: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 5v8M12 5v8M16 5v8"/>',
  flame: '<path d="M12 22a6 6 0 0 0 6-6c0-4-3-6-4-10-3 2-4 5-4 7-1-1-2-2-2-4-2 2-2 4-2 7a6 6 0 0 0 6 6z"/>',
  vinyl: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',
  drum: '<ellipse cx="12" cy="7" rx="8" ry="3"/><path d="M4 7v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7M9 10l-2 8M15 10l2 8"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  shuffle: '<path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3"/>',
};
const GROUPS: { title: string; cats: Cat[] }[] = [
  { title: 'Suasana', cats: [C('Santai', 'lagu santai indonesia', 190, 'wave'), C('Galau', 'lagu galau indonesia', 265, 'drop'), C('Semangat', 'lagu semangat pagi', 22, 'bolt'), C('Fokus', 'lofi study focus', 150, 'target'), C('Tidur', 'lagu pengantar tidur', 235, 'moon'), C('Romantis', 'lagu romantis indonesia', 335, 'heart'), C('Perjalanan', 'lagu perjalanan road trip', 42, 'road'), C('Pesta', 'lagu pesta dance', 300, 'disco')] },
  { title: 'Genre', cats: [C('Pop', 'pop indonesia terbaru', 320, 'note'), C('Rock', 'rock indonesia', 8, 'guitar'), C('Indie', 'indie indonesia', 165, 'leaf'), C('Hip Hop', 'hip hop indonesia', 45, 'mic'), C('Jazz', 'jazz santai', 255, 'piano'), C('Akustik', 'akustik indonesia', 30, 'guitar'), C('EDM', 'edm remix', 280, 'bolt'), C('Metal', 'metal', 0, 'flame'), C('Reggae', 'reggae indonesia', 120, 'leaf'), C('R&B', 'rnb soul', 350, 'vinyl')] },
  { title: 'Khas Indonesia', cats: [C('Dangdut', 'dangdut terbaru', 340, 'drum'), C('Koplo', 'dangdut koplo', 14, 'drum'), C('Campursari', 'campursari', 35, 'vinyl'), C('Keroncong', 'keroncong', 200, 'piano'), C('Lagu Daerah', 'lagu daerah', 150, 'globe'), C('Religi', 'lagu religi islami', 170, 'moon')] },
  { title: 'Era', cats: [C('80-an', 'lagu 80an indonesia', 300, 'clock'), C('90-an', 'lagu 90an indonesia', 20, 'clock'), C('2000-an', 'lagu 2000an indonesia', 210, 'clock'), C('2010-an', 'lagu hits 2010an indonesia', 100, 'clock')] },
  { title: 'Dunia', cats: [C('K-Pop', 'kpop', 330, 'star'), C('J-Pop', 'jpop anime', 280, 'star'), C('Latin', 'latin pop', 25, 'disco'), C('Barat', 'top hits english', 215, 'globe'), C('Melayu', 'pop melayu', 160, 'note')] },
];
const TREN = ['Pop Indonesia', 'Dangdut koplo', 'Lofi', 'Akustik', 'Indie Indonesia', 'Dj remix', 'Religi'];

const fm = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const hue = (id: string) => [...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
const greet = (): [string, string] => {
  const h = new Date().getHours();
  return h < 11 ? ['pagi', 'sun'] : h < 15 ? ['siang', 'sun'] : h < 18 ? ['sore', 'sunset'] : ['malam', 'moon'];
};
const api = async (u: string): Promise<any> => {
  try { return await (await fetch(u)).json(); } catch { return {}; }
};
function parseLrc(x: string): Ln[] {
  const out: Ln[] = [];
  for (const l of x.split('\n')) {
    const m = l.match(/^\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)$/);
    if (m && m[3].trim()) out.push({ t: +m[1] * 60 + +m[2], s: m[3].trim() });
  }
  return out;
}
function useLS<S>(k: string, d: S): [S, (v: S) => void] {
  const [v, setV] = useState<S>(d);
  useEffect(() => { try { const x = localStorage.getItem(k); if (x) setV(JSON.parse(x)); } catch {} }, [k]);
  return [v, (n: S) => { setV(n); try { localStorage.setItem(k, JSON.stringify(n)); } catch {} }];
}
const Th = ({ t }: { t?: T }) => <img src={t?.thumb || '/logo.png'} alt="" loading="lazy" />;
const cover = (u?: string, s = 400) => (u ? u.replace(/=w\d+-h\d+.*$/, `=w${s}-h${s}-l90-rj`) : '/logo.png');
const asT = (it: any, who = ''): T => ({ id: it.id, title: it.title, artist: it.sub || who, thumb: it.thumb || '', duration: it.duration || 0 });
const Rp = ({ one }: { one: boolean }) => (
  <svg className="i" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: '<path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>' + (one ? '<path d="M11.5 10l1.5-1v6"/>' : '') }} />
);
function silentUrl() {
  const n = 8000, b = new ArrayBuffer(44 + n), v = new DataView(b);
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  w(36, 'data'); v.setUint32(40, n, true);
  new Uint8Array(b).fill(128, 44);
  return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
}
const EXTRA_CSS = `
.qs{position:absolute;left:0;right:0;bottom:0;top:20%;z-index:3;background:#17131ff2;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-radius:26px 26px 0 0;padding:18px 18px 24px;overflow-y:auto;transform:translateY(105%);transition:transform .5s cubic-bezier(.65,0,.2,1)}
.qs.o{transform:none}
.qh{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:18px;margin-bottom:10px}
.ct button.on2,.nh button.on2{color:var(--ac)}
.nr{display:flex;gap:14px;align-items:center}
`;

export default function App() {
  const [view, setView] = useState(0);
  const [chip, setChip] = useState(0);
  const [lf, setLf] = useState(0);
  const [g, setG] = useState<[string, string]>(['pagi', 'sun']);
  const [home, setHome] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<Cat | null>(null);
  const [recent, setRecent] = useLS<string[]>('cropify:recent', []);
  const [rows, setRows] = useState<{ title: string; tracks: T[] }[]>([]);
  const [q, setQ] = useState('');
  const [res, setRes] = useState<T[]>([]);
  const [searching, setSearching] = useState(false);
  const [queue, setQueue] = useState<T[]>([]);
  const [qi, setQi] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [open, setOpen] = useState(false);
  const [arts, setArts] = useState<Ar[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [subData, setSubData] = useState<any>(null);
  const sub = subs[subs.length - 1];
  const [showQ, setShowQ] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(0); // 0 = mati, 1 = ulang semua, 2 = ulang satu lagu
  const [lrc, setLrc] = useState<Ln[]>([]);
  const [liked, setLiked] = useLS<T[]>('cropify:liked', []);
  const [hist, setHist] = useLS<T[]>('cropify:hist', []);
  const pl = useRef<any>(null);
  const stack = useRef<number[]>([]);
  const want = useRef(false);
  const sil = useRef<HTMLAudioElement | null>(null);
  const stepRef = useRef<(d: number) => void>(() => {});
  const cur: T | undefined = queue[qi];

  useEffect(() => setG(greet()), []);

  // Anti salin: matikan klik kanan, salin, seret, dan pintasan developer tools
  useEffect(() => {
    const stop = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.('input,textarea')) return;
      e.preventDefault();
    };
    const block = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && ['s', 'u', 'p'].includes(k)) || ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(k))) e.preventDefault();
    };
    const evs = ['contextmenu', 'copy', 'cut', 'dragstart', 'selectstart'];
    evs.forEach((n) => document.addEventListener(n, stop));
    document.addEventListener('keydown', block);
    return () => { evs.forEach((n) => document.removeEventListener(n, stop)); document.removeEventListener('keydown', block); };
  }, []);

  // Pemutaran latar belakang: audio senyap + lanjutkan otomatis saat halaman tersembunyi
  useEffect(() => {
    const a = new Audio(silentUrl());
    a.loop = true;
    sil.current = a;
    const onVis = () => { if (want.current) setTimeout(() => pl.current?.playVideo?.(), 300); };
    document.addEventListener('visibilitychange', onVis);
    return () => { document.removeEventListener('visibilitychange', onVis); a.pause(); };
  }, []);
  useEffect(() => { if (cur) want.current = true; }, [cur?.id]);
  useEffect(() => {
    const a = sil.current;
    if (a) { if (playing) a.play().catch(() => {}); else a.pause(); }
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  }, [playing]);

  // Mode latar belakang native (hanya aktif di dalam APK)
  useEffect(() => {
    const bm = (window as any).Capacitor?.Plugins?.BackgroundMode;
    if (!bm || !cur) return;
    (async () => {
      try {
        await bm.requestNotificationsPermission?.();
        await bm.enable?.({ title: 'Cropify', text: 'Musik sedang diputar', silent: true });
        await bm.disableWebViewOptimizations?.();
      } catch {}
    })();
  }, [cur?.id]);

  // Notifikasi media native (hanya aktif di dalam APK)
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !cur) return;
    const ms: any = NativeMS;
    try {
      ms.setMetadata({ title: cur.title, artist: cur.artist, artwork: [{ src: cur.thumb || 'https://cropifymusic.vercel.app/logo.png', sizes: '512x512', type: 'image/jpeg' }] });
      ms.setActionHandler({ action: 'play' }, () => { want.current = true; pl.current?.playVideo(); });
      ms.setActionHandler({ action: 'pause' }, () => { want.current = false; pl.current?.pauseVideo(); });
      ms.setActionHandler({ action: 'nexttrack' }, () => stepRef.current(1));
      ms.setActionHandler({ action: 'previoustrack' }, () => stepRef.current(-1));
    } catch {}
  }, [cur?.id]);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    try { (NativeMS as any).setPlaybackState({ playbackState: playing ? 'playing' : 'paused' }); } catch {}
  }, [playing]);
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !dur) return;
    try { (NativeMS as any).setPositionState({ duration: dur, position: Math.min(time, dur), playbackRate: 1 }); } catch {}
  }, [Math.floor(time / 5), dur]);

  // Beranda: lagu sesuai chip
  useEffect(() => {
    let ok = true;
    setLoading(true);
    api('/api/search?q=' + encodeURIComponent(CHIPS[chip][1])).then((d) => {
      if (ok) { setHome(d.tracks || []); setLoading(false); }
    });
    return () => { ok = false; };
  }, [chip]);

  // Beranda: baris kartu tambahan
  useEffect(() => {
    let ok = true;
    const defs: [string, string][] = [
      ['Lagu galau pilihan', 'lagu galau indonesia'],
      ['Pop Indonesia terbaru', 'pop indonesia terbaru'],
      ['Santai untuk fokus', 'lofi chill indonesia'],
    ];
    Promise.all(defs.map((d) => api('/api/search?q=' + encodeURIComponent(d[1])))).then((rs) => {
      if (ok) setRows(defs.map((d, i) => ({ title: d[0], tracks: rs[i].tracks || [] })).filter((r) => r.tracks.length));
    });
    return () => { ok = false; };
  }, []);

  // Cari lagu (debounce)
  useEffect(() => {
    if (!q.trim()) { setRes([]); setSearching(false); return; }
    setSearching(true);
    const id = setTimeout(async () => {
      const d = await api('/api/search?q=' + encodeURIComponent(q));
      setRes(d.tracks || []);
      setSearching(false);
    }, 450);
    return () => clearTimeout(id);
  }, [q]);

  // Cari artis (debounce)
  useEffect(() => {
    if (!q.trim() || cat) { setArts([]); return; }
    const id = setTimeout(async () => {
      const d = await api('/api/music?kind=artists&q=' + encodeURIComponent(q));
      setArts(d.artists || []);
    }, 500);
    return () => clearTimeout(id);
  }, [q, cat]);

  // Halaman artis / album
  useEffect(() => {
    setSubData(null);
    if (!sub) return;
    let ok = true;
    api(`/api/music?kind=${sub.type}&id=${encodeURIComponent(sub.id)}`).then((d) => {
      if (ok) setSubData(!d || d.error ? { error: true, _id: sub.id } : { ...d, _id: sub.id });
    });
    return () => { ok = false; };
  }, [sub?.id, sub?.type]);

  // Lirik tersinkron
  useEffect(() => {
    setLrc([]);
    if (!cur) return;
    let ok = true;
    const p = new URLSearchParams({ title: cur.title, artist: cur.artist.split(',')[0], duration: String(cur.duration || '') });
    api('/api/lyrics?' + p).then((d) => { if (ok && d.lrc) setLrc(parseLrc(d.lrc)); });
    return () => { ok = false; };
  }, [cur?.id]);

  // Sinkronkan waktu dari player YouTube
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const p = pl.current;
      if (p?.getCurrentTime) {
        setTime(p.getCurrentTime());
        const d = p.getDuration?.();
        if (d) setDur(d);
      }
    }, 250);
    return () => clearInterval(id);
  }, [playing]);

  const kick = () => { want.current = true; sil.current?.play().catch(() => {}); };
  const play = (list: T[], i: number) => {
    const t = list[i];
    if (!t) return;
    kick();
    stack.current = [];
    setQueue(list); setQi(i); setPlaying(true); setTime(0); setDur(t.duration);
    setHist([t, ...hist.filter((x) => x.id !== t.id)].slice(0, 30));
  };
  const jump = (n: number) => { kick(); setQi(n); setTime(0); setPlaying(true); setDur(queue[n].duration); };
  const step = useCallback((d: number) => {
    if (!queue.length) return;
    let n: number;
    if (shuffle && queue.length > 1) {
      if (d < 0 && stack.current.length) {
        n = stack.current.pop() as number;
      } else {
        stack.current.push(qi);
        do { n = Math.floor(Math.random() * queue.length); } while (n === qi);
      }
    } else {
      n = (qi + d + queue.length) % queue.length;
    }
    if (n === qi) { pl.current?.seekTo(0, true); pl.current?.playVideo(); return; }
    setQi(n); setTime(0); setPlaying(true); setDur(queue[n].duration);
  }, [queue, qi, shuffle]);
  stepRef.current = step;
  const ended = () => {
    if (repeat === 2) { pl.current?.seekTo(0, true); pl.current?.playVideo(); return; }
    if (repeat === 0 && !shuffle && qi === queue.length - 1) { want.current = false; setPlaying(false); setTime(0); return; }
    step(1);
  };
  const toggle = () => {
    const p = pl.current;
    if (!p) return;
    if (playing) { want.current = false; p.pauseVideo(); } else { kick(); p.playVideo(); }
  };
  const seek = (s: number) => { pl.current?.seekTo(s, true); setTime(s); };
  const isL = (t?: T) => !!t && liked.some((x) => x.id === t.id);
  const like = (t: T) => setLiked(isL(t) ? liked.filter((x) => x.id !== t.id) : [t, ...liked]);
  const openCat = (c: Cat) => { setCat(c); setQ(c.q); };
  const closeSearch = () => { setCat(null); setQ(''); };
  const saveRecent = (s: string) => {
    const v = s.trim();
    if (v.length < 2 || cat) return;
    setRecent([v, ...recent.filter((x) => x.toLowerCase() !== v.toLowerCase())].slice(0, 8));
  };
  const openSub = (s: Sub) => setSubs([...subs, s]);
  const playList = (list: T[], shuf: boolean) => {
    if (!list.length) return;
    const l = shuf ? [...list].sort(() => Math.random() - 0.5) : list;
    setShuffle(shuf); play(l, 0); setOpen(true);
  };

  // Kontrol di notifikasi / layar kunci (browser)
  useEffect(() => {
    if (!cur || !('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    ms.metadata = new MediaMetadata({ title: cur.title, artist: cur.artist, artwork: [{ src: cur.thumb || '/logo.png', sizes: '512x512' }] });
    ms.setActionHandler('play', () => { want.current = true; pl.current?.playVideo(); });
    ms.setActionHandler('pause', () => { want.current = false; pl.current?.pauseVideo(); });
    ms.setActionHandler('nexttrack', () => step(1));
    ms.setActionHandler('previoustrack', () => step(-1));
  }, [cur, step]);

  const row = (t: T, list: T[], i: number) => (
    <div key={t.id} role="button" className={'row rise ' + (cur?.id === t.id && playing ? 'cur' : '')}
      style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }} onClick={() => { play(list, i); setOpen(true); }}>
      <div className="th"><Th t={t} /></div>
      <div className="m"><b>{t.title}</b><span>{t.artist}{t.duration ? ` • ${fm(t.duration)}` : ''}</span></div>
      <button className={'rp ' + (isL(t) ? 'like' : '')} onClick={(e) => { e.stopPropagation(); like(t); }}><Ic n="heart" /></button>
    </div>
  );

  let ai = -1;
  for (let k = 0; k < lrc.length; k++) { if (lrc[k].t <= time + 0.3) ai = k; else break; }
  const pct = dur ? Math.min(100, (time / dur) * 100) : 0;

  return (
    <div id="app">
      <style>{EXTRA_CSS}</style>
      <div className="blob b1" /><div className="blob b2" />

      <div aria-hidden style={{ position: 'fixed', left: -9999, top: 0, width: 200, height: 200, pointerEvents: 'none' }}>
        {cur && (
          <YouTube videoId={cur.id}
            opts={{ width: '200', height: '200', playerVars: { autoplay: 1, playsinline: 1, controls: 0 } }}
            onReady={(e: any) => { pl.current = e.target; }}
            onStateChange={(e: any) => {
              if (e.data === 1) { want.current = true; setPlaying(true); }
              else if (e.data === 2) { if (want.current && document.hidden) e.target.playVideo(); else setPlaying(false); }
              else if (e.data === 0) ended();
            }} />
        )}
      </div>

      {view === 0 && (
        <div className="view" key="v0">
          <div className="top">
            <div className="av"><img src="/logo.png" alt="Cropify" /></div>
            <div className="brand">Cropify</div>
            <button className="ib" onClick={() => setView(1)}><Ic n="search" /></button>
          </div>
          <h1 className="rise">Hi, Selamat {g[0]} <span className="hot"><Ic n={g[1]} /></span></h1>
          <div className="sub rise" style={{ animationDelay: '.08s' }}>Halo, <b>KALTZY404</b> • mau dengar apa hari ini?</div>
          <div className="chips">
            {CHIPS.map((c, i) => <button key={c[0]} className={'chip ' + (i === chip ? 'on' : '')} onClick={() => setChip(i)}>{c[0]}</button>)}
          </div>
          {loading ? <div className="er">Memuat lagu…</div> : home.length === 0 ? (
            <div className="er">Gagal memuat lagu. Coba ganti kategori atau muat ulang halaman.</div>
          ) : (<>
            <div className="qg2">
              {home.slice(0, 6).map((t, k) => (
                <button key={t.id} className="qt rise" style={{ animationDelay: `${k * 50}ms` }} onClick={() => { play(home, k); setOpen(true); }}>
                  <img src={cover(t.thumb, 200)} alt="" /><span>{t.title}</span>
                </button>
              ))}
            </div>
            {hist.length > 0 && (<>
              <h2>Baru diputar</h2>
              <div className="hs2">
                {hist.slice(0, 10).map((t, k) => (
                  <button key={t.id} className="sq" onClick={() => { play(hist, k); setOpen(true); }}>
                    <div className="sqi"><img src={cover(t.thumb, 300)} alt="" /></div>
                    <b>{t.title}</b><span>{t.artist}</span>
                  </button>
                ))}
              </div>
            </>)}
            <h2>Daftar putar harian</h2>
            {home.slice(6, 10).map((t, k) => row(t, home, k + 6))}
          </>)}
          {rows.map((r) => (
            <div key={r.title}>
              <h2>{r.title}</h2>
              <div className="hs2">
                {r.tracks.slice(0, 10).map((t, k) => (
                  <button key={t.id} className="sq lg" onClick={() => { play(r.tracks, k); setOpen(true); }}>
                    <div className="sqi"><img src={cover(t.thumb, 500)} alt="" /></div>
                    <b>{t.title}</b><span>{t.artist}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 1 && sub && (
        <div className="view" key={'s' + sub.id}>
          <div className="sh">
            <button className="ib" onClick={() => setSubs(subs.slice(0, -1))}><Ic n="down" c="bk" /></button>
            <h2 style={{ fontSize: 20, margin: 0 }}>{(subData?._id === sub.id && (subData.name || subData.title)) || sub.name || ''}</h2>
          </div>
          {!subData || subData._id !== sub.id ? <div className="er">Memuat…</div> : subData.error ? <div className="er">Gagal memuat. Coba lagi nanti.</div> : sub.type === 'artist' ? (<>
            <div className="ah rise">
              <div className="ap"><img src={cover(subData.thumb, 500)} alt="" /></div>
              <h1 className="an">{subData.name}</h1>
              {subData.description && <p className="ad">{subData.description}</p>}
              <div className="ab">
                <button className="big" onClick={() => playList(subData.songs || [], false)}><Ic n="play" /> Putar</button>
                <button className="big alt" onClick={() => playList(subData.songs || [], true)}><Ic n="shuf" /> Acak</button>
              </div>
            </div>
            {(subData.songs || []).length > 0 && (<><h2>Lagu teratas</h2>{subData.songs.slice(0, 8).map((t: T, k: number) => row(t, subData.songs, k))}</>)}
            {(subData.sections || []).map((s: any) => {
              const plist: T[] = s.items.filter((i: any) => i.kind === 'song' || i.kind === 'video').map((i: any) => asT(i, subData.name));
              return (
                <div key={s.title}>
                  <h2>{TR[s.title] || s.title}</h2>
                  <div className="hs2">
                    {s.items.map((it: any, k: number) => (
                      <button key={it.id + k} className={'sq lg' + (it.kind === 'artist' ? ' rd' : '')}
                        onClick={() => {
                          if (it.kind === 'artist') openSub({ type: 'artist', id: it.id, name: it.title });
                          else if (it.kind === 'album' || it.kind === 'playlist') openSub({ type: 'album', id: it.id, name: it.title });
                          else { const i = plist.findIndex((x) => x.id === it.id); if (i < 0) return; play(plist, i); setOpen(true); }
                        }}>
                        <div className="sqi"><img src={cover(it.thumb, 400)} alt="" /></div>
                        <b>{it.title}</b><span>{it.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </>) : (<>
            <div className="abh rise">
              <div className="ai2"><img src={cover(subData.thumb, 400)} alt="" /></div>
              <div><h2 style={{ margin: '0 0 4px', fontSize: 20 }}>{subData.title}</h2><div className="sub" style={{ margin: 0 }}>{subData.subtitle}</div></div>
            </div>
            <div className="ab">
              <button className="big" onClick={() => playList(subData.tracks || [], false)}><Ic n="play" /> Putar</button>
              <button className="big alt" onClick={() => playList(subData.tracks || [], true)}><Ic n="shuf" /> Acak</button>
            </div>
            {(subData.tracks || []).map((t: T, k: number) => row(t, subData.tracks, k))}
          </>)}
        </div>
      )}

      {view === 1 && !sub && (
        <div className="view" key="v1">
          <div className="sh">
            {q.trim() && <button className="ib" onClick={closeSearch}><Ic n="down" c="bk" /></button>}
            <h2 style={{ fontSize: 26, margin: 0 }}>{cat ? cat.t : q.trim() ? 'Hasil pencarian' : 'Cari'}</h2>
          </div>
          <div className="srch">
            <Ic n="search" />
            <input placeholder="Judul lagu, artis, atau suasana" value={cat ? '' : q}
              onChange={(e) => { setCat(null); setQ(e.target.value); }}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              onBlur={() => saveRecent(q)} />
            {q.trim() && !cat && <button className="xb" onClick={closeSearch}><svg className="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button>}
          </div>
          {q.trim() ? (<>
            {!cat && arts.length > 0 && (<>
              <h2>Artis</h2>
              <div className="arow">
                {arts.map((a) => (
                  <button key={a.id} className="ac" onClick={() => openSub({ type: 'artist', id: a.id, name: a.name })}>
                    <div className="ai"><img src={cover(a.thumb, 300)} alt="" /></div><b>{a.name}</b>
                  </button>
                ))}
              </div>
              <h2>Lagu</h2>
            </>)}
            {cat && (
              <div className="cb" style={{ '--h': cat.h } as any}>
                <svg className="i" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: CI[cat.i] }} />
                <div><b>{cat.t}</b><span>{searching ? 'Mencari lagu…' : `${res.length} lagu pilihan`}</span></div>
              </div>
            )}
            {searching ? <div className="er">Mencari…</div> : res.length ? res.map((t, k) => row(t, res, k)) : <div className="er">Tidak ditemukan</div>}
          </>) : (<>
            <button className="sur rise" onClick={() => { const all = GROUPS.flatMap((x) => x.cats); openCat(all[Math.floor(Math.random() * all.length)]); }}>
              <span className="sp"><svg className="i" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: CI.shuffle }} /></span>
              <div><b>Kejutkan aku</b><span>Pilih kategori secara acak</span></div>
            </button>
            {recent.length > 0 && (<>
              <h2>Pencarian terakhir <button className="lnk" onClick={() => setRecent([])}>Hapus</button></h2>
              <div className="chips wr">
                {recent.map((s) => <button key={s} className="chip" onClick={() => { setCat(null); setQ(s); }}>{s}</button>)}
              </div>
            </>)}
            <h2>Lagi ramai</h2>
            <div className="chips wr">
              {TREN.map((s) => <button key={s} className="chip" onClick={() => { setCat(null); setQ(s); }}>{s}</button>)}
            </div>
            {GROUPS.map((gr) => (
              <div key={gr.title}>
                <h2>{gr.title}</h2>
                <div className="cgrid">
                  {gr.cats.map((c, k) => (
                    <button key={c.t} className="cc rise" style={{ '--h': c.h, animationDelay: `${Math.min(k, 8) * 40}ms` } as any} onClick={() => openCat(c)}>
                      <svg className="i cg" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: CI[c.i] }} />
                      <b>{c.t}</b>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>)}
        </div>
      )}

      {view === 2 && (
        <div className="view" key="v2">
          <h2 style={{ fontSize: 26, margin: '6px 0 12px' }}>Pustaka</h2>
          <div className="chips">{['Semua', 'Disukai', 'Riwayat'].map((c, i) => <button key={c} className={'chip ' + (i === lf ? 'on' : '')} onClick={() => setLf(i)}>{c}</button>)}</div>
          {lf !== 2 && (<><h2>Lagu disukai</h2>{liked.length ? liked.map((t, k) => row(t, liked, k)) : <p className="sub">Tekan ikon hati pada lagu untuk menyimpannya di sini.</p>}</>)}
          {lf !== 1 && (<><h2>Terakhir diputar</h2>{hist.length ? hist.map((t, k) => row(t, hist, k)) : <p className="sub">Belum ada riwayat.</p>}</>)}
        </div>
      )}

      {view === 3 && (
        <div className="view" key="v3">
          <div className="hero rise">
            <div className="steam"><i /><i /><i /></div>
            <div className="cup"><Ic n="coffee" /></div>
            <span className="hb h1"><Ic n="heart" /></span><span className="hb h2"><Ic n="heart" /></span><span className="hb h3"><Ic n="heart" /></span>
          </div>
          <h2 className="rise" style={{ justifyContent: 'center', fontSize: 27, margin: '6px 0 4px', animationDelay: '.1s' }}>Traktir KALTZY404</h2>
          <p className="sub rise" style={{ textAlign: 'center', maxWidth: 300, margin: '0 auto 22px', animationDelay: '.15s' }}>Cropify gratis dan tanpa iklan. Dukunganmu bikin aplikasi ini terus berkembang.</p>
          {PERKS.map((x, k) => (
            <div key={x[0]} className="pk rise" style={{ animationDelay: `${0.2 + k * 0.08}s` }}>
              <div className="pi"><Ic n={x[0]} /></div><div><b>{x[1]}</b><span>{x[2]}</span></div>
            </div>
          ))}
          <a className="big shine rise" href={URL_} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', animationDelay: '.5s' }}><Ic n="heart" /> Traktir lewat Saweria</a>
          <p className="sub rise" style={{ textAlign: 'center', fontSize: 12, marginTop: 14, animationDelay: '.6s' }}>Terima kasih banyak, kamu keren! 💜</p>
        </div>
      )}

      <div className={'mini ' + (cur ? '' : 'h')}>
        <div className="th" onClick={() => setOpen(true)}>{cur && <Th t={cur} />}</div>
        <div className="m" style={{ flex: 1, minWidth: 0 }} onClick={() => setOpen(true)}><b style={{ fontSize: 14 }}>{cur?.title}</b><span>{cur?.artist}</span></div>
        <button className="rp" onClick={toggle}><Ic n={playing ? 'pause' : 'play'} /></button>
        <button className="rp" onClick={() => step(1)}><Ic n="next" /></button>
        <div className="mbar" style={{ width: pct + '%' }} />
      </div>

      <div className="nav" style={{ '--i': view } as any}>
        <div className="bar" />
        <div className="puck">{NAV.map((n, k) => <Ic key={n[0]} n={n[0]} c={k === view ? 'on' : ''} />)}</div>
        {NAV.map((n, k) => (
          <button key={n[0]} className={'nb ' + (k === view ? 'on' : '')} style={{ left: `${k * 25}%` }} onClick={() => setView(k)}><Ic n={n[0]} /><span>{n[1]}</span></button>
        ))}
      </div>

      <div className={'np ' + (open ? 'o' : '')} style={{ '--h1': `hsl(${hue(cur?.id || 'a')},50%,28%)` } as any}>
        <div className="nh">
          <button onClick={() => { setOpen(false); setShowQ(false); }}><Ic n="down" /></button>Sedang Diputar
          <div className="nr">
            <button className={showQ ? 'on2' : ''} onClick={() => setShowQ(!showQ)}><Ic n="list" /></button>
            <button className={isL(cur) ? 'like' : ''} onClick={() => cur && like(cur)}><Ic n="heart" /></button>
          </div>
        </div>
        <div className={'disc ' + (playing ? 'p' : '')}><img src={cover(cur?.thumb, 800)} alt="" /></div>
        <h3>{cur?.title}</h3><div className="ar">{cur?.artist}</div>
        <div className="ly">
          {lrc.length ? [ai - 1, ai, ai + 1].map((k) => lrc[k] ? <p key={k} className={k === ai ? 'a' : ''}>{lrc[k].s}</p> : <p key={k}>&nbsp;</p>) : <p>Lirik tersinkron tidak tersedia</p>}
        </div>
        <div className="pr" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * dur); }}>
          <div><i style={{ width: pct + '%' }} /></div>
        </div>
        <div className="tm"><span>{fm(time)}</span><span>-{fm(Math.max(0, dur - time))}</span></div>
        <div className="ct">
          <button className={shuffle ? 'on2' : ''} onClick={() => setShuffle(!shuffle)}><Ic n="shuf" /></button>
          <button onClick={() => step(-1)}><Ic n="prev" /></button>
          <button className="pp" onClick={toggle}><Ic n={playing ? 'pause' : 'play'} /></button>
          <button onClick={() => step(1)}><Ic n="next" /></button>
          <button className={repeat ? 'on2' : ''} onClick={() => setRepeat((repeat + 1) % 3)}><Rp one={repeat === 2} /></button>
        </div>

        <div className={'qs ' + (showQ ? 'o' : '')}>
          <div className="qh">Antrean<button onClick={() => setShowQ(false)}><Ic n="down" /></button></div>
          {queue.map((t, i) => (
            <div key={t.id + i} role="button" className={'row ' + (i === qi ? 'cur' : '')} onClick={() => jump(i)}>
              <div className="th"><Th t={t} /></div>
              <div className="m"><b style={i === qi ? { color: 'var(--ac)' } : undefined}>{t.title}</b><span>{t.artist}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
