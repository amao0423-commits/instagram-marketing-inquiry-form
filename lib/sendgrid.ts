import sgMail from '@sendgrid/mail'

const sendGridApiKey = process.env.SENDGRID_API_KEY

if (!sendGridApiKey) {
  throw new Error('SendGrid の API キーが設定されていません')
}

sgMail.setApiKey(sendGridApiKey)

export default sgMail
