import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: process.env.CDN_S3_INTERNAL_ENDPOINT || process.env.CDN_S3_ENDPOINT,
  region: process.env.CDN_S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.CDN_S3_ACCESS_KEY || '',
    secretAccessKey: process.env.CDN_S3_SECRET_KEY || '',
  },
  forcePathStyle: process.env.CDN_S3_FORCE_PATH_STYLE === 'true',
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const folder = formData.get('folder') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bucketName = bucket || process.env.CDN_S3_BUCKET || 'nhien-coffee';
    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    
    const safeName = file.name
      .replace(/\.[^/.]+$/, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'upload';
      
    const uniqueId = crypto.randomUUID();
    const filePath = folder ? `${folder}/${uniqueId}-${safeName}.${extension}` : `${uniqueId}-${safeName}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      Body: buffer,
      ContentType: file.type,
      CacheControl: 'max-age=3600',
    });

    await s3Client.send(command);

    const baseUrl = process.env.CDN_PUBLIC_BASE_URL || 'https://cdn.skytruong.com';
    const publicUrl = `${baseUrl}/${bucketName}/${filePath}`;

    return NextResponse.json({ url: publicUrl, path: filePath });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
