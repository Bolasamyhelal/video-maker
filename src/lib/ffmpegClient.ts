export async function renderMontage(
  clips: { file: Uint8Array; name: string; start: number; end: number; speed: number }[],
  onProgress?: (pct: number) => void
): Promise<string> {
  onProgress?.(100);
  const dummy = new Uint8Array(0);
  const blob = new Blob([dummy as BlobPart], { type: 'video/mp4' });
  return URL.createObjectURL(blob);
}
