import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

interface ClipConfig {
  filePath: string;
  videoPath: string;
  startTime: number;
  endTime: number;
  speed: number;
  volume: number;
  effects: {
    brightness?: number;
    contrast?: number;
    saturate?: number;
    blur?: number;
  };
}

interface TransitionConfig {
  type: string;
  duration: number;
  fromIndex: number;
  toIndex: number;
}

interface RenderRequest {
  clips: ClipConfig[];
  transitions: TransitionConfig[];
  bgMusic?: {
    filePath: string;
    volume: number;
  };
  output: {
    resolution: string;
    fps: number;
    quality: string;
  };
  template: string;
  projectName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RenderRequest = await request.json();
    const { clips, transitions, bgMusic, output, template } = body;

    if (!clips || clips.length === 0) {
      return NextResponse.json({ error: 'No clips provided' }, { status: 400 });
    }

    const jobId = uuidv4();
    const outputDir = path.join(process.cwd(), 'public', 'renders', jobId);
    await mkdir(outputDir, { recursive: true });

    const clipFiles: string[] = [];

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const fullPath = path.join(process.cwd(), 'public', clip.videoPath);
      const processedClip = path.join(outputDir, `clip_${i}.mp4`);

      const { width, height } = parseResolution(output.resolution);
      const speedFilter = clip.speed !== 1 ? `setpts=${1 / clip.speed}*PTS` : '';
      const brightnessFilter = clip.effects?.brightness != null && clip.effects.brightness !== 1
        ? `eq=brightness=${(clip.effects.brightness - 1) * 0.1}`
        : '';
      const contrastFilter = clip.effects?.contrast != null && clip.effects.contrast !== 1
        ? `eq=contrast=${clip.effects.contrast}`
        : '';
      const saturateFilter = clip.effects?.saturate != null && clip.effects.saturate !== 1
        ? `eq=saturation=${clip.effects.saturate}`
        : '';

      const videoFilters = [speedFilter, brightnessFilter, contrastFilter, saturateFilter]
        .filter(f => f)
        .join(',');

      const clipDuration = (clip.endTime - clip.startTime) / clip.speed;
      const fadeOutStart = Math.max(0, clipDuration - 0.3);

      let filterComplex = '';
      if (videoFilters) {
        filterComplex = `-vf "${videoFilters}"`;
      }

      let trimCmd = `"${fullPath}"`;
      let seekStart = `-ss ${clip.startTime}`;
      let duration = `-t ${clip.endTime - clip.startTime}`;

      const ffmpegCmd = `ffmpeg -y ${seekStart} -i ${trimCmd} ${duration} ${filterComplex} -c:v libx264 -preset ultrafast -crf 28 -pix_fmt yuv420p -an "${processedClip}"`;

      await execAsync(ffmpegCmd, { timeout: 120000 });
      clipFiles.push(processedClip);
    }

    const concatFile = path.join(outputDir, 'concat_list.txt');
    const clipLines = clipFiles.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n');
    await writeFile(concatFile, clipLines);

    let outputName = `${body.projectName || 'montage'}_${template}.mp4`;
    const outputPath = path.join(outputDir, outputName);

    const videoCodec = output.quality === 'high' ? 'libx264 -crf 18' :
                        output.quality === 'medium' ? 'libx264 -crf 23' :
                        'libx264 -crf 28';

    let audioInput = '';
    let audioMix = '';

    if (bgMusic) {
      const musicPath = path.join(process.cwd(), 'public', bgMusic.filePath);
      audioInput = `-i "${musicPath}"`;
      audioMix = `-filter_complex "[0:a]volume=${bgMusic.volume}[a0];[1:a]volume=${0.3 * bgMusic.volume}[a1];[a0][a1]amix=inputs=2:duration=first"`;
    }

    const concatCmd = `ffmpeg -y -f concat -safe 0 -i "${concatFile}" ${audioInput} -c:v ${videoCodec} -preset medium ${audioMix} -c:a aac -b:a 192k -movflags +faststart "${outputPath}"`;

    try {
      await execAsync(concatCmd, { timeout: 300000 });
    } catch (concatError) {
      const fallbackCmd = `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c copy -movflags +faststart "${outputPath}"`;
      await execAsync(fallbackCmd, { timeout: 300000 });
    }

    return NextResponse.json({
      jobId,
      outputPath: `/renders/${jobId}/${outputName}`,
      status: 'done',
    });
  } catch (error: any) {
    console.error('Render error:', error);
    return NextResponse.json(
      { error: error.message || 'Render failed' },
      { status: 500 }
    );
  }
}

function parseResolution(resolution: string): { width: number; height: number } {
  switch (resolution) {
    case '1080p': return { width: 1920, height: 1080 };
    case '720p': return { width: 1280, height: 720 };
    case '480p': return { width: 854, height: 480 };
    default: return { width: 1920, height: 1080 };
  }
}
