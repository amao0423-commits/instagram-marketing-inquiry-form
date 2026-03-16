import Image from 'next/image'

export const metadata = {
  title: '送信完了',
  description: '資料ダウンロードのお申し込みを受け付けました。',
}

const BANNER_IMAGE_URL = '/banner-account-check.png'
const ACCOUNT_CHECK_URL = 'https://account-check-gold.vercel.app/'
const CONTACT_URL = 'https://www.cocomarke.com/contact'
const TOP_URL = 'https://www.cocomarke.com/'

type ThanksSearchParams = { ref?: string }

export default async function ContactThanksPage(props: {
  searchParams?: Promise<ThanksSearchParams>
}) {
  const params: ThanksSearchParams = await (props.searchParams ?? Promise.resolve({} as ThanksSearchParams))
  const ref = params?.ref
  const accountCheckHref = ref
    ? `${ACCOUNT_CHECK_URL}?ref=${encodeURIComponent(ref)}`
    : ACCOUNT_CHECK_URL

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* 画面上部：御礼タイトルとメール確認本文（中央寄せ） */}
        <header className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            資料ダウンロードのお申し込みありがとうございます
          </h1>
          <p className="text-gray-600 leading-relaxed max-w-xl mx-auto">
            ご入力いただいたメールアドレスに、資料のダウンロードURLをお送りいたしました。メールが届いていない場合は、アドレスの誤入力や、迷惑メールフォルダをご確認ください。
          </p>
        </header>

        {/* バナー＋CTAエリア：薄いグレー背景・角丸セクション・2カラム（PC） */}
        <section className="bg-slate-50 rounded-xl p-4 sm:p-5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-center">
            {/* 左：次のステップを促すテキスト（2行で表示） */}
            <div className="order-2 md:order-1">
              <p className="text-base sm:text-lg text-gray-800 leading-snug font-medium">
                まずは現在のアカウント状況をチェックしてみませんか？
                <br />
                30秒で終わる無料アカウント診断もぜひご活用ください。
              </p>
            </div>
            {/* 右：バナー画像（セクション幅の半分程度の印象） */}
            <div className="order-1 md:order-2">
              <a
                href={accountCheckHref}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                <Image
                  src={BANNER_IMAGE_URL}
                  alt="無料アカウント診断"
                  width={600}
                  height={200}
                  className="w-full h-auto rounded-lg border border-gray-200 object-contain"
                />
              </a>
            </div>
          </div>
        </section>

        {/* フッター：お問い合わせテキスト＋トップへ戻るボタン */}
        <footer className="text-center">
          <p className="text-gray-600 mb-8 leading-relaxed">
            サービス内容について詳しく知りたい方は{' '}
            <a
              href={CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              こちらのお問い合わせフォーム
            </a>{' '}
            よりお気軽にご相談ください。
          </p>
          <div className="flex justify-center">
            <a
              href={TOP_URL}
              className="inline-flex items-center justify-center font-medium py-3 px-8 rounded-xl text-white bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 shadow-lg shadow-violet-500/25 transition-all duration-200"
            >
              トップへ戻る
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
