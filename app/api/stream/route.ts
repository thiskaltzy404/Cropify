import { Innertube, Platform } from 'youtubei.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Diperlukan supaya youtubei.js bisa decipher URL
Platform.shim.eval = async (data: any) => {
  try {
    // eslint-disable-next-line no-new-func
    return new Function(data.output)();
  } catch {
    return undefined;
  }
};

let yt: Promise<Innertube> | null = null;
const client = () => (yt ??= Innertube.create({ generate_session_locally: true }));

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id')?.trim();
  if (!id) return Response.json({ error: 'missing_id' }, { status: 400 });

  try {
    const y = await client();
    const info = await y.getBasicInfo(id);

    // Ambil format audio terbaik
    const format = info.chooseFormat({
      type: 'audio',
      quality: 'best',
      format: 'mp4',
    });

    if (format) {
      let url = format.url;

      // Kalau belum ada url, coba decipher
      if (!url && typeof (format as any).decipher === 'function') {
        try {
          url = await (format as any).decipher(y.session.player);
        } catch {}
      }

      if (url) {
        return Response.json({
          url,
          mime: format.mime_type || 'audio/mp4',
          duration: info.basic_info?.duration || 0,
        });
      }
    }

    // Fallback: cari manual dari adaptive_formats
    const formats = [
      ...(info.streaming_data?.adaptive_formats || []),
      ...(info.streaming_data?.formats || []),
    ];

    const audioFormats = formats
      .filter((f: any) => f.has_audio && !f.has_video)
      .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

    for (const audio of audioFormats) {
      let url = audio.url;

      if (!url && typeof audio.decipher === 'function') {
        try {
          url = await audio.decipher(y.session.player);
        } catch {}
      }

      if (url) {
        return Response.json({
          url,
          mime: audio.mime_type || 'audio/mp4',
          duration: info.basic_info?.duration || 0,
        });
      }
    }

    return Response.json({ error: 'no_audio' }, { status: 404 });
  } catch (e) {
    yt = null;
    console.error('stream error', e);
    return Response.json({ error: 'failed', message: String(e) }, { status: 502 });
  }
}
