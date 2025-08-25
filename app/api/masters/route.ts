import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const [deliveryMethods, editOptions, holderOptions, videoTiers] = await Promise.all([
    prisma.deliveryMethod.findMany({ orderBy: { name: 'asc' } }),
    prisma.editOption.findMany({ orderBy: { name: 'asc' } }),
    prisma.holderOption.findMany({ orderBy: { name: 'asc' } }),
    prisma.videoTier.findMany({ orderBy: { name: 'asc' } }),
  ]);
  return NextResponse.json({ deliveryMethods, editOptions, holderOptions, videoTiers });
}
