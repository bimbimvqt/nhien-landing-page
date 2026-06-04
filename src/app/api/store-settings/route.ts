import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerApiBaseUrl } from '@/app/api/me/util';

/**
 * Public endpoint — returns store settings that are safe to expose
 * to all authenticated users (reward_tasks, member_tiers, etc.)
 * No admin auth required.
 */
export async function GET() {
  try {
    const res = await fetch(`${getServerApiBaseUrl()}/api/store-settings`, {
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: res.status });
    }

    const data = await res.json();

    // Return only public-safe fields
    return NextResponse.json({
      reward_tasks: data.reward_tasks ?? null,
      member_tiers: data.member_tiers ?? null,
      required_tasks_to_claim: data.required_tasks_to_claim ?? null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
