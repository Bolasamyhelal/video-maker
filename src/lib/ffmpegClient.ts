import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let loaded = false;

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && loaded) return ffmpegInstance;

  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg();
  }

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

  try {
    await ffmpegInstance.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    loaded = true;
  } catch {
    try {
      await ffmpegInstance.load({
        coreURL: `${baseURL}/ffmpeg-core.js`,
        wasmURL: `${baseURL}/ffmpeg-core.wasm`,
      });
      loaded = true;
    } catch (e) {
      console.error('FFmpeg load error:', e);
      throw new Error('فشل تحميل FFmpeg');
    }
  }

  ffmpegInstance.on('progress', ({ progress }) => {
    console.log(`FFmpeg progress: ${(progress * 100).toFixed(1)}%`);
  });

  return ffmpegInstance;
}

export async function concatVideos(
  files: { data: Uint8Array; name: string }[],
  onProgress?: (pct: number) => void
): Promise<Uint8Array> {
  const ffmpeg = await getFFmpeg();

  for (const file of files) {
    await ffmpeg.writeFile(file.name, file.data);
  }

  const fileList = files.map(f => `file '${f.name}'`).join('\n');
  await ffmpeg.writeFile('concat.txt', new TextEncoder().encode(fileList));

  ffmpeg.on('progress', ({ progress }) => {
    onProgress?.(Math.round(progress * 100));
  });

  await ffmpeg.exec([
    '-f', 'concat',
    '-safe', '0',
    '-i', 'concat.txt',
    '-c', 'copy',
    '-movflags', '+faststart',
    'output.mp4',
  ]);

  const raw = await ffmpeg.readFile('output.mp4');
  return new Uint8Array(raw.slice(0));
}

export async function trimVideo(
  file: Uint8Array,
  fileName: string,
  startTime: number,
  duration: number,
  onProgress?: (pct: number) => void
): Promise<Uint8Array> {
  const ffmpeg = await getFFmpeg();
  await ffmpeg.writeFile(`input_${fileName}`, file);

  ffmpeg.on('progress', ({ progress }) => {
    onProgress?.(Math.round(progress * 100));
  });

  await ffmpeg.exec([
    '-ss', String(startTime),
    '-i', `input_${fileName}`,
    '-t', String(duration),
    '-c', 'copy',
    '-movflags', '+faststart',
    'trimmed.mp4',
  ]);

  const raw = await ffmpeg.readFile('trimmed.mp4');
  return raw.slice(0);
}

export async function applyEffects(
  file: Uint8Array,
  fileName: string,
  effects: { brightness?: number; contrast?: number; saturate?: number },
  onProgress?: (pct: number) => void
): Promise<Uint8Array> {
  const ffmpeg = await getFFmpeg();
  await ffmpeg.writeFile(`input_${fileName}`, file);

  const filters: string[] = [];
  if (effects.brightness != null && effects.brightness !== 1) {
    filters.push(`eq=brightness=${((effects.brightness - 1) * 0.1).toFixed(2)}`);
  }
  if (effects.contrast != null && effects.contrast !== 1) {
    filters.push(`eq=contrast=${effects.contrast.toFixed(2)}`);
  }
  if (effects.saturate != null && effects.saturate !== 1) {
    filters.push(`eq=saturation=${effects.saturate.toFixed(2)}`);
  }

  ffmpeg.on('progress', ({ progress }) => {
    onProgress?.(Math.round(progress * 100));
  });

  if (filters.length > 0) {
    await ffmpeg.exec([
      '-i', `input_${fileName}`,
      '-vf', filters.join(','),
      '-c:a', 'copy',
      '-movflags', '+faststart',
      'effected.mp4',
    ]);
  } else {
    await ffmpeg.exec([
      '-i', `input_${fileName}`,
      '-c', 'copy',
      '-movflags', '+faststart',
      'effected.mp4',
    ]);
  }

  const raw = await ffmpeg.readFile('effected.mp4');
  return raw.slice(0);
}

export async function renderMontage(
  clips: { file: Uint8Array; name: string; start: number; end: number; speed: number }[],
  onProgress?: (pct: number) => void
): Promise<Uint8Array> {
  const ffmpeg = await getFFmpeg();

  for (let i = 0; i < clips.length; i++) {
    await ffmpeg.writeFile(`clip_${i}.mp4`, clips[i].file);

    const duration = (clips[i].end - clips[i].start) / clips[i].speed;
    const speedFilter = clips[i].speed !== 1
      ? `[0:v]setpts=${(1 / clips[i].speed).toFixed(2)}*PTS[v${i}];`
      : '';

    if (speedFilter) {
      await ffmpeg.exec([
        '-ss', String(clips[i].start),
        '-i', `clip_${i}.mp4`,
        '-t', String(clips[i].end - clips[i].start),
        '-vf', `setpts=${(1 / clips[i].speed).toFixed(2)}*PTS`,
        '-an',
        '-movflags', '+faststart',
        `trimmed_${i}.mp4`,
      ]);
    } else {
      await ffmpeg.exec([
        '-ss', String(clips[i].start),
        '-i', `clip_${i}.mp4`,
        '-t', String(clips[i].end - clips[i].start),
        '-c', 'copy',
        '-movflags', '+faststart',
        `trimmed_${i}.mp4`,
      ]);
    }
  }

  const fileList = clips.map((_, i) => `file 'trimmed_${i}.mp4'`).join('\n');
  await ffmpeg.writeFile('concat.txt', new TextEncoder().encode(fileList));

  ffmpeg.on('progress', ({ progress }) => {
    onProgress?.(Math.round(progress * 100));
  });

  await ffmpeg.exec([
    '-f', 'concat',
    '-safe', '0',
    '-i', 'concat.txt',
    '-c', 'copy',
    '-movflags', '+faststart',
    'final.mp4',
  ]);

  const raw = await ffmpeg.readFile('final.mp4');
  return raw.slice(0);
}
