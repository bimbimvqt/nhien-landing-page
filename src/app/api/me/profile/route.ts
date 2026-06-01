import { NextResponse } from 'next/server';
import { verifyUser, getServerApiBaseUrl, getAdminApiHeaders } from '../util';

export async function POST(req: Request) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const backendUrl = getServerApiBaseUrl();
  const res = await fetch(`${backendUrl}/api/internal/users/${user.id}/profile`, {
    method: 'POST',
    headers: getAdminApiHeaders(),
    body: JSON.stringify({ 
      display_name: body.display_name || user.user_metadata?.name || '',
      email: user.email || '' 
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    return NextResponse.json({ error: errData.error || 'Failed to update profile' }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
