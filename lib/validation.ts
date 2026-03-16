import { z } from 'zod'

// leads テーブル用 Zod スキーマ
export const leadSchema = z.object({
  name: z.string().min(1, '氏名を入力してください'),
  category: z.enum(['個人', '法人'], {
    required_error: '区分を選択してください',
  }),
  company_name: z.string().optional(),
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
  phone: z
    .string()
    .min(1, '電話番号を入力してください')
    .regex(
      /^[0-9-]+$/,
      '電話番号は数字とハイフンのみで入力してください'
    ),
  industry: z.string().optional(),
  position: z.string().optional(),
  purpose: z.string().optional(),
  concerns: z.array(z.string()).optional(),
  instagram_id: z.string().optional(),
})

// TypeScript 型定義
export type Lead = z.infer<typeof leadSchema>

// データベースから取得する際の型（id と created_at を含む）
export type LeadRecord = Lead & {
  id: string
  created_at: string
}
