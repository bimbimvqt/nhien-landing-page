import { NextResponse } from 'next/server';
import { verifyUser, getServerApiBaseUrl, getAdminApiHeaders } from '../util';

export async function GET(req: Request) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const backendUrl = getServerApiBaseUrl();
  const res = await fetch(`${backendUrl}/api/internal/users/${user.id}/engagement?email=${encodeURIComponent(user.email || '')}`, {
    headers: getAdminApiHeaders(),
    cache: 'no-store'
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch engagement from backend' }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
