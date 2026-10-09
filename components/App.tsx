'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import YouTube from 'react-youtube';
import { Ic } from '../lib/icons';

type T = { id: string; title: string; artist: string; thumb: string; duration: number };
type Ln = { t: number; s: string };

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
function silentUrl() {
  const n = 80000, b = new ArrayBuffer(44 + n), v = new DataView(b);
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  w(36, 'data'); v.setUint32(40, n, true);
  new Uint8Array(b).fill(128, 44);
  return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
}
const big = (u?: string) => (u ? u.replace(/=w\d+-h\d+.*$/, '=w800-h800-l90-rj') : '/logo.png');
const Rp = ({ one }: { one: boolean }) => (
  <svg className="i" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: '<path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>' + (one ? '<path d="M11.5 10l1.5-1v6"/>' : '') }} />
);
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
  const [q, setQ] = useState('');
  const [res, setRes] = useState<T[]>([]);
  const [searching, setSearching] = useState(false);
  const [queue, setQueue] = useState<T[]>([]);
  const [qi, setQi] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [open, setOpen] = useState(false);
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
  const cur: T | undefined = queue[qi];

  useEffect(() => setG(greet()), []);
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
  // Mencoba melanjutkan YouTube kalau pengguna masih ingin musik jalan tapi player berhenti sendiri
  const resume = useCallback(() => {
    const p = pl.current;
    if (!want.current || !p?.getPlayerState) return;
    const s = p.getPlayerState();
    if (s !== 1 && s !== 3) { try { p.playVideo(); } catch {} }
  }, []);
  // Dipanggil langsung dari tap pengguna agar audio keepalive diizinkan browser
  const kick = () => { want.current = true; sil.current?.play().catch(() => {}); };

  useEffect(() => {
    const a = new Audio(silentUrl());
    a.loop = true;
    sil.current = a;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const onVis = () => {
      timers.forEach(clearTimeout); timers.length = 0;
      if (want.current) [0, 250, 800, 2000].forEach((ms) => timers.push(setTimeout(resume, ms)));
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pageshow', onVis);
    const watchdog = setInterval(resume, 1500);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pageshow', onVis);
      clearInterval(watchdog); timers.forEach(clearTimeout); a.pause();
    };
  }, [resume]);
  useEffect(() => { if (cur) want.current = true; }, [cur?.id]);
  useEffect(() => {
    const a = sil.current;
    if (a) { if (playing) a.play().catch(() => {}); else a.pause(); }
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  }, [playing]);
  // Sinkronkan durasi/posisi di notifikasi dengan lagu YouTube (bukan audio keepalive)
  useEffect(() => {
    if (!('mediaSession' in navigator) || !dur) return;
    try { navigator.mediaSession.setPositionState({ duration: dur, position: Math.max(0, Math.min(time, dur)), playbackRate: 1 }); } catch {}
  }, [Math.floor(time), dur]);
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
  useEffect(() => {
    let ok = true;
    setLoading(true);
    api('/api/search?q=' + encodeURIComponent(CHIPS[chip][1])).then((d) => {
      if (ok) { setHome(d.tracks || []); setLoading(false); }
    });
    return () => { ok = false; };
  }, [chip]);

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

  useEffect(() => {
    setLrc([]);
    if (!cur) return;
    let ok = true;
    const p = new URLSearchParams({ title: cur.title, artist: cur.artist.split(',')[0], duration: String(cur.duration || '') });
    api('/api/lyrics?' + p).then((d) => { if (ok && d.lrc) setLrc(parseLrc(d.lrc)); });
    return () => { ok = false; };
  }, [cur?.id]);

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

  const play = (list: T[], i: number) => {
    const t = list[i];
    kick();
    stack.current = [];
    setQueue(list); setQi(i); setPlaying(true); setTime(0); setDur(t.duration);
    setHist([t, ...hist.filter((x) => x.id !== t.id)].slice(0, 30));
  };
  const jump = (n: number) => { kick(); setQi(n); setTime(0); setPlaying(true); setDur(queue[n].duration); };
  const step = useCallback((d: number) => {
    if (!queue.length) return;
    kick();
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
  const ended = () => {
    if (repeat === 2) { pl.current?.seekTo(0, true); pl.current?.playVideo(); return; }
    if (repeat === 0 && !shuffle && qi === queue.length - 1) { want.current = false; setPlaying(false); setTime(0); return; }
    step(1);
  };
  const toggle = () => {
    const p = pl.current; if (!p) return;
    if (playing) { want.current = false; p.pauseVideo(); } else { kick(); p.playVideo(); }
  };
  const seek = (s: number) => { pl.current?.seekTo(s, true); setTime(s); };
  const isL = (t?: T) => !!t && liked.some((x) => x.id === t.id);
  const like = (t: T) => setLiked(isL(t) ? liked.filter((x) => x.id !== t.id) : [t, ...liked]);

  useEffect(() => {
    if (!cur || !('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    const art = (n: number) => {
      const u = cur.thumb;
      if (!u) return { src: location.origin + '/logo.png', sizes: '512x512', type: 'image/png' };
      const s = /=w\d+-h\d+/.test(u) ? u.replace(/=w\d+-h\d+.*$/, `=w${n}-h${n}-l90-rj`) : u;
      return { src: s, sizes: `${n}x${n}` };
    };
    ms.metadata = new MediaMetadata({ title: cur.title, artist: cur.artist, artwork: [96, 256, 512].map(art) });
    ms.setActionHandler('play', () => { kick(); pl.current?.playVideo(); });
    ms.setActionHandler('pause', () => { want.current = false; pl.current?.pauseVideo(); sil.current?.pause(); });
    ms.setActionHandler('nexttrack', () => step(1));
    ms.setActionHandler('previoustrack', () => step(-1));
    try { ms.setActionHandler('seekto', (d: any) => { if (typeof d.seekTime === 'number') seek(d.seekTime); }); } catch {}
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

      <div aria-hidden style={{ position: 'fixed', left: 0, bottom: 0, width: 200, height: 200, opacity: 0.01, zIndex: -1, pointerEvents: 'none' }}>
        {cur && (
          <YouTube videoId={cur.id}
            opts={{ width: '200', height: '200', playerVars: { autoplay: 1, playsinline: 1, controls: 0 } }}
            onReady={(e: any) => { pl.current = e.target; }}
            onStateChange={(e: any) => { if (e.data === 1) { want.current = true; setPlaying(true); } else if (e.data === 2) { if (want.current) e.target.playVideo(); else setPlaying(false); } else if (e.data === 0) ended(); }} />
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
            <h2>Pilihan & trending</h2>
            <div className="hs">
             {home.slice(0, 3).map((t, k) => (
              <button key={t.id} className="pc rise" style={{ animationDelay: `${k * 100}ms` }} onClick={() => { play(home, k); setOpen(true); }}>
               <img src={(t.thumb || '/logo.png').replace(/=w\d+-h\d+.*$/, '=w600-h600-l90-rj')} alt="" />
               <div className="pt"><h3>{t.title}</h3><p>{t.artist}</p></div>
               <div className="pf2"><span>Pilihan hari ini{t.duration ? ` • ${fm(t.duration)}` : ''}</span><div className="pb"><Ic n="play" /></div></div>
              </button>
            ))}
           </div>
            <h2>Daftar putar harian</h2>
            {home.map((t, k) => (k >= 3 ? row(t, home, k) : null))}
          </>)}
        </div>
      )}

      {view === 1 && (
        <div className="view" key="v1">
          <h2 style={{ fontSize: 26, marginTop: 6 }}>Cari</h2>
          <div className="srch"><Ic n="search" /><input placeholder="Judul lagu atau artis" value={q} onChange={(e) => setQ(e.target.value)} autoFocus /></div>
          {searching ? <div className="er">Mencari…</div> : res.length ? res.map((t, k) => row(t, res, k)) : q.trim() ? <div className="er">Tidak ditemukan</div> : <div className="er">Ketik untuk mencari lagu</div>}
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
        <div className={'disc ' + (playing ? 'p' : '')}><img src={big(cur?.thumb)} alt="" /></div>
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
