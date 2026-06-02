import { NextResponse } from 'next/server';
import { verifyUser, getServerApiBaseUrl } from '@/app/api/me/util';
import { isAdminUser } from '@/lib/auth';

/**
 * Proxies file uploads to the Go backend (/api/admin/upload),
 * which has internal Docker network access to MinIO.
 *
 * This avoids the need for Next.js to reach MinIO directly
 * (MinIO internal port is not publicly accessible).
 */
export async function POST(request: Request) {
  try {
    // Verify admin session
    const user = await verifyUser(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Forward multipart/form-data as-is to Go backend
    const formData = await request.formData();
    const backendUrl = getServerApiBaseUrl();

    const res = await fetch(`${backendUrl}/api/admin/upload`, {
      method: 'POST',
      headers: {
        'X-Admin-API-Key': process.env.ADMIN_API_KEY || 'change_me',
      },
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'Upload failed' },
        { status: res.status },
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Upload proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 },
    );
  }
}
