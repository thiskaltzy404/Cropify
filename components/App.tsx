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
  const [lrc, setLrc] = useState<Ln[]>([]);
  const [liked, setLiked] = useLS<T[]>('cropify:liked', []);
  const [hist, setHist] = useLS<T[]>('cropify:hist', []);
  const pl = useRef<any>(null);
  const cur: T | undefined = queue[qi];

  useEffect(() => setG(greet()), []);

  // Beranda: ambil lagu sesuai chip
  useEffect(() => {
    let ok = true;
    setLoading(true);
    api('/api/search?q=' + encodeURIComponent(CHIPS[chip][1])).then((d) => {
      if (ok) { setHome(d.tracks || []); setLoading(false); }
    });
    return () => { ok = false; };
  }, [chip]);

  // Cari (debounce)
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

  // Lirik tersinkron dari lrclib
  useEffect(() => {
    setLrc([]);
    if (!cur) return;
    let ok = true;
    const p = new URLSearchParams({ title: cur.title, artist: cur.artist.split(',')[0], duration: String(cur.duration || '') });
    api('/api/lyrics?' + p).then((d) => { if (ok && d.lrc) setLrc(parseLrc(d.lrc)); });
    return () => { ok = false; };
  }, [cur?.id]);

  // Sinkronkan currentTime dari player YouTube
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
    setQueue(list); setQi(i); setPlaying(true); setTime(0); setDur(t.duration);
    setHist([t, ...hist.filter((x) => x.id !== t.id)].slice(0, 30));
  };
  const step = useCallback((d: number) => {
    if (!queue.length) return;
    const n = (qi + d + queue.length) % queue.length;
    if (n === qi) { pl.current?.seekTo(0, true); pl.current?.playVideo(); return; }
    setQi(n); setTime(0); setPlaying(true); setDur(queue[n].duration);
  }, [queue, qi]);
  const toggle = () => { const p = pl.current; if (p) playing ? p.pauseVideo() : p.playVideo(); };
  const seek = (s: number) => { pl.current?.seekTo(s, true); setTime(s); };
  const isL = (t?: T) => !!t && liked.some((x) => x.id === t.id);
  const like = (t: T) => setLiked(isL(t) ? liked.filter((x) => x.id !== t.id) : [t, ...liked]);

  // Kontrol di notifikasi / layar kunci
  useEffect(() => {
    if (!cur || !('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    ms.metadata = new MediaMetadata({ title: cur.title, artist: cur.artist, artwork: [{ src: cur.thumb || '/logo.png', sizes: '512x512' }] });
    ms.setActionHandler('play', () => pl.current?.playVideo());
    ms.setActionHandler('pause', () => pl.current?.pauseVideo());
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
      <div className="blob b1" /><div className="blob b2" />

      {/* Player YouTube tersembunyi: hanya untuk audio */}
      <div aria-hidden style={{ position: 'fixed', left: -9999, top: 0, width: 200, height: 200, pointerEvents: 'none' }}>
        {cur && (
          <YouTube videoId={cur.id}
            opts={{ width: '200', height: '200', playerVars: { autoplay: 1, playsinline: 1, controls: 0 } }}
            onReady={(e: any) => { pl.current = e.target; }}
            onStateChange={(e: any) => { if (e.data === 1) setPlaying(true); else if (e.data === 2) setPlaying(false); else if (e.data === 0) step(1); }} />
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
                <button key={t.id} className="fc rise" style={{ animationDelay: `${k * 100}ms`, background: `linear-gradient(135deg,hsl(${hue(t.id)},70%,60%),hsl(${hue(t.id) + 40},60%,35%))` }}
                  onClick={() => { play(home, k); setOpen(true); }}>
                  <h3>{t.title}</h3><p>{t.artist}</p>
                  <div className="pb"><Ic n="play" /></div>
                  <div className="cv"><Th t={t} /></div>
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
          <button onClick={() => setOpen(false)}><Ic n="down" /></button>Sedang Diputar
          <button className={isL(cur) ? 'like' : ''} onClick={() => cur && like(cur)}><Ic n="heart" /></button>
        </div>
        <div className={'disc ' + (playing ? 'p' : '')}><Th t={cur} /></div>
        <h3>{cur?.title}</h3><div className="ar">{cur?.artist}</div>
        <div className="ly">
          {lrc.length ? [ai - 1, ai, ai + 1].map((k) => lrc[k] ? <p key={k} className={k === ai ? 'a' : ''}>{lrc[k].s}</p> : <p key={k}>&nbsp;</p>) : <p>Lirik tersinkron tidak tersedia</p>}
        </div>
        <div className="pr" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * dur); }}>
          <div><i style={{ width: pct + '%' }} /></div>
        </div>
        <div className="tm"><span>{fm(time)}</span><span>-{fm(Math.max(0, dur - time))}</span></div>
        <div className="ct">
          <button><Ic n="shuf" /></button>
          <button onClick={() => step(-1)}><Ic n="prev" /></button>
          <button className="pp" onClick={toggle}><Ic n={playing ? 'pause' : 'play'} /></button>
          <button onClick={() => step(1)}><Ic n="next" /></button>
          <button><Ic n="list" /></button>
        </div>
      </div>
    </div>
  );
}
