import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getUserUsage } from '@/lib/usage';

export async function GET(req: NextRequest) {
  try {
    const headersList = await headers();
    // const cookieStore = await cookies();

    const session = await auth.api.getSession({
      headers: headersList,
    //   cookies: cookieStore,
    });

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const usage = await getUserUsage(session.user.id);

    return NextResponse.json(usage);
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}