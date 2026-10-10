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
      format: 'mp4', // biasanya menghasilkan m4a
    });

    if (!format?.url && !format?.decipher_url) {
      // fallback
      const formats = [
        ...(info.streaming_data?.adaptive_formats || []),
        ...(info.streaming_data?.formats || []),
      ];
      const audio = formats
        .filter((f: any) => f.has_audio && !f.has_video)
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];

      if (!audio) {
        return Response.json({ error: 'no_audio' }, { status: 404 });
      }

      const url = audio.url || (await audio.decipher?.(y.session.player));
      return Response.json({
        url,
        mime: audio.mime_type || 'audio/mp4',
        duration: info.basic_info?.duration || 0,
      });
    }

    const url = format.url || (await format.decipher?.(y.session.player));
    return Response.json({
      url,
      mime: format.mime_type || 'audio/mp4',
      duration: info.basic_info?.duration || 0,
    });
  } catch (e) {
    yt = null;
    console.error('stream error', e);
    return Response.json({ error: 'failed', message: String(e) }, { status: 502 });
  }
}
