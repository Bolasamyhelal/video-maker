export async function renderMontage(
  clips: { file: Uint8Array; name: string; start: number; end: number; speed: number }[],
  onProgress?: (pct: number) => void,
  audioFile?: { file: Uint8Array; name: string; volume?: number }
): Promise<string> {
  if (clips.length === 0) throw new Error('No clips');

  try {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');

    const ffmpeg = new FFmpeg();
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js', 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    for (let i = 0; i < clips.length; i++) {
      await ffmpeg.writeFile(`clip_${i}.mp4`, clips[i].file);
      const dur = clips[i].end - clips[i].start;
      onProgress?.(Math.round((i / clips.length) * 40));
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
      onProgress?.(40 + Math.round(progress * 40));
    });

    let audioInput = '';
    let audioMix = '';
    let finalArgs: string[] = [];

    if (audioFile) {
      await ffmpeg.writeFile('bgmusic', audioFile.file);
      audioInput = '-i bgmusic';
      audioMix = `-filter_complex "[0:a]volume=1.0[a0];[1:a]volume=${audioFile.volume ?? 0.5}[a1];[a0][a1]amix=inputs=2:duration=first"`;
      finalArgs = [
        '-f', 'concat', '-safe', '0',
        '-i', 'concat.txt',
        '-i', 'bgmusic',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28',
        '-filter_complex', `[1:a]volume=${audioFile.volume ?? 0.5}[bg];[0:a][bg]amix=inputs=2:duration=first[out]`,
        '-map', '0:v:0', '-map', '[out]',
        '-movflags', '+faststart',
        'final.mp4',
      ];
    } else {
      finalArgs = [
        '-f', 'concat', '-safe', '0',
        '-i', 'concat.txt',
        '-c', 'copy',
        '-movflags', '+faststart',
        'final.mp4',
      ];
    }

    await ffmpeg.exec(finalArgs);

    onProgress?.(95);
    const raw: any = await ffmpeg.readFile('final.mp4');
    const uint8 = new Uint8Array(raw.buffer || raw);
    const blob = new Blob([uint8.buffer as ArrayBuffer], { type: 'video/mp4' });
    return URL.createObjectURL(blob);

  } catch (e: any) {
    console.error('FFmpeg error:', e);
    if (e?.message?.includes('aborted')) throw new Error('تم إلغاء المعالجة');
    throw new Error('فشل معالجة الفيديو: ' + (e?.message || 'خطأ غير معروف'));
  }
}