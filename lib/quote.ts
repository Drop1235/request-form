import { z } from 'zod';

export const QuoteInputSchema = z.object({
  videoTier: z.object({ id: z.string(), name: z.string(), price: z.number() }),
  editOption: z.object({ id: z.string(), name: z.string(), price: z.number() }),
  deliveryMethod: z.object({ id: z.string(), name: z.string(), price: z.number(), shippingPrice: z.number().default(0) }),
  holderOption: z.object({ id: z.string(), name: z.string(), price: z.number() }),
  tournament: z.object({ id: z.string(), priceOverride: z.number().nullable().optional() }),
  discount: z.number().min(0).default(0),
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
  const { videoTier, editOption, deliveryMethod, holderOption, tournament, discount = 0 } = input;
  const video = typeof tournament.priceOverride === 'number' ? tournament.priceOverride : videoTier.price;
  const edit = editOption.price;
  const delivery = deliveryMethod.price;
  const shipping = deliveryMethod.shippingPrice ?? 0;
  const holder = holderOption.price;
  const total = Math.max(0, video + edit + delivery + shipping + holder - (discount || 0));
  return { video, edit, delivery, shipping, holder, discount: discount || 0, total };
}
