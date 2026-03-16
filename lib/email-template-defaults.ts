/** テンプレート新規作成時に挿入する既定本文（HTML）。本文のテキスト部分だけ書き換えればOK。ボタンは {{documentButtons}} で紐づけた資料が自動挿入。 */
export const DEFAULT_EMAIL_TEMPLATE_BODY_HTML = `<html lang="ja">
<head>
<meta charset="UTF-8">
<title>COCOマーケ 資料ダウンロード</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f7f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#333;">

<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f7f7;padding:40px 0;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 4px 20px rgba(0,0,0,0.05);">

<tr>
<td style="font-size:18px;font-weight:bold;padding-bottom:20px;">
COCOマーケ マーケティング事業部
</td>
</tr>

<tr>
<td style="font-size:16px;line-height:1.8;padding-bottom:20px;">
<p>{{name}} 様</p>

<p>このたびは資料をダウンロードいただき誠にありがとうございます。</p>

<p>ご不明点やご質問がございましたら、どうぞお気軽にお問い合わせください。</p>

<p>
COCOマーケでは、Instagramを活用した効果的なマーケティング戦略を通じて、
企業・店舗の「見られる場所」をつくり、潜在顧客との自然な接点を創出するお手伝いをしています。
Instagram検索やおすすめタブでの上位露出を狙い、貴社・貴店の認知拡大・集客強化につなげます。
</p>
</td>
</tr>

<tr>
<td align="center" style="padding:30px 0;">
{{documentButtons}}
</td>
</tr>

<tr>
<td style="border-top:1px solid #eeeeee;padding-top:25px;font-size:14px;line-height:1.8;">

<p><strong>■ COCOマーケ公式サイト</strong><br>
<a href="https://www.cocomarke.com/" style="color:#111;">https://www.cocomarke.com/</a>
</p>

<p><strong>■ Instagramマーケティング ノウハウ・運用戦略ブログ</strong><br>
<a href="https://www.cocomarke.com/blog" style="color:#111;">ブログはこちら</a>
</p>

<p><strong>■ お問い合わせ</strong><br>
<a href="https://lin.ee/8pdeegx" style="color:#111;">公式LINE（@cocomarke）</a><br>
<a href="https://www.cocomarke.com/contact" style="color:#111;">お問い合わせフォームはこちら</a>
</p>

<p style="font-size:12px;color:#888;margin-top:20px;">
※このメールにご返信いただいてもお答えすることができません。<br>
お問い合わせは上記リンクよりお願いいたします。<br>
※なお、弊社担当よりメールでご連絡させていただく場合もございます。
</p>

</td>
</tr>

<tr>
<td style="border-top:1px solid #eeeeee;padding-top:20px;font-size:12px;color:#888;">
COCOマーケ マーケティング事業部<br>
Mail：cocomarke.official@gmail.com<br>
（平日9:00〜18:00）
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`
