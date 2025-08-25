"use client";
import { useMemo, useState, useEffect } from 'react';
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
  initialTournaments: { id: string; name: string; customNotice: string | null; priceOverride: number | null }[];
};

export default function RequestForm(props: Props) {
  const { deliveryMethods, editOptions, holderOptions, videoTiers, initialTournaments } = props;
  const [q, setQ] = useState('');
  const [tournaments, setTournaments] = useState(initialTournaments);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | undefined>();

  const [videoTierId, setVideoTierId] = useState(videoTiers[0]?.id);
  const [editOptionId, setEditOptionId] = useState(editOptions[0]?.id);
  const [deliveryMethodId, setDeliveryMethodId] = useState(deliveryMethods[0]?.id);
  const [holderOptionId, setHolderOptionId] = useState(holderOptions[0]?.id);

  // Basic contact fields
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

  const breakdown = useMemo(() => {
    if (!selectedTournament) return null;
    const vt = videoTiers.find(v => v.id === videoTierId)!;
    const ed = editOptions.find(e => e.id === editOptionId)!;
    const dm = deliveryMethods.find(d => d.id === deliveryMethodId)!;
    const ho = holderOptions.find(h => h.id === holderOptionId)!;
    return calcQuote({
      videoTier: { id: vt.id, name: vt.name, price: vt.price },
      editOption: { id: ed.id, name: ed.name, price: ed.price },
      deliveryMethod: { id: dm.id, name: dm.name, price: dm.price, shippingPrice: (dm as any).shippingPrice ?? 0 },
      holderOption: { id: ho.id, name: ho.name, price: ho.price },
      tournament: { id: selectedTournament.id, priceOverride: selectedTournament.priceOverride ?? undefined },
      discount: 0,
    });
  }, [selectedTournament, videoTierId, editOptionId, deliveryMethodId, holderOptionId, videoTiers, editOptions, deliveryMethods, holderOptions]);

  async function onSubmit() {
    // simple validation
    const nextErrors: Record<string, string> = {};
    if (!selectedTournament) nextErrors.tournament = '大会を選んでください';
    if (!email) nextErrors.email = 'メールを入力してください';
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
        <div className="space-y-6">
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

          {/* Options Section */}
          <div className="rounded-xl border bg-white p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">動画本数 <span className="text-red-600">*</span></label>
              <select className="mt-1 w-full rounded border px-3 py-2" value={videoTierId} onChange={e=>setVideoTierId(e.target.value)}>
                {videoTiers.map(v=> <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">編集オプション <span className="text-red-600">*</span></label>
              <select className="mt-1 w-full rounded border px-3 py-2" value={editOptionId} onChange={e=>setEditOptionId(e.target.value)}>
                {editOptions.map(v=> <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">納品方法 <span className="text-red-600">*</span></label>
              <select className="mt-1 w-full rounded border px-3 py-2" value={deliveryMethodId} onChange={e=>setDeliveryMethodId(e.target.value)}>
                {deliveryMethods.map(v=> <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">ホルダー <span className="text-red-600">*</span></label>
              <select className="mt-1 w-full rounded border px-3 py-2" value={holderOptionId} onChange={e=>setHolderOptionId(e.target.value)}>
                {holderOptions.map(v=> <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          </div>

          {/* Contact Section */}
          <div className="rounded-xl border bg-white p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">メール <span className="text-red-600">*</span></label>
              <input className="mt-1 w-full rounded border px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} placeholder="例）example@mail.com" />
              {errors.email && <div className="mt-1 text-xs text-red-600">{errors.email}</div>}
            </div>
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

          {/* Items up to 6 */}
          <div className="space-y-3 rounded-xl border bg-white p-4">
            <div className="font-semibold">明細（最大6件）</div>
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-start">
                <input placeholder="カテゴリ" className="rounded border px-2 py-1" value={it.category} onChange={e=>updateItem(i,{category:e.target.value})} />
                <input placeholder="ラウンド" className="rounded border px-2 py-1" value={it.round} onChange={e=>updateItem(i,{round:e.target.value})} />
                <input placeholder="相手" className="rounded border px-2 py-1" value={it.opponent} onChange={e=>updateItem(i,{opponent:e.target.value})} />
                <input placeholder="編集メモ" className="rounded border px-2 py-1" value={it.note||""} onChange={e=>updateItem(i,{note:e.target.value})} />
                <div className="flex gap-2">
                  <input placeholder="その他" className="flex-1 rounded border px-2 py-1" value={it.otherInfo||""} onChange={e=>updateItem(i,{otherInfo:e.target.value})} />
                  {items.length>1 && (
                    <button type="button" onClick={()=>removeItem(i)} className="rounded bg-red-100 px-2 text-red-700">削除</button>
                  )}
                </div>
              </div>
            ))}
            {items.length < 6 && (
              <button type="button" onClick={addItem} className="rounded bg-gray-100 px-3 py-1">+ 明細を追加</button>
            )}
          </div>

          <div className="space-y-2 rounded-xl border bg-white p-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} /> 規約に同意します <span className="text-red-600">*</span></label>
            {errors.agree && <div className="text-xs text-red-600">{errors.agree}</div>}
            <textarea placeholder="メモ" className="w-full rounded border px-3 py-2" value={memo} onChange={e=>setMemo(e.target.value)} />
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
