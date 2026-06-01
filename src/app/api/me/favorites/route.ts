import { NextResponse } from 'next/server';
import { verifyUser, getServerApiBaseUrl, getAdminApiHeaders } from '../util';

export async function POST(req: Request) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  if (!body.product_id) {
    return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
  }

  const backendUrl = getServerApiBaseUrl();
  const res = await fetch(`${backendUrl}/api/internal/users/${user.id}/favorites`, {
    method: 'POST',
    headers: getAdminApiHeaders(),
    body: JSON.stringify({ product_id: body.product_id, email: user.email || '' })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    return NextResponse.json({ error: errData.error || 'Failed to add favorite' }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('product_id');
  
  if (!productId) {
    return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
  }

  const backendUrl = getServerApiBaseUrl();
  const res = await fetch(`${backendUrl}/api/internal/users/${user.id}/favorites/${productId}`, {
    method: 'DELETE',
    headers: getAdminApiHeaders()
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: res.status });
  }

  return new NextResponse(null, { status: 204 });
}
