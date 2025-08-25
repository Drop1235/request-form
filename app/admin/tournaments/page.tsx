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

async function deleteTournament(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  await prisma.tournament.delete({ where: { id } });
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
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block">
              <div className="text-sm">開始日</div>
              <input name="startDate" type="date" className="mt-1 w-full rounded border px-3 py-2" />
            </label>
            <label className="block">
              <div className="text-sm">終了日</div>
              <input name="endDate" type="date" className="mt-1 w-full rounded border px-3 py-2" />
            </label>
          </div>
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

      {/* 既存大会（コンパクト一覧＋削除のみ） */}
      <div className="rounded border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">大会名</th>
              <th className="p-2 text-left">セット数</th>
              <th className="p-2 text-left">公開</th>
              <th className="p-2 text-left">期間</th>
              <th className="p-2 text-left">カテゴリ</th>
              <th className="p-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map(t => (
              <tr key={t.id} className="border-t">
                <td className="p-2">{t.name}</td>
                <td className="p-2">{t.setType === 'ONE_SET' ? '1セット' : '3セット'}</td>
                <td className="p-2">{t.isActive ? '公開' : '非公開'}</td>
                <td className="p-2">{t.startDate?.toISOString().slice(0,10) || '-'} ~ {t.endDate?.toISOString().slice(0,10) || '-'}</td>
                <td className="p-2 max-w-[240px] truncate" title={(t as any).categories?.join(', ') || ''}>{(t as any).categories?.slice(0,3).join(', ') || '-'}</td>
                <td className="p-2">
                  <form action={deleteTournament}>
                    <input type="hidden" name="id" value={t.id} />
                    <button type="submit" className="rounded bg-red-600 px-3 py-1 text-white">削除</button>
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
