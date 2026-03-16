'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ''

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

function isValidPhone(val: string): boolean {
  const digits = val.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 11
}

const contactSchema = z
  .object({
    family_name: z.string().min(1, '姓を入力してください'),
    given_name: z.string().min(1, '名を入力してください'),
    email: z.string().email('有効なメールアドレスを入力してください'),
    phone: z
      .string()
      .min(1, '電話番号を入力してください')
      .refine(isValidPhone, '有効な電話番号を入力してください（10〜11桁）'),
    category: z.enum(['法人', '個人']),
    company_name: z.string().optional(),
    industry: z.string().min(1, '業界を選択してください'),
    requested_document: z.string().min(1, 'ご希望資料を選択してください'),
    position: z.string().optional(),
    purpose: z.string().min(1, '資料ご利用の目的を選択してください'),
    concerns: z.array(z.string()).optional(),
    agreePrivacy: z.boolean(),
  })
  .refine((data) => data.agreePrivacy === true, {
    message: 'プライバシーポリシーに同意してください',
    path: ['agreePrivacy'],
  })
  .refine(
    (data) => {
      if (data.category === '法人') {
        return !!data.company_name && data.company_name.trim().length > 0
      }
      return true
    },
    { message: '法人の場合は会社名を入力してください', path: ['company_name'] }
  )

type ContactFormData = z.infer<typeof contactSchema>

const CONCERN_OPTIONS = [
  '料金・プラン',
  '導入の流れ',
  'サポート体制',
  '他社比較',
  'その他',
]

const INDUSTRY_OPTIONS = [
  '飲食・レストラン',
  '美容・サロン',
  'アパレル・ファッション',
  '不動産・住宅',
  'ホテル・観光',
  'EC・通販',
  '教育・スクール',
  '医療・クリニック',
  'その他',
]

const POSITION_OPTIONS = [
  '経営者・役員',
  'マーケティング責任者',
  '宣伝・広報担当',
  '営業責任者',
  '店舗責任者・店長',
  '個人事業主',
  'その他',
]

const PURPOSE_OPTIONS = [
  '選択してください',
  '具体的な導入・外注を検討している',
  '他社サービスと比較検討している',
  '情報収集',
  '将来的な導入のための参考資料として',
  'その他',
]

export default function ContactForm() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      category: '個人',
      requested_document: '',
      concerns: [],
      agreePrivacy: false,
    },
  })

  const [documentTypes, setDocumentTypes] = useState<string[]>([])
  const [documentTypesLoading, setDocumentTypesLoading] = useState(true)
  const [documentTypesError, setDocumentTypesError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/document-types')
      .then((res) => {
        if (!res.ok) throw new Error('資料一覧の取得に失敗しました')
        return res.json()
      })
      .then((body: { documentTypes: string[] }) => {
        if (!cancelled && Array.isArray(body.documentTypes)) {
          setDocumentTypes(body.documentTypes)
          if (body.documentTypes.length > 0) {
            setValue('requested_document', body.documentTypes[0])
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setDocumentTypesError(err?.message ?? '読み込みに失敗しました')
      })
      .finally(() => {
        if (!cancelled) setDocumentTypesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [setValue])

  const category = watch('category')
  const concerns = watch('concerns') ?? []

  const toggleConcern = (value: string) => {
    if (concerns.includes(value)) {
      setValue(
        'concerns',
        concerns.filter((c) => c !== value),
        { shouldValidate: true }
      )
    } else {
      setValue('concerns', [...concerns, value], { shouldValidate: true })
    }
  }

  const [submitError, setSubmitError] = useState<string | null>(null)

  const getRecaptchaToken = useCallback((): Promise<string | null> => {
    if (!RECAPTCHA_SITE_KEY || typeof window === 'undefined' || !window.grecaptcha) {
      return Promise.resolve(null)
    }
    return new Promise((resolve) => {
      window.grecaptcha!.ready(() => {
        window
          .grecaptcha!.execute(RECAPTCHA_SITE_KEY, { action: 'submit' })
          .then(resolve)
          .catch(() => resolve(null))
      })
    })
  }, [])

  const onSubmit = async (data: ContactFormData) => {
    setSubmitError(null)
    try {
      const recaptchaToken = await getRecaptchaToken()
      const name = [data.family_name, data.given_name].filter(Boolean).join(' ').trim()
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          name,
          company_name: data.category === '法人' ? data.company_name : undefined,
          recaptchaToken: recaptchaToken ?? undefined,
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        setSubmitError(result.message ?? '送信に失敗しました')
        return
      }
      const ref = result.ref as string | undefined
      if (ref) {
        router.push(`/contact/thanks?ref=${encodeURIComponent(ref)}`)
      } else {
        router.push('/contact/thanks')
      }
    } catch {
      setSubmitError('送信に失敗しました。しばらくしてからお試しください。')
    }
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      {RECAPTCHA_SITE_KEY && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`}
          strategy="lazyOnload"
        />
      )}
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">資料請求ダウンロード</h1>
        <p className="text-gray-600 mb-8">
          必要事項をご記入のうえ、送信してください。
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 border border-gray-200 rounded-lg shadow-sm p-6"
        >
          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
              {submitError}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="family_name" className="block text-sm font-medium text-gray-700 mb-1">
                姓 <span className="text-red-500">*</span>
              </label>
              <input
                id="family_name"
                {...register('family_name')}
                className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.family_name && (
                <p className="mt-1 text-sm text-red-600">{errors.family_name.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="given_name" className="block text-sm font-medium text-gray-700 mb-1">
                名 <span className="text-red-500">*</span>
              </label>
              <input
                id="given_name"
                {...register('given_name')}
                className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.given_name && (
                <p className="mt-1 text-sm text-red-600">{errors.given_name.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              電話番号 <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              {...register('phone')}
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              法人 / 個人 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input type="radio" value="個人" {...register('category')} className="mr-2" />
                <span className="text-gray-700">個人</span>
              </label>
              <label className="inline-flex items-center">
                <input type="radio" value="法人" {...register('category')} className="mr-2" />
                <span className="text-gray-700">法人</span>
              </label>
            </div>
          </div>

          {category === '法人' && (
            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
                会社名 <span className="text-red-500">*</span>
              </label>
              <input
                id="company_name"
                {...register('company_name')}
                className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.company_name && (
                <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
              業界 <span className="text-red-500">*</span>
            </label>
            <select
              id="industry"
              {...register('industry')}
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">選択してください</option>
              {INDUSTRY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.industry && (
              <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="requested_document" className="block text-sm font-medium text-gray-700 mb-1">
              ご希望資料 <span className="text-red-500">*</span>
            </label>
            <select
              id="requested_document"
              {...register('requested_document')}
              disabled={documentTypesLoading || documentTypes.length === 0}
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {documentTypesLoading ? (
                <option value="">読み込み中...</option>
              ) : documentTypes.length === 0 ? (
                <option value="">資料がありません</option>
              ) : (
                documentTypes.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))
              )}
            </select>
            {documentTypesError && (
              <p className="mt-1 text-sm text-amber-600">{documentTypesError}</p>
            )}
            {errors.requested_document && (
              <p className="mt-1 text-sm text-red-600">{errors.requested_document.message}</p>
            )}
          </div>

          {category === '法人' && (
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                役職
              </label>
              <select
                id="position"
                {...register('position')}
                className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">選択してください</option>
                {POSITION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
              資料ご利用の目的 <span className="text-red-500">*</span>
            </label>
            <select
              id="purpose"
              {...register('purpose')}
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {PURPOSE_OPTIONS.map((opt) => (
                <option key={opt} value={opt === '選択してください' ? '' : opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.purpose && (
              <p className="mt-1 text-sm text-red-600">{errors.purpose.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              お悩み・ご関心（複数選択可）
            </label>
            <div className="space-y-2">
              {CONCERN_OPTIONS.map((opt) => (
                <label key={opt} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={concerns.includes(opt)}
                    onChange={() => toggleConcern(opt)}
                    className="mr-2 rounded border-gray-300"
                  />
                  <span className="text-gray-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('agreePrivacy')}
                className="mt-1 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  プライバシーポリシー
                </Link>
                に同意する
              </span>
            </label>
            {errors.agreePrivacy && (
              <p className="mt-1 text-sm text-red-600">{errors.agreePrivacy.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || documentTypesLoading || documentTypes.length === 0}
            className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '送信中...' : '送信する'}
          </button>
        </form>
      </div>
    </div>
  )
}
