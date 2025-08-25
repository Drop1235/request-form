import { z } from 'zod';

export const QuoteInputSchema = z.object({
  videoTier: z.object({ id: z.string(), name: z.string(), price: z.number() }),
  editOption: z.object({ id: z.string(), name: z.string(), price: z.number() }),
  deliveryMethod: z.object({ id: z.string(), name: z.string(), price: z.number(), shippingPrice: z.number().default(0) }),
  holderOption: z.object({ id: z.string(), name: z.string(), price: z.number() }),
  tournament: z.object({ id: z.string(), priceOverride: z.number().nullable().optional(), setType: z.enum(['ONE_SET','THREE_SET']).optional() }),
  videoCount: z.number().int().min(0).max(6).optional(),
  discount: z.number().min(0).default(0),
  editTotalOverride: z.number().min(0).optional(),
});

export type QuoteInput = z.infer<typeof QuoteInputSchema>;

export type QuoteBreakdown = {
  video: number;
  edit: number;
  delivery: number;
  shipping: number;
  holder: number;
  discount: number;
  total: number;
};

export function calcQuote(input: QuoteInput): QuoteBreakdown {
  const { videoTier, editOption, deliveryMethod, holderOption, tournament, discount = 0, editTotalOverride } = input;

  // Pricing tables
  const oneSetVideo: Record<number, number> = { 0: 0, 1: 6600, 2: 12540, 3: 17820, 4: 23100, 5: 28380, 6: 33660 };
  const threeSetVideo: Record<number, number> = { 0: 0, 1: 9900, 2: 17820, 3: 23760, 4: 29700, 5: 35640, 6: 41580 };
  const setType = tournament.setType ?? 'ONE_SET';
  const vc = Math.max(0, Math.min(6, (input.videoCount ?? Number(videoTier.name)) || 0));
  const video = typeof tournament.priceOverride === 'number'
    ? tournament.priceOverride
    : (setType === 'ONE_SET' ? oneSetVideo[vc] : threeSetVideo[vc]);

  // Edit price override by set type
  const editPriceTableOne: Record<string, number> = { '不要': 0, 'スコア': 3300, 'カット': 3300, '両方': 4950 };
  const editPriceTableThree: Record<string, number> = { '不要': 0, 'スコア': 4400, 'カット': 4400, '両方': 5500 };
  const edit = typeof editTotalOverride === 'number'
    ? editTotalOverride
    : (setType === 'ONE_SET' ? editPriceTableOne : editPriceTableThree)[editOption.name] ?? editOption.price;
  const delivery = deliveryMethod.price;
  const shipping = deliveryMethod.shippingPrice ?? 0;
  const holder = holderOption.price;
  const total = Math.max(0, video + edit + delivery + shipping + holder - (discount || 0));
  return { video, edit, delivery, shipping, holder, discount: discount || 0, total };
}
