export interface BeatInfo {
  timestamp: number;
  intensity: number;
}

export function detectBeats(audioAnalysis: string): BeatInfo[] {
  const beats: BeatInfo[] = [];
  const lines = audioAnalysis.split('\n');

  for (const line of lines) {
    const match = line.match(/^\[Parsed_showwaves.*\]\s+(\d+\.\d+)\s+(\d+\.\d+)/);
    if (match) {
      beats.push({
        timestamp: parseFloat(match[1]),
        intensity: parseFloat(match[2]) / 100,
      });
    }
  }

  return beats;
}

export function generateBeatsFromBPM(bpm: number, duration: number): BeatInfo[] {
  const beats: BeatInfo[] = [];
  const interval = 60 / bpm;
  let time = 0;

  while (time < duration) {
    beats.push({
      timestamp: time,
      intensity: 0.5 + Math.random() * 0.5,
    });
    time += interval;
  }

  return beats;
}

export function syncClipsToBeats(
  clipDurations: number[],
  beats: BeatInfo[],
  totalDuration: number
): number[][] {
  if (beats.length === 0) {
    return [Array(clipDurations.length).fill(1)];
  }

  const segments: number[][] = [];
  let beatIndex = 0;

  for (let i = 0; i < clipDurations.length; i++) {
    const clipSegment: number[] = [];
    let remaining = clipDurations[i];
    let currentTime = 0;

    while (remaining > 0 && beatIndex < beats.length) {
      const nextBeat = beats[beatIndex];
      const segmentDuration = Math.min(remaining, nextBeat.timestamp - currentTime);

      if (segmentDuration > 0) {
        clipSegment.push(segmentDuration);
        remaining -= segmentDuration;
        currentTime += segmentDuration;
      }
      beatIndex++;
    }

    if (remaining > 0) {
      clipSegment.push(remaining);
    }

    segments.push(clipSegment);
  }

  return segments;
}

export function calculateOptimalBPMForDuration(
  numClips: number,
  targetDuration: number
): number {
  const minBeats = numClips * 2;
  const maxBeats = numClips * 8;
  const beatsPerMinute = ((minBeats + maxBeats) / 2) / (targetDuration / 60);
  return Math.round(beatsPerMinute / 5) * 5;
}
