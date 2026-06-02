import { NextResponse } from 'next/server';
import { getServerApiBaseUrl, getAdminApiHeaders, verifyUser } from '@/app/api/me/util';
import { isAdminUser } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await verifyUser(req);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const body = await req.json();

    const res = await fetch(
      `${getServerApiBaseUrl()}/api/internal/users/${userId}/loyalty`,
      {
        method: 'POST',
        headers: getAdminApiHeaders(),
        body: JSON.stringify(body),
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Error');
      return NextResponse.json({ error: errorText }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
