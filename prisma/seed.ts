import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed Delivery Methods
  const deliveryMethods = await Promise.all([
    prisma.deliveryMethod.upsert({
      where: { name: 'DL' },
      update: { price: 0, shippingPrice: 0, description: 'ダウンロード配信' },
      create: { name: 'DL', price: 0, shippingPrice: 0, description: 'ダウンロード配信' },
    }),
    prisma.deliveryMethod.upsert({
      where: { name: 'SD' },
      update: { price: 3300, shippingPrice: 550, description: 'SDカード（送料別）' },
      create: { name: 'SD', price: 3300, shippingPrice: 550, description: 'SDカード（送料別）' },
    }),
    prisma.deliveryMethod.upsert({
      where: { name: 'BD' },
      update: { price: 5500, shippingPrice: 550, description: 'Blu-ray（送料別）' },
      create: { name: 'BD', price: 5500, shippingPrice: 550, description: 'Blu-ray（送料別）' },
    }),
  ]);

  // Seed Edit Options
  const editOptions = await Promise.all([
    prisma.editOption.upsert({
      where: { name: '不要' },
      update: {},
      create: { name: '不要', price: 0, description: '編集不要' },
    }),
    prisma.editOption.upsert({
      where: { name: 'スコア' },
      update: {},
      create: { name: 'スコア', price: 4400, description: 'スコア表示編集' },
    }),
    prisma.editOption.upsert({
      where: { name: 'カット' },
      update: {},
      create: { name: 'カット', price: 4400, description: '不要シーンカット' },
    }),
    prisma.editOption.upsert({
      where: { name: '両方' },
      update: {},
      create: { name: '両方', price: 5500, description: 'スコア表示+不要シーンカット' },
    }),
  ]);

  // Seed Holder Options
  const holderOptions = await Promise.all([
    prisma.holderOption.upsert({
      where: { name: '購入する' },
      update: {},
      create: { name: '購入する', price: 1000, description: 'ホルダー購入' },
    }),
    prisma.holderOption.upsert({
      where: { name: 'しない' },
      update: {},
      create: { name: 'しない', price: 0, description: 'ホルダー不要' },
    }),
  ]);

  // Seed Video Tiers
  const videoTiers = await Promise.all([
    prisma.videoTier.upsert({
      where: { name: '0' },
      update: {},
      create: { name: '0', price: 0, description: '0試合' },
    }),
    prisma.videoTier.upsert({
      where: { name: '1' },
      update: {},
      create: { name: '1', price: 9900, description: '1試合' },
    }),
    prisma.videoTier.upsert({
      where: { name: '2' },
      update: {},
      create: { name: '2', price: 17820, description: '2試合' },
    }),
    prisma.videoTier.upsert({
      where: { name: '3' },
      update: {},
      create: { name: '3', price: 23760, description: '3試合' },
    }),
    prisma.videoTier.upsert({
      where: { name: '4' },
      update: {},
      create: { name: '4', price: 29700, description: '4試合' },
    }),
    prisma.videoTier.upsert({
      where: { name: '5' },
      update: {},
      create: { name: '5', price: 35640, description: '5試合' },
    }),
    prisma.videoTier.upsert({
      where: { name: '6' },
      update: {},
      create: { name: '6', price: 41580, description: '6試合' },
    }),
  ]);

  console.log({
    deliveryMethods,
    editOptions,
    holderOptions,
    videoTiers,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
