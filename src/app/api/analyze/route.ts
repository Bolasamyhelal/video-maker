import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { AnalysisResult, Scene } from '@/lib/types';

const execAsync = promisify(exec);

interface AnalyzeRequest {
  filePath: string;
  fileName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { filePath, fileName } = body;

    if (!filePath) {
      return NextResponse.json({ error: 'No file path provided' }, { status: 400 });
    }

    const fullPath = path.join(process.cwd(), 'public', filePath);

    const probeCmd = `ffprobe -v quiet -print_format json -show_format -show_streams "${fullPath}"`;
    const { stdout: probeOutput } = await execAsync(probeCmd);
    const probeData = JSON.parse(probeOutput);

    const videoStream = probeData.streams?.find((s: any) => s.codec_type === 'video');
    const audioStream = probeData.streams?.find((s: any) => s.codec_type === 'audio');

    const duration = parseFloat(probeData.format?.duration || '0');
    const width = videoStream?.width || 0;
    const height = videoStream?.height || 0;
    const fps = eval(videoStream?.r_frame_rate || '0');
    const codec = videoStream?.codec_name || 'unknown';

    let scenes: Scene[] = [];
    try {
      const sceneCmd = `ffmpeg -i "${fullPath}" -vf "select='gt(scene,0.3)',showinfo" -f null - 2>&1`;
      const { stderr: sceneOutput } = await execAsync(sceneCmd, { timeout: 30000 });

      scenes = parseSceneOutput(sceneOutput);
    } catch {
      const interval = Math.max(2, duration / 20);
      scenes = generateDefaultScenes(duration, interval);
    }

    if (scenes.length === 0) {
      const interval = Math.max(2, duration / 10);
      scenes = generateDefaultScenes(duration, interval);
    }

    const dominantColors = extractColorsFromSceneInfo(scenes);

    const result: AnalysisResult = {
      duration,
      width,
      height,
      fps: Math.round(fps),
      codec,
      scenes,
      dominantColors,
      motionScore: scenes.filter(s => s.type === 'motion').length / Math.max(scenes.length, 1),
      qualityScore: Math.round(Math.min((width * height) / (1920 * 1080), 1) * 100),
      hasAudio: !!audioStream,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}

function parseSceneOutput(output: string): Scene[] {
  const scenes: Scene[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    const ptsMatch = line.match(/pts_time:([\d.]+)/);
    const sceneMatch = line.match(/scene:([\d.]+)/);

    if (ptsMatch && sceneMatch) {
      const ptsTime = parseFloat(ptsMatch[1]);
      const sceneScore = parseFloat(sceneMatch[1]);

      if (scenes.length > 0) {
        scenes[scenes.length - 1].end = ptsTime;
      }

      scenes.push({
        start: ptsTime,
        end: ptsTime + 2,
        type: sceneScore > 0.4 ? 'transition' : sceneScore > 0.2 ? 'motion' : 'static',
        description: sceneScore > 0.4 ? 'Scene change' : 'Continuation',
      });
    }
  }

  return scenes;
}

function generateDefaultScenes(duration: number, interval: number): Scene[] {
  const scenes: Scene[] = [];
  for (let t = 0; t < duration; t += interval) {
    scenes.push({
      start: t,
      end: Math.min(t + interval, duration),
      type: 'motion',
      description: `Segment ${Math.floor(t / interval) + 1}`,
    });
  }
  return scenes;
}

function extractColorsFromSceneInfo(scenes: Scene[]): string[] {
  const colors = [
    '#FF6B35', '#FF4500', '#FFD700', '#87CEEB',
    '#90EE90', '#191970', '#228B22', '#DAA520',
    '#FF1493', '#00CED1', '#7B68EE', '#FF6347',
  ];

  const count = Math.min(3 + Math.floor(scenes.length / 2), colors.length);
  const shuffled = [...colors].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
