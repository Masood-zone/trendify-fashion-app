import nodemailer from "nodemailer"

export type NotificationEnvironment = Record<string, string | undefined>

export type EmailTransport = {
  sendMail(input: {
    from: string
    to: string
    subject: string
    html: string
    text: string
  }): Promise<{ messageId?: string }>
}

export type ProviderOptions = {
  env?: NotificationEnvironment
  fetcher?: typeof fetch
  transporter?: EmailTransport
}

export function notificationDeliveryEnabled(env: NotificationEnvironment = process.env) {
  return env.NOTIFICATION_DELIVERY_ENABLED !== "false"
}

export function notificationDryRun(env: NotificationEnvironment = process.env) {
  return env.NOTIFICATION_DRY_RUN === "true"
}

export function normalizeSmsRecipient(value: string) {
  const digits = value.replace(/\D/g, "")
  if (digits.startsWith("233")) return digits
  if (digits.startsWith("0") && (digits.length === 10 || digits.length === 11)) {
    return `233${digits.slice(1)}`
  }
  return digits
}

export function smtpTransportOptions(env: NotificationEnvironment = process.env) {
  const host = env.SMTP_HOST?.trim()
  if (!host) throw new Error("SMTP_HOST is not configured")
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error("SMTP credentials are not configured")
  }
  const common = {
    secure: env.SMTP_SECURE === "true",
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  }
  return host.toLowerCase() === "gmail"
    ? { service: "gmail", ...common }
    : { host, port: Number(env.SMTP_PORT || 587), ...common }
}

export async function sendEmail(
  input: { to: string; subject: string; html: string; text: string },
  options: ProviderOptions = {}
) {
  const env = options.env || process.env
  if (!notificationDeliveryEnabled(env)) return "disabled"
  if (notificationDryRun(env)) return "dry-run"
  const from = env.SMTP_FROM || env.SMTP_USER
  if (!from) throw new Error("SMTP_FROM or SMTP_USER is not configured")
  const transporter =
    options.transporter ||
    (nodemailer.createTransport(smtpTransportOptions(env)) as EmailTransport)
  const result = await transporter.sendMail({ from, ...input })
  return result.messageId || "smtp-accepted"
}

type UelloSendResponse = {
  status?: string
  code?: string | number
  desc?: Array<{ message_id?: string; status?: string }> | string
}

export async function sendSms(
  input: { to: string; message: string },
  options: ProviderOptions = {}
) {
  const env = options.env || process.env
  if (!notificationDeliveryEnabled(env)) return "disabled"
  if (notificationDryRun(env)) return "dry-run"
  const endpoint = env.UELLOSEND_API_URL
  const apiKey = env.UELLOSEND_API_KEY
  const senderId = env.UELLOSEND_SENDER_ID || "TrendifyGH"
  if (!endpoint || !apiKey) throw new Error("UelloSend is not configured")
  if (senderId.length > 11) throw new Error("UelloSend sender ID cannot exceed 11 characters")
  const response = await (options.fetcher || fetch)(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      sender_id: senderId,
      recipient: normalizeSmsRecipient(input.to),
      message: input.message,
    }),
  })
  let payload: UelloSendResponse = {}
  try {
    payload = (await response.json()) as UelloSendResponse
  } catch {
    // The HTTP status below still provides a useful provider failure.
  }
  const accepted =
    response.ok &&
    payload.status?.toLowerCase() === "success" &&
    String(payload.code) === "200"
  if (!accepted) {
    throw new Error(
      `UelloSend rejected the message (${response.status}${payload.status ? `, ${payload.status}` : ""})`
    )
  }
  return Array.isArray(payload.desc)
    ? payload.desc.find((entry) => entry.message_id)?.message_id || "uellosend-accepted"
    : "uellosend-accepted"
}
