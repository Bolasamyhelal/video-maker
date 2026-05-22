import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadId = uuidv4();
    const ext = path.extname(file.name);
    const fileName = `${uploadId}${ext}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const videoTypes = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
    const audioTypes = ['.mp3', '.wav', '.aac', '.ogg', '.m4a'];

    let type = 'unknown';
    if (videoTypes.includes(ext.toLowerCase())) type = 'video';
    if (audioTypes.includes(ext.toLowerCase())) type = 'audio';

    return NextResponse.json({
      id: uploadId,
      fileName,
      originalName: file.name,
      size: file.size,
      type,
      url: `/uploads/${fileName}`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
