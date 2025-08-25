import { prisma } from '@/lib/prisma';
import RequestForm from './request-form';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function RequestPage() {
  const [masters, tournaments] = await Promise.all([
    Promise.all([
      prisma.deliveryMethod.findMany({ orderBy: { name: 'asc' } }),
      prisma.editOption.findMany({ orderBy: { name: 'asc' } }),
      prisma.holderOption.findMany({ orderBy: { name: 'asc' } }),
      prisma.videoTier.findMany({ orderBy: { name: 'asc' } }),
    ]),
    prisma.tournament.findMany({
      where: { isActive: true },
      orderBy: [{ lastUsedAt: 'desc' }, { createdAt: 'desc' }],
      take: 20,
      select: { id: true, name: true, customNotice: true, priceOverride: true },
    }),
  ]);

  const [deliveryMethods, editOptions, holderOptions, videoTiers] = masters;

  return (
    <main className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <section className="lg:col-span-2">
        <RequestForm
          deliveryMethods={deliveryMethods}
          editOptions={editOptions}
          holderOptions={holderOptions}
          videoTiers={videoTiers}
          initialTournaments={tournaments}
        />
      </section>
      <aside className="border rounded p-4 bg-gray-50">
        <h2 className="font-semibold mb-2">注意事項</h2>
        <div className="text-sm text-gray-600">
          大会選択後、ここにカスタム注意事項が表示されます。
        </div>
      </aside>
    </main>
  );
}
