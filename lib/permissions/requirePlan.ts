import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getUserPlan } from './getUserPlan';

type Requirement = 'essential' | 'premium' | 'practitioner';

export async function requirePlan(req: NextRequest, requirement: Requirement) {
  const { searchParams } = req.nextUrl;
  const redirectTo = searchParams.get('redirect') || '/pricing';

  const userId = req.headers.get('x-hx-user-id');
  if (!userId) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  const plan = await getUserPlan(userId);

  const ok =
    requirement === 'essential'
      ? ['essential', 'premium', 'practitioner'].includes(plan)
      : requirement === 'premium'
        ? ['premium', 'practitioner'].includes(plan)
        : plan === 'practitioner';

  if (!ok) {
    const pricing = new URL('/pricing', req.url);
    pricing.searchParams.set('required', requirement);
    pricing.searchParams.set('from', redirectTo);
    return NextResponse.redirect(pricing);
  }

  return null;
}
