import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const take = Number(searchParams.get('take') ?? 20);

  const tournaments = await prisma.tournament.findMany({
    where: {
      isActive: true,
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { note: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [
      { lastUsedAt: 'desc' },
      { createdAt: 'desc' },
    ],
    take,
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      priceOverride: true,
      customNotice: true,
      setType: true,
      categories: true,
    },
  });

  return NextResponse.json({ tournaments });
}
