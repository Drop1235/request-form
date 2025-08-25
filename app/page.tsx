export default function Home() {
  return (
    <main className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border bg-white px-6 py-12 md:px-10">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            大会動画リクエストを、かんたん・スマートに。
          </h1>
          <p className="mt-4 text-gray-600">
            競技現場に最適化した申込フォームと、自動見積りでスムーズに。国体優勝の実績（杉村太蔵さんとペアでの優勝）に裏打ちされた撮影・編集品質をご提供します。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/request" className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2.5 text-white shadow hover:bg-blue-700">
              申込をはじめる
            </a>
            <a href="/admin/tournaments" className="inline-flex items-center justify-center rounded-md border px-5 py-2.5 text-gray-800 hover:bg-gray-50">
              大会を管理する
            </a>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100" />
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-6">
          <div className="text-sm font-semibold text-blue-600">ライブ見積り</div>
          <div className="mt-2 text-gray-700">オプション選択に合わせて即時に料金を試算。価格の透明性を担保します。</div>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <div className="text-sm font-semibold text-blue-600">大会に最適化</div>
          <div className="mt-2 text-gray-700">大会ごとの注意事項や特別価格にも対応。運営・選手双方にとって分かりやすく。</div>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <div className="text-sm font-semibold text-blue-600">実績に裏打ち</div>
          <div className="mt-2 text-gray-700">国体優勝（杉村太蔵さんとペア）などの競技実績に基づく撮影・編集クオリティ。</div>
        </div>
      </section>

      {/* Profile Section */}
      <section className="rounded-2xl border bg-white px-6 py-8 md:px-10">
        <h2 className="text-xl md:text-2xl font-semibold">プロフィール</h2>
        <div className="mt-4 space-y-3 text-gray-700">
          <p>
            株式会社リコーでは生産管理部門で設計生産プロセスの改革を主導。新規事業部門では事業立ち上げ・売却を担当。2022年に副業で当社を設立。共同CEO制を導入し、代表取締役 Co-CEOを務める。
          </p>
          <div>
            <div className="font-medium">＜テニス競技歴＞</div>
            <p>
              高校時代に国民体育大会で優勝（ペア：杉村太蔵氏）を果たし、大学では全日本学生テニス選手権（インカレ）ダブルス優勝。卒業後も全日本選手権で2度のダブルスベスト8入り。JTAランキング最高位はシングルス38位、ダブルス20位。
            </p>
          </div>
        </div>
        <div className="mt-6">
          <a
            href="https://zentori-landing.netlify.app/"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700"
          >
            ゼントリ（撮影サービス）を見る
          </a>
        </div>
      </section>
    </main>
  );
}
