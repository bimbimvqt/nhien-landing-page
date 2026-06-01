import { NextResponse } from 'next/server';
import { verifyUser, getServerApiBaseUrl, getAdminApiHeaders } from '../util';

export async function POST(req: Request) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  if (!body.task_key) {
    return NextResponse.json({ error: 'task_key is required' }, { status: 400 });
  }

  const backendUrl = getServerApiBaseUrl();
  const res = await fetch(`${backendUrl}/api/internal/users/${user.id}/tasks`, {
    method: 'POST',
    headers: getAdminApiHeaders(),
    body: JSON.stringify({ task_key: body.task_key, email: user.email || '' })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    return NextResponse.json({ error: errData.error || 'Failed to complete task' }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
