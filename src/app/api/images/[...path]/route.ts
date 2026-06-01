import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// In development on host machine, we might not be able to resolve internal docker DNS
const isDev = process.env.NODE_ENV === 'development';
const s3Endpoint = (isDev ? process.env.CDN_S3_ENDPOINT : process.env.CDN_S3_INTERNAL_ENDPOINT) || process.env.CDN_S3_ENDPOINT;

const s3Client = new S3Client({
  endpoint: s3Endpoint,
  region: process.env.CDN_S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.CDN_S3_ACCESS_KEY || '',
    secretAccessKey: process.env.CDN_S3_SECRET_KEY || '',
  },
  forcePathStyle: process.env.CDN_S3_FORCE_PATH_STYLE === 'true',
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const pathParts = resolvedParams.path;
  
  if (!pathParts || pathParts.length === 0) {
    return new NextResponse('Missing path parameter', { status: 400 });
  }

  try {
    const bucketName = process.env.CDN_S3_BUCKET || 'nhien-coffee';
    
    // Join the path segments to form the full key path
    let key = pathParts.join('/');
    
    // If path style is used, the bucket name might be the first part of the path
    if (key.startsWith(`${bucketName}/`)) {
      key = key.substring(bucketName.length + 1);
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    // Convert readable stream to web stream
    const stream = response.Body?.transformToWebStream();
    
    if (!stream) {
      throw new Error('Empty response body');
    }

    return new NextResponse(stream, {
      headers: {
        'Content-Type': response.ContentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
      },
    });

  } catch (error: any) {
    console.error('Image proxy error:', error);
    return new NextResponse('Error fetching image', { status: 500 });
  }
}
