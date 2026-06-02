import { NextResponse } from 'next/server';
import { getServerApiBaseUrl, getAdminApiHeaders, verifyUser } from '@/app/api/me/util';
import { isAdminUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await verifyUser(req);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(`${getServerApiBaseUrl()}/api/store-settings`);
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Error');
      return NextResponse.json({ error: errorText }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await verifyUser(req);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const res = await fetch(`${getServerApiBaseUrl()}/api/store-settings`, {
      method: 'PUT',
      headers: getAdminApiHeaders(),
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Error');
      return NextResponse.json({ error: errorText }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
