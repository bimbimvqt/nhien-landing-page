import { NextResponse } from 'next/server';
import { verifyUser, getServerApiBaseUrl, getAdminApiHeaders } from '../util';

export async function GET(req: Request) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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
  } catch (error) {
    console.error('Error fetching engagement from backend:', error);
    // Return graceful default fallback data if backend is offline to prevent frontend crashes
    return NextResponse.json({
      favorites: [],
      claims: [],
      completed_tasks: [],
      loyalty_account: { tier: 'Member', stamps: 0, points: 0 },
      loyalty_transactions: []
    });
  }
}
