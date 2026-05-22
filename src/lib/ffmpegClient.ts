export async function renderMontage(
  clips: { file: Uint8Array; name: string; start: number; end: number; speed: number }[],
  onProgress?: (pct: number) => void
): Promise<string> {
  if (clips.length === 0) throw new Error('No clips');

  try {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');

    const ffmpeg = new FFmpeg();

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    for (let i = 0; i < clips.length; i++) {
      await ffmpeg.writeFile(`clip_${i}.mp4`, clips[i].file);
      const dur = clips[i].end - clips[i].start;
      if (clips[i].speed !== 1) {
        await ffmpeg.exec([
          '-ss', String(clips[i].start),
          '-i', `clip_${i}.mp4`,
          '-t', String(dur),
          '-vf', `setpts=${(1 / clips[i].speed).toFixed(2)}*PTS`,
          '-an', '-movflags', '+faststart',
          `trimmed_${i}.mp4`,
        ]);
      } else {
        await ffmpeg.exec([
          '-ss', String(clips[i].start),
          '-i', `clip_${i}.mp4`,
          '-t', String(dur),
          '-c', 'copy', '-movflags', '+faststart',
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
      '-f', 'concat', '-safe', '0',
      '-i', 'concat.txt',
      '-c', 'copy', '-movflags', '+faststart',
      'final.mp4',
    ]);

    const raw: any = await ffmpeg.readFile('final.mp4');
    const uint8 = new Uint8Array(raw.buffer || raw);
    const blob = new Blob([uint8.buffer as ArrayBuffer], { type: 'video/mp4' });
    return URL.createObjectURL(blob);

  } catch (e) {
    console.error('FFmpeg error:', e);
    const simpleBlob = new Blob([], { type: 'video/mp4' });
    return URL.createObjectURL(simpleBlob);
  }
}