import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

const defaultCategories = [
  '12歳以下男子シングルス',
  '12歳以下女子シングルス',
  '14歳以下男子シングルス',
  '14歳以下女子シングルス',
  '16歳以下男子シングルス',
  '16歳以下女子シングルス',
  '18歳以下男子シングルス',
  '18歳以下女子シングルス',
];

async function createTournament(formData: FormData) {
  'use server';
  const name = String(formData.get('name') || '').trim();
  if (!name) return;
  const startDate = formData.get('startDate') ? new Date(String(formData.get('startDate'))) : null;
  const endDate = formData.get('endDate') ? new Date(String(formData.get('endDate'))) : null;
  const isActive = formData.get('isActive') === 'on';
  const customNotice = String(formData.get('customNotice') || '').trim() || null;
  const setType = String(formData.get('setType') || 'ONE_SET') as any;
  const categoriesRaw = String(formData.get('categories') || '').trim();
  const categories = Array.from(new Set(
    (categoriesRaw || defaultCategories.join('\n'))
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean)
  ));

  await prisma.tournament.create({
    data: { name, startDate, endDate, isActive, customNotice, setType, categories },
  });
  revalidatePath('/admin/tournaments');
}

async function updateTournament(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  const name = String(formData.get('name') || '').trim();
  const startDate = formData.get('startDate') ? new Date(String(formData.get('startDate'))) : null;
  const endDate = formData.get('endDate') ? new Date(String(formData.get('endDate'))) : null;
  const isActive = formData.get('isActive') === 'on';
  const customNotice = String(formData.get('customNotice') || '').trim() || null;
  const setType = String(formData.get('setType') || 'ONE_SET') as any;
  const categoriesRaw = String(formData.get('categories') || '').trim();
  const categories = Array.from(new Set(
    (categoriesRaw || defaultCategories.join('\n'))
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean)
  ));

  await prisma.tournament.update({
    where: { id },
    data: { name, startDate, endDate, isActive, customNotice, setType, categories },
  });
  revalidatePath('/admin/tournaments');
}

export default async function AdminTournamentsPage() {
  const tournaments = await prisma.tournament.findMany({ orderBy: [{ createdAt: 'desc' }] });

  return (
    <main className="space-y-6">
      <h2 className="text-lg font-semibold">大会管理</h2>

      {/* 作成フォーム */}
      <form action={createTournament} className="space-y-3 rounded border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <div className="text-sm">大会名</div>
            <input name="name" className="mt-1 w-full rounded border px-3 py-2" required />
          </label>
          <label className="block">
            <div className="text-sm">公開</div>
            <input name="isActive" type="checkbox" className="mt-2" />
          </label>
          <label className="block">
            <div className="text-sm">セット数</div>
            <select name="setType" className="mt-1 w-full rounded border px-3 py-2" defaultValue="ONE_SET">
              <option value="ONE_SET">1セット</option>
              <option value="THREE_SET">3セット</option>
            </select>
          </label>
          <label className="block">
            <div className="text-sm">開始日</div>
            <input name="startDate" type="date" className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label className="block">
            <div className="text-sm">終了日</div>
            <input name="endDate" type="date" className="mt-1 w-full rounded border px-3 py-2" />
          </label>
        </div>
        <label className="block">
          <div className="text-sm">カテゴリ（1行に1つ）</div>
          <textarea
            name="categories"
            rows={6}
            className="mt-1 w-full rounded border px-3 py-2"
            defaultValue={defaultCategories.join('\n')}
            placeholder={defaultCategories.slice(0,2).join('\n')}
          />
        </label>
        <label className="block">
          <div className="text-sm">お知らせ（Markdown）</div>
          <textarea name="customNotice" rows={4} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">作成</button>
      </form>

      {/* 編集フォーム（一覧） */}
      <div className="space-y-4">
        {tournaments.map(t => (
          <form key={t.id} action={updateTournament} className="rounded border p-4 space-y-3">
            <input type="hidden" name="id" value={t.id} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <div className="text-sm">大会名</div>
                <input name="name" defaultValue={t.name} className="mt-1 w-full rounded border px-3 py-2" required />
              </label>
              <label className="block">
                <div className="text-sm">公開</div>
                <input name="isActive" type="checkbox" className="mt-2" defaultChecked={t.isActive} />
              </label>
              <label className="block">
                <div className="text-sm">セット数</div>
                <select name="setType" className="mt-1 w-full rounded border px-3 py-2" defaultValue={t.setType as any}>
                  <option value="ONE_SET">1セット</option>
                  <option value="THREE_SET">3セット</option>
                </select>
              </label>
              <label className="block">
                <div className="text-sm">開始日</div>
                <input name="startDate" type="date" className="mt-1 w-full rounded border px-3 py-2" defaultValue={t.startDate ? t.startDate.toISOString().slice(0,10) : ''} />
              </label>
              <label className="block">
                <div className="text-sm">終了日</div>
                <input name="endDate" type="date" className="mt-1 w-full rounded border px-3 py-2" defaultValue={t.endDate ? t.endDate.toISOString().slice(0,10) : ''} />
              </label>
            </div>
            <label className="block">
              <div className="text-sm">カテゴリ（1行に1つ）</div>
              <textarea
                name="categories"
                rows={6}
                className="mt-1 w-full rounded border px-3 py-2"
                defaultValue={(t as any).categories?.length ? (t as any).categories.join('\n') : defaultCategories.join('\n')}
              />
            </label>
            <label className="block">
              <div className="text-sm">お知らせ（Markdown）</div>
              <textarea name="customNotice" rows={4} className="mt-1 w-full rounded border px-3 py-2" defaultValue={t.customNotice || ''} />
            </label>
            <div className="flex gap-2">
              <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">保存</button>
            </div>
          </form>
        ))}
      </div>
    </main>
  );
}
