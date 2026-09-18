import emailjs from '@emailjs/nodejs'

const OTP_EXPIRES_IN = '10 minutes'

type EmailTemplatePayload = {
  email: string
  name: string
  otp: string
  expires_in: string
}

function getEmailJsConfig() {
  return {
    serviceId: process.env.EMAILJS_SERVICE_ID,
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY,
  }
}

async function sendEmailTemplate(templateId: string | undefined, payload: EmailTemplatePayload): Promise<boolean> {
  if (!templateId) return false

  const { serviceId, publicKey, privateKey } = getEmailJsConfig()
  if (!serviceId || !publicKey || !privateKey) return false

  try {
    await emailjs.send(
      serviceId,
      templateId,
      {
        email: payload.email,
        name: payload.name,
        otp: payload.otp,
        expires_in: payload.expires_in,
      },
      {
        publicKey,
        privateKey,
      },
    )
    return true
  } catch {
    return false
  }
}

export async function sendVerificationOtpEmail(email: string, name: string, otp: string): Promise<boolean> {
  return sendEmailTemplate(process.env.EMAILJS_VERIFICATION_TEMPLATE_ID, {
    email,
    name,
    otp,
    expires_in: OTP_EXPIRES_IN,
  })
}

export async function sendPasswordResetOtpEmail(email: string, name: string, otp: string): Promise<boolean> {
  return sendEmailTemplate(process.env.EMAILJS_PASSWORD_RESET_TEMPLATE_ID, {
    email,
    name,
    otp,
    expires_in: OTP_EXPIRES_IN,
  })
}
