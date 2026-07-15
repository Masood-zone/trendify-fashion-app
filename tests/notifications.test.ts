import assert from "node:assert/strict"
import test from "node:test"

import { NotificationTemplate } from "../app/generated/prisma/enums"
import { orderNotificationPayload } from "../services/notifications/events"
import {
  normalizeSmsRecipient,
  sendEmail,
  sendSms,
  smtpTransportOptions,
  type EmailTransport,
  type NotificationEnvironment,
} from "../services/notifications/providers"
import {
  enqueueNotificationDeliveries,
  retryDelayMs,
  sanitizeDeliveryError,
} from "../services/notifications/outbox"
import {
  buildOutboundCopy,
  renderAuthOtpMessage,
} from "../services/notifications/templates"

const configuredEnv: NotificationEnvironment = {
  NOTIFICATION_DELIVERY_ENABLED: "true",
  NOTIFICATION_DRY_RUN: "false",
  SMTP_HOST: "smtp.example.test",
  SMTP_PORT: "587",
  SMTP_SECURE: "false",
  SMTP_USER: "mailer@example.test",
  SMTP_PASS: "secret",
  SMTP_FROM: "Trendify <no-reply@example.test>",
  UELLOSEND_API_URL: "https://uellosend.example.test/quicksend/",
  UELLOSEND_API_KEY: "api-key",
  UELLOSEND_SENDER_ID: "TrendifyGH",
}

test("SMTP provider sends branded HTML and plain text through an injected transport", async () => {
  let sent: Parameters<EmailTransport["sendMail"]>[0] | undefined
  const transporter: EmailTransport = {
    async sendMail(input) {
      sent = input
      return { messageId: "smtp-message-1" }
    },
  }
  const message = await renderAuthOtpMessage({
    otp: "123456",
    type: "email-verification",
  })
  const id = await sendEmail(
    {
      to: "customer@example.test",
      subject: message.subject,
      html: message.html,
      text: message.text,
    },
    { env: configuredEnv, transporter }
  )
  assert.equal(id, "smtp-message-1")
  assert.equal(sent?.to, "customer@example.test")
  assert.match(sent?.html || "", /Fashion Trendify GH/)
  assert.match(sent?.text || "", /123456/)
  assert.equal(sent?.from, "Trendify <no-reply@example.test>")
})

test("SMTP configuration supports Gmail service mode and rejects missing credentials", () => {
  assert.deepEqual(
    smtpTransportOptions({
      SMTP_HOST: "gmail",
      SMTP_SECURE: "false",
      SMTP_USER: "mail@example.test",
      SMTP_PASS: "app-password",
    }),
    {
      service: "gmail",
      secure: false,
      auth: { user: "mail@example.test", pass: "app-password" },
    }
  )
  assert.throws(() => smtpTransportOptions({ SMTP_HOST: "gmail" }), /credentials/)
})

test("UelloSend uses the official quicksend JSON contract and records its message id", async () => {
  let requestBody: Record<string, string> | undefined
  const fetcher = (async (_input: string | URL | Request, init?: RequestInit) => {
    requestBody = JSON.parse(String(init?.body)) as Record<string, string>
    return new Response(
      JSON.stringify({
        status: "Success",
        code: "200",
        desc: [{ status: "ESME_ROK", message_id: "uellosend-1" }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  }) as typeof fetch

  const id = await sendSms(
    { to: "024 123 4567", message: "Order confirmed" },
    { env: configuredEnv, fetcher }
  )
  assert.equal(id, "uellosend-1")
  assert.deepEqual(requestBody, {
    api_key: "api-key",
    sender_id: "TrendifyGH",
    recipient: "233241234567",
    message: "Order confirmed",
  })
  assert.equal(normalizeSmsRecipient("+233 24 123 4567"), "233241234567")
})

test("UelloSend rejects HTTP-success responses that the provider marks as failed", async () => {
  const fetcher = (async () =>
    new Response(JSON.stringify({ status: "Failed", code: "400" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })) as typeof fetch
  await assert.rejects(
    sendSms(
      { to: "0241234567", message: "Test" },
      { env: configuredEnv, fetcher }
    ),
    /rejected/
  )
})

test("delivery flags prevent provider calls and dry run returns an auditable id", async () => {
  let called = false
  const fetcher = (async () => {
    called = true
    return new Response()
  }) as typeof fetch
  assert.equal(
    await sendSms(
      { to: "0241234567", message: "Test" },
      { env: { NOTIFICATION_DELIVERY_ENABLED: "false" }, fetcher }
    ),
    "disabled"
  )
  assert.equal(
    await sendSms(
      { to: "0241234567", message: "Test" },
      { env: { NOTIFICATION_DRY_RUN: "true" }, fetcher }
    ),
    "dry-run"
  )
  assert.equal(called, false)
})

test("commerce copy distinguishes payment, status, tracking, and refund events", () => {
  const payload = {
    customerName: "Ama",
    orderNumber: "TRD-123",
    amountPesewas: 25_000,
    currency: "GHS",
    orderUrl: "https://trendify.example/orders/TRD-123",
  }
  assert.match(
    buildOutboundCopy(NotificationTemplate.PAYMENT_SUCCESS, payload).subject,
    /Payment confirmed/
  )
  assert.match(
    buildOutboundCopy(NotificationTemplate.ORDER_STATUS_UPDATED, {
      ...payload,
      status: "OUT_FOR_DELIVERY",
    }).sms,
    /out for delivery/
  )
  assert.match(
    buildOutboundCopy(NotificationTemplate.TRACKING_UPDATED, {
      ...payload,
      carrier: "Ghana Post",
      trackingNumber: "GH-001",
    }).sms,
    /GH-001/
  )
  assert.match(
    buildOutboundCopy(NotificationTemplate.REFUND_CONFIRMED, payload).subject,
    /Refund confirmed/
  )
})

test("order links distinguish member and browser-scoped guest access", () => {
  const previous = process.env.BETTER_AUTH_URL
  process.env.BETTER_AUTH_URL = "https://trendify.example"
  try {
    const base = {
      id: "order-1",
      orderNumber: "TRD-123",
      customerName: "Ama",
      email: "ama@example.test",
      phone: "+233241234567",
      totalPesewas: 10_000,
      currency: "GHS",
    }
    assert.equal(
      orderNotificationPayload({ ...base, userId: "user-1" }).orderUrl,
      "https://trendify.example/account/orders/TRD-123"
    )
    const guest = orderNotificationPayload({ ...base, userId: null })
    assert.equal(guest.orderUrl, "https://trendify.example/orders/TRD-123")
    assert.equal(guest.guest, true)
  } finally {
    if (previous === undefined) delete process.env.BETTER_AUTH_URL
    else process.env.BETTER_AUTH_URL = previous
  }
})

test("outbox retry policy is capped and errors are safe to persist", () => {
  assert.equal(retryDelayMs(1), 60_000)
  assert.equal(retryDelayMs(2), 5 * 60_000)
  assert.equal(retryDelayMs(3), 15 * 60_000)
  assert.equal(retryDelayMs(4), 60 * 60_000)
  assert.equal(retryDelayMs(5), 60 * 60_000)
  assert.equal(sanitizeDeliveryError(new Error("line one\nline two")), "line one line two")
})

test("outbox enqueues both channels with a shared idempotency key", async () => {
  let captured:
    | {
        data: Array<{ eventKey: string; channel: string; recipient: string }>
        skipDuplicates?: boolean
      }
    | undefined
  const writer = {
    notificationDelivery: {
      async createMany(input: typeof captured extends infer T ? NonNullable<T> : never) {
        captured = input
        return { count: input.data.length }
      },
    },
  }
  const count = await enqueueNotificationDeliveries(writer, {
    eventKey: "order:one:placed",
    template: NotificationTemplate.ORDER_PLACED,
    email: "AMA@EXAMPLE.TEST",
    phone: "+233241234567",
    payload: { customerName: "Ama", orderNumber: "TRD-1" },
  })
  assert.equal(count, 2)
  assert.equal(captured?.skipDuplicates, true)
  assert.deepEqual(
    captured?.data.map((item) => [item.eventKey, item.channel, item.recipient]),
    [
      ["order:one:placed", "EMAIL", "ama@example.test"],
      ["order:one:placed", "SMS", "+233241234567"],
    ]
  )
})
