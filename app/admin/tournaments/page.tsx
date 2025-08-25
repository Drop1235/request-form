import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function createTournament(formData: FormData) {
  'use server';
  const name = String(formData.get('name') || '').trim();
  if (!name) return;
  const startDate = formData.get('startDate') ? new Date(String(formData.get('startDate'))) : null;
  const endDate = formData.get('endDate') ? new Date(String(formData.get('endDate'))) : null;
  const isActive = formData.get('isActive') === 'on';
  const priceOverrideRaw = String(formData.get('priceOverride') || '').trim();
  const priceOverride = priceOverrideRaw ? Number(priceOverrideRaw) : null;
  const customNotice = String(formData.get('customNotice') || '').trim() || null;
  const setType = String(formData.get('setType') || 'ONE_SET') as any;
  const categoriesRaw = String(formData.get('categories') || '').trim();
  const categories = categoriesRaw
    ? Array.from(new Set(categoriesRaw.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean)))
    : [];

  await prisma.tournament.create({
    data: { name, startDate, endDate, isActive, priceOverride, customNotice, setType, categories },
  });
  revalidatePath('/admin/tournaments');
}

async function toggleActive(id: string, active: boolean) {
  'use server';
  await prisma.tournament.update({ where: { id }, data: { isActive: active } });
  revalidatePath('/admin/tournaments');
}

export default async function AdminTournamentsPage() {
  const tournaments = await prisma.tournament.findMany({ orderBy: [{ createdAt: 'desc' }] });

  return (
    <main className="space-y-6">
      <h2 className="text-lg font-semibold">Tournaments</h2>

      <form action={createTournament} className="space-y-3 rounded border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <div className="text-sm">Name</div>
            <input name="name" className="mt-1 w-full rounded border px-3 py-2" required />
          </label>
          <label className="block">
            <div className="text-sm">Active</div>
            <input name="isActive" type="checkbox" className="mt-2" />
          </label>
          <label className="block">
            <div className="text-sm">Set Type</div>
            <select name="setType" className="mt-1 w-full rounded border px-3 py-2" defaultValue="ONE_SET">
              <option value="ONE_SET">1セット</option>
              <option value="THREE_SET">3セット</option>
            </select>
          </label>
          <label className="block">
            <div className="text-sm">Start Date</div>
            <input name="startDate" type="date" className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label className="block">
            <div className="text-sm">End Date</div>
            <input name="endDate" type="date" className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label className="block">
            <div className="text-sm">Price Override (円)</div>
            <input name="priceOverride" type="number" inputMode="numeric" className="mt-1 w-full rounded border px-3 py-2" />
          </label>
        </div>
        <label className="block">
          <div className="text-sm">Categories (1行に1つ、またはカンマ区切り)</div>
          <textarea name="categories" rows={3} className="mt-1 w-full rounded border px-3 py-2" placeholder="例: 12歳以下男子シングルス\n12歳以下女子シングルス" />
        </label>
        <label className="block">
          <div className="text-sm">Custom Notice (Markdown)</div>
          <textarea name="customNotice" rows={4} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">Create</button>
      </form>

      <div className="rounded border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Set</th>
              <th className="p-2 text-left">Active</th>
              <th className="p-2 text-left">Dates</th>
              <th className="p-2 text-left">Override</th>
              <th className="p-2 text-left">Categories</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map(t => (
              <tr key={t.id} className="border-t">
                <td className="p-2">{t.name}</td>
                <td className="p-2">{t.setType === 'ONE_SET' ? '1セット' : '3セット'}</td>
                <td className="p-2">{t.isActive ? 'Yes' : 'No'}</td>
                <td className="p-2">{t.startDate?.toISOString().slice(0,10) || '-'} ~ {t.endDate?.toISOString().slice(0,10) || '-'}</td>
                <td className="p-2">{t.priceOverride ?? '-'}</td>
                <td className="p-2 max-w-[240px] truncate" title={(t as any).categories?.join(', ') || ''}>{(t as any).categories?.slice(0,3).join(', ') || '-'}</td>
                <td className="p-2">
                  <form action={async (formData) => {
                    'use server';
                    const id = t.id;
                    const active = !t.isActive;
                    await toggleActive(id, active);
                  }}>
                    <button type="submit" className="rounded bg-gray-100 px-3 py-1">{t.isActive ? 'Deactivate' : 'Activate'}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
