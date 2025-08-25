import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { calcQuote } from '@/lib/quote';
import { z } from 'zod';

const ItemSchema = z.object({
  category: z.string().min(1),
  round: z.string().min(1),
  opponent: z.string().min(1),
  note: z.string().optional().nullable(),
  otherInfo: z.string().optional().nullable(),
});

const RequestInputSchema = z.object({
  tournamentId: z.string().uuid(),
  email: z.string().email(),
  customerName: z.string().min(1),
  playerName: z.string().min(1),
  phone: z.string().min(1),
  deliveryMethodId: z.string().uuid(),
  editOptionId: z.string().uuid(),
  holderOptionId: z.string().uuid(),
  videoTierId: z.string().uuid(),
  items: z.array(ItemSchema).max(6).default([]),
  agree: z.boolean().optional(),
  memo: z.string().optional().nullable(),
});

function makeReceiptNumber() {
  const d = new Date();
  const yyyy = d.getFullYear().toString();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${yyyy}${mm}${dd}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = RequestInputSchema.parse(body);

    const [tournament, videoTier, editOption, deliveryMethod, holderOption] = await Promise.all([
      prisma.tournament.findUniqueOrThrow({ where: { id: input.tournamentId } }),
      prisma.videoTier.findUniqueOrThrow({ where: { id: input.videoTierId } }),
      prisma.editOption.findUniqueOrThrow({ where: { id: input.editOptionId } }),
      prisma.deliveryMethod.findUniqueOrThrow({ where: { id: input.deliveryMethodId } }),
      prisma.holderOption.findUniqueOrThrow({ where: { id: input.holderOptionId } }),
    ]);

    // Server-side re-calculation
    const breakdown = calcQuote({
      videoTier: { id: videoTier.id, name: videoTier.name, price: videoTier.price },
      editOption: { id: editOption.id, name: editOption.name, price: editOption.price },
      deliveryMethod: { id: deliveryMethod.id, name: deliveryMethod.name, price: deliveryMethod.price, shippingPrice: (deliveryMethod as any).shippingPrice ?? 0 },
      holderOption: { id: holderOption.id, name: holderOption.name, price: holderOption.price },
      tournament: { id: tournament.id, priceOverride: tournament.priceOverride ?? undefined, setType: (tournament as any).setType },
      videoCount: (input.items?.length ?? Number(videoTier.name)) || 0,
      discount: 0,
    });

    const receiptNumber = makeReceiptNumber();

    const created = await prisma.$transaction(async (tx) => {
      const reqSaved = await tx.request.create({
        data: {
          email: input.email,
          customerName: input.customerName,
          playerName: input.playerName,
          phone: input.phone,
          deliveryMethodId: input.deliveryMethodId,
          editOptionId: input.editOptionId,
          holderOptionId: input.holderOptionId,
          videoTierId: input.videoTierId,
          tournamentId: input.tournamentId,
          note: input.memo ?? null,
          totalAmount: breakdown.total,
          receiptNumber,
        },
      });

      if (input.items?.length) {
        await tx.requestItem.createMany({
          data: input.items.map((it) => ({
            requestId: reqSaved.id,
            category: it.category,
            round: it.round,
            opponent: it.opponent,
            note: it.note ?? null,
            otherInfo: it.otherInfo ?? null,
          })),
        });
      }

      await tx.tournament.update({
        where: { id: input.tournamentId },
        data: { lastUsedAt: new Date(), useCount: { increment: 1 } },
      });

      return reqSaved;
    });

    return NextResponse.json({ id: created.id, receiptNumber, total: breakdown.total });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message ?? 'Bad Request' }, { status: 400 });
  }
}
