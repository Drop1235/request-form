"use client";
import { useMemo, useState, useEffect, useRef } from 'react';
import { calcQuote } from '@/lib/quote';
import sanitizeHtml from 'sanitize-html';
import { marked } from 'marked';

type DeliveryMethodLite = { id: string; name: string; price: number; shippingPrice?: number | null };
type EditOptionLite = { id: string; name: string; price: number };
type HolderOptionLite = { id: string; name: string; price: number };
type VideoTierLite = { id: string; name: string; price: number };

type Props = {
  deliveryMethods: DeliveryMethodLite[];
  editOptions: EditOptionLite[];
  holderOptions: HolderOptionLite[];
  videoTiers: VideoTierLite[];
  initialTournaments: { id: string; name: string; customNotice: string | null; priceOverride: number | null; setType?: 'ONE_SET' | 'THREE_SET' }[];
};

export default function RequestForm(props: Props) {
  const { deliveryMethods, editOptions, holderOptions, videoTiers, initialTournaments } = props;
  const [q, setQ] = useState('');
  const [tournaments, setTournaments] = useState(initialTournaments);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | undefined>();
  const formRef = useRef<HTMLDivElement | null>(null);

  const [videoTierId, setVideoTierId] = useState(videoTiers[0]?.id);
  const [editOptionId, setEditOptionId] = useState(editOptions[0]?.id);
  const [deliveryMethodId, setDeliveryMethodId] = useState(deliveryMethods[0]?.id);
  const [holderOptionId, setHolderOptionId] = useState(holderOptions[0]?.id);

  // Basic contact fields
  // メールは使わない
  const [email, setEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [phone, setPhone] = useState("");

  // Up to 6 items
  type Item = { category: string; round: string; opponent: string; note?: string; otherInfo?: string };
  const [items, setItems] = useState<Item[]>([{ category: "", round: "", opponent: "" }]);
  const addItem = () => {
    if (items.length < 6) setItems([...items, { category: "", round: "", opponent: "" }]);
  };
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, patch: Partial<Item>) => {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const [agree, setAgree] = useState(false);
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ receiptNumber: string; total: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // カテゴリの候補（仮）
  const categoryOptions = [
    '12歳以下男子シングルス',
    '12歳以下女子シングルス',
    '14歳以下男子シングルス',
    '14歳以下女子シングルス',
    '16歳以下男子シングルス',
    '16歳以下女子シングルス',
    '18歳以下男子シングルス',
    '18歳以下女子シングルス',
  ];

  // items.length に合わせて videoTierId を自動同期（API互換のため）
  useEffect(() => {
    const tier = videoTiers.find(v => v.name === String(items.length));
    if (tier && tier.id !== videoTierId) setVideoTierId(tier.id);
  }, [items.length, videoTiers, videoTierId]);

  // Search tournaments
  useEffect(() => {
    const handler = setTimeout(async () => {
      const url = q ? `/api/tournaments?q=${encodeURIComponent(q)}` : `/api/tournaments`;
      const res = await fetch(url);
      const data = await res.json();
      setTournaments(data.tournaments);
    }, 250);
    return () => clearTimeout(handler);
  }, [q]);

  const selectedTournament = useMemo(() => tournaments.find(t => t.id === selectedTournamentId), [tournaments, selectedTournamentId]);

  // Scroll to the form section after a tournament is selected
  useEffect(() => {
    if (selectedTournament && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedTournament]);

  const breakdown = useMemo(() => {
    if (!selectedTournament) return null;
    const vt = videoTiers.find(v => v.id === videoTierId);
    const ed = editOptions.find(e => e.id === editOptionId);
    const dm = deliveryMethods.find(d => d.id === deliveryMethodId);
    const ho = holderOptions.find(h => h.id === holderOptionId);
    if (!vt || !ed || !dm || !ho) return null;
    return calcQuote({
      videoTier: { id: vt.id, name: vt.name, price: vt.price },
      editOption: { id: ed.id, name: ed.name, price: ed.price },
      deliveryMethod: { id: dm.id, name: dm.name, price: dm.price, shippingPrice: (dm as any).shippingPrice ?? 0 },
      holderOption: { id: ho.id, name: ho.name, price: ho.price },
      tournament: { id: selectedTournament.id, priceOverride: selectedTournament.priceOverride ?? undefined, setType: selectedTournament.setType },
      videoCount: items.length,
      discount: 0,
    });
  }, [selectedTournament, videoTierId, editOptionId, deliveryMethodId, holderOptionId, videoTiers, editOptions, deliveryMethods, holderOptions, items.length]);

  // Safely render custom notice (Markdown -> HTML)
  const noticeHtml = useMemo(() => {
    const md = selectedTournament?.customNotice;
    if (!md) return '';
    try {
      const parsed = (marked.parse as unknown as (src: string) => string | Promise<string>)(md);
      const html = typeof parsed === 'string' ? parsed : '';
      return sanitizeHtml(html);
    } catch {
      return '';
    }
  }, [selectedTournament?.customNotice]);

  async function onSubmit() {
    // simple validation
    const nextErrors: Record<string, string> = {};
    if (!selectedTournament) nextErrors.tournament = '大会を選んでください';
    // email は任意
    if (!customerName) nextErrors.customerName = '購入者名を入力してください';
    if (!playerName) nextErrors.playerName = '選手名を入力してください';
    if (!phone) nextErrors.phone = '電話番号を入力してください';
    if (!agree) nextErrors.agree = '規約に同意してください';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!selectedTournament || !breakdown) return;
    setSubmitting(true);
    setResult(null);
    try {
      const payload = {
        tournamentId: selectedTournament.id,
        email,
        customerName,
        playerName,
        phone,
        deliveryMethodId: deliveryMethodId!,
        editOptionId: editOptionId!,
        holderOptionId: holderOptionId!,
        videoTierId: videoTierId!,
        items,
        agree,
        memo,
      };
      const res = await fetch('/api/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult({ receiptNumber: data.receiptNumber, total: data.total });
    } catch (e) {
      alert('送信に失敗しました。入力内容をご確認ください。');
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium">大会検索 <span className="text-red-600">*</span></label>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="大会名で検索"
          className="mt-1 w-full rounded border px-3 py-2"
        />
        <div className="mt-2 max-h-44 overflow-auto rounded border">
          {tournaments.map((t) => (
            <button
              key={t.id}
              className={`block w-full text-left px-3 py-2 hover:bg-gray-100 ${selectedTournamentId===t.id?'bg-blue-50':''}`}
              onClick={() => setSelectedTournamentId(t.id)}
            >
              {t.name}
            </button>
          ))}
          {tournaments.length === 0 && <div className="p-3 text-sm text-gray-500">該当なし</div>}
        </div>
        {errors.tournament && <div className="mt-1 text-xs text-red-600">{errors.tournament}</div>}
      </div>

      {selectedTournament && (
        <div ref={formRef} className="space-y-6">
          {/* Notice */}
          {selectedTournament.customNotice && (
            <div className="rounded border p-3 bg-amber-50">
              <div className="font-semibold mb-1">大会からの注意事項</div>
              <div
                className="prose max-w-none text-sm"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(marked.parse(selectedTournament.customNotice) as string),
                }}
              />
            </div>
          )}

          {/* 編集オプション（全体の設問として独立） */}
          <div className="space-y-2 rounded-xl border bg-white p-4">
            <div className="text-sm font-medium">オプション（編集）を利用しますか？ <span className="text-red-600">*</span></div>
            <div className="mt-1 grid grid-cols-1 gap-1 text-sm">
              {(() => {
                const setType = selectedTournament?.setType ?? 'ONE_SET';
                const price = (label: string) => {
                  const p1: Record<string, number> = { '利用しない': 0, 'ポイント間カット': 3300, 'ゲームカウントを表示': 3300, '両方': 4950 };
                  const p3: Record<string, number> = { '利用しない': 0, 'ポイント間カット': 4400, 'ゲームカウントを表示': 4400, '両方': 5500 };
                  return (setType==='ONE_SET'?p1:p3)[label] ?? 0;
                };
                const mapNameToId = (n: '不要'|'カット'|'スコア'|'両方') => editOptions.find(e=>e.name===n)?.id;
                const choices: Array<{label:string,id?:string}> = [
                  { label: '利用しない', id: mapNameToId('不要') },
                  { label: 'ポイント間カット', id: mapNameToId('カット') },
                  { label: 'ゲームカウントを表示', id: mapNameToId('スコア') },
                  { label: '両方', id: mapNameToId('両方') },
                ];
                return choices.map(c => (
                  <label key={c.label} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="edit-global"
                      checked={editOptionId===c.id}
                      onChange={()=> c.id && setEditOptionId(c.id)}
                    />
                    {c.label}（{price(c.label).toLocaleString()}円）
                  </label>
                ));
              })()}
            </div>
          </div>
          

          {/* Options Section */}
          {/* 規約同意（先頭） */}
          <div className="space-y-2 rounded-xl border bg-white p-4">
            <div className="text-sm">
              利用規約をご確認の上、同意いただける場合はチェックを入れてください。{' '}
              <a className="text-blue-600 underline" href="https://sites.google.com/view/tempmachi20220723/zentori-terms_junior" target="_blank" rel="noreferrer">利用規約</a>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} /> 同意します <span className="text-red-600">*</span></label>
            {errors.agree && <div className="text-xs text-red-600">{errors.agree}</div>}
          </div>

          {/* Contact Section （メールは非表示）*/}
          <div className="rounded-xl border bg-white p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">購入者 <span className="text-red-600">*</span></label>
              <input className="mt-1 w-full rounded border px-3 py-2" value={customerName} onChange={e=>setCustomerName(e.target.value)} placeholder="お名前" />
              {errors.customerName && <div className="mt-1 text-xs text-red-600">{errors.customerName}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium">選手 <span className="text-red-600">*</span></label>
              <input className="mt-1 w-full rounded border px-3 py-2" value={playerName} onChange={e=>setPlayerName(e.target.value)} placeholder="選手名" />
              {errors.playerName && <div className="mt-1 text-xs text-red-600">{errors.playerName}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium">電話 <span className="text-red-600">*</span></label>
              <input className="mt-1 w-full rounded border px-3 py-2" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="ハイフンなし" />
              {errors.phone && <div className="mt-1 text-xs text-red-600">{errors.phone}</div>}
            </div>
          </div>

          {/* Quote Section */}
          <div className="rounded-xl border p-3 bg-gradient-to-b from-blue-50 to-blue-100 sticky top-24">
            <div className="font-semibold mb-1">見積り</div>
            {!breakdown && <div className="text-sm text-gray-500">選択してください</div>}
            {breakdown && (
              <ul className="text-sm space-y-1">
                <li>Video: {breakdown.video.toLocaleString()}円</li>
                <li>Edit: {breakdown.edit.toLocaleString()}円</li>
                <li>Delivery: {breakdown.delivery.toLocaleString()}円</li>
                <li>Shipping: {breakdown.shipping.toLocaleString()}円</li>
                <li>Holder: {breakdown.holder.toLocaleString()}円</li>
                <li className="mt-2 text-lg font-bold">合計: {breakdown.total.toLocaleString()}円</li>
              </ul>
            )}
          </div>

          {/* 1本目〜の設問（繰り返し） */}
          <div className="space-y-4 rounded-xl border bg-white p-4">
            <div className="font-semibold">動画の情報（最大6本）</div>
            {items.map((it, i) => (
              <div key={i} className="space-y-2 rounded border p-3">
                <div className="text-sm font-medium">{i+1}本目</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {/* カテゴリ（ラジオ） */}
                  <div>
                    <div className="text-sm">カテゴリ <span className="text-red-600">*</span></div>
                    <div className="mt-1 grid grid-cols-1 gap-1">
                      {categoryOptions.map(opt => (
                        <label key={opt} className="flex items-center gap-2 text-sm">
                          <input type="radio" name={`cat-${i}`} checked={it.category===opt} onChange={()=>updateItem(i,{category:opt})} /> {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm">ラウンド <span className="text-red-600">*</span></label>
                    <input className="mt-1 w-full rounded border px-2 py-1" value={it.round} onChange={e=>updateItem(i,{round:e.target.value})} placeholder="例）1R, SF, Aブロック" />
                  </div>
                  <div>
                    <label className="block text-sm">対戦相手 <span className="text-red-600">*</span></label>
                    <input className="mt-1 w-full rounded border px-2 py-1" value={it.opponent} onChange={e=>updateItem(i,{opponent:e.target.value})} />
                  </div>
                </div>

                {/* per-video area no edit radios, delete button removed per request */}
              </div>
            ))}

            {/* 追加質問 */}
            {items.length < 6 && (
              <div className="space-y-2">
                <div className="text-sm">他にも購入する動画はありますか？</div>
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2"><input type="radio" name="moreVideos" onChange={addItem} /> はい</label>
                  <label className="flex items-center gap-2"><input type="radio" name="moreVideos" onChange={()=>{ /* いいえ → 何もしない */ }} /> いいえ</label>
                </div>
              </div>
            )}
          </div>

          {/* 最後の設問群：納品・ホルダー・その他要望 */}
          <div className="space-y-4 rounded-xl border bg-white p-4">
            <div>
              <div className="text-sm font-medium">納品方法 <span className="text-red-600">*</span></div>
              <div className="mt-1 grid grid-cols-1 gap-1 text-sm">
                {deliveryMethods.map(dm => {
                  const shipping = (dm as any).shippingPrice ?? 0;
                  const label = dm.price === 0
                    ? `${dm.name}（無料）`
                    : `${dm.name}（${dm.price.toLocaleString()}円${shipping>0?`＋送料${shipping.toLocaleString()}円`:''}）`;
                  return (
                    <label key={dm.id} className="flex items-center gap-2">
                      <input type="radio" name="delivery" checked={deliveryMethodId===dm.id} onChange={()=>setDeliveryMethodId(dm.id)} /> {label}
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">MicroSDカードホルダー <span className="text-red-600">*</span></div>
              <div className="mt-1 grid grid-cols-1 gap-1 text-sm">
                {holderOptions.map(ho => {
                  const label = ho.price > 0 ? `${ho.name}（${ho.price.toLocaleString()}円）` : ho.name;
                  return (
                    <label key={ho.id} className="flex items-center gap-2">
                      <input type="radio" name="holder" checked={holderOptionId===ho.id} onChange={()=>setHolderOptionId(ho.id)} /> {label}
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">その他要望（自由記述）</div>
              <textarea placeholder="ご要望など" className="mt-1 w-full rounded border px-3 py-2" value={memo} onChange={e=>setMemo(e.target.value)} />
            </div>
          </div>

          <div>
            <button
              type="button"
              disabled={!breakdown || !agree || submitting}
              onClick={onSubmit}
              className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {submitting ? '送信中...' : '送信'}
            </button>
            {result && (
              <div className="mt-2 text-sm">
                受付番号: <span className="font-mono">{result.receiptNumber}</span> / 合計: {result.total.toLocaleString()}円
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
