import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import { render } from "@react-email/render"

import type { NotificationTemplate } from "@/app/generated/prisma/enums"

export type AuthOtpType =
  | "sign-in"
  | "email-verification"
  | "forget-password"
  | "change-email"

export type OutboundPayload = {
  customerName: string
  orderNumber?: string
  amountPesewas?: number
  currency?: string
  status?: string
  trackingNumber?: string
  carrier?: string
  estimatedDeliveryAt?: string
  note?: string
  orderUrl?: string
  appUrl?: string
  guest?: boolean
}

export type RenderedMessage = {
  subject: string
  html: string
  text: string
  sms: string
}

type MessageCopy = {
  subject: string
  preview: string
  heading: string
  body: string
  sms: string
  details?: Array<[string, string]>
  buttonLabel?: string
  buttonUrl?: string
  footer?: string
}

const palette = {
  background: "#faf8ff",
  card: "#ffffff",
  border: "#dbe2dd",
  heading: "#003527",
  text: "#404944",
  detail: "#131b2e",
  detailBackground: "#f2f3ff",
  button: "#003527",
}

function TrendifyEmail({ copy }: { copy: MessageCopy }) {
  return (
    <Html>
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body
        style={{
          backgroundColor: palette.background,
          fontFamily: "Arial, sans-serif",
          margin: 0,
          padding: "32px 12px",
        }}
      >
        <Container
          style={{
            backgroundColor: palette.card,
            border: `1px solid ${palette.border}`,
            margin: "0 auto",
            maxWidth: "600px",
            padding: "36px",
          }}
        >
          <Text
            style={{
              color: palette.heading,
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            }}
          >
            Fashion Trendify GH
          </Text>
          <Heading
            style={{ color: palette.heading, fontSize: "28px", margin: "16px 0" }}
          >
            {copy.heading}
          </Heading>
          <Text style={{ color: palette.text, fontSize: "15px", lineHeight: "24px" }}>
            {copy.body}
          </Text>
          {copy.details?.length ? (
            <Section
              style={{
                backgroundColor: palette.detailBackground,
                margin: "24px 0",
                padding: "18px 20px",
              }}
            >
              {copy.details.map(([label, value]) => (
                <Text
                  key={label}
                  style={{ color: palette.detail, fontSize: "14px", margin: "7px 0" }}
                >
                  <strong>{label}:</strong> {value}
                </Text>
              ))}
            </Section>
          ) : null}
          {copy.buttonLabel && copy.buttonUrl ? (
            <Button
              href={copy.buttonUrl}
              style={{
                backgroundColor: palette.button,
                color: "#ffffff",
                display: "inline-block",
                fontSize: "14px",
                fontWeight: 700,
                margin: "8px 0 20px",
                padding: "13px 20px",
                textDecoration: "none",
              }}
            >
              {copy.buttonLabel}
            </Button>
          ) : null}
          <Hr style={{ borderColor: palette.border, margin: "24px 0" }} />
          <Text style={{ color: palette.text, fontSize: "12px", lineHeight: "19px" }}>
            {copy.footer ||
              "This is a transactional message from Fashion Trendify GH. Please contact support if you did not expect it."}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

function formatMoney(amountPesewas = 0, currency = "GHS") {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency,
  }).format(amountPesewas / 100)
}

function humanize(value = "") {
  return value.replaceAll("_", " ").toLowerCase().replace(/^./, (letter) => letter.toUpperCase())
}

function orderDetails(payload: OutboundPayload) {
  return payload.orderNumber ? [["Order", payload.orderNumber] as [string, string]] : []
}

export function buildOutboundCopy(
  template: NotificationTemplate,
  payload: OutboundPayload
): MessageCopy {
  const name = payload.customerName || "Customer"
  const order = payload.orderNumber || "your order"
  const url = payload.orderUrl || payload.appUrl
  const guestFooter = payload.guest
    ? "For security, detailed guest-order access remains available in the browser that completed checkout. Contact support and quote your order number if you need help."
    : undefined

  switch (template) {
    case "PASSWORD_RESET_SUCCESS":
      return {
        subject: "Your Trendify password was changed",
        preview: "Your Fashion Trendify GH password was reset successfully.",
        heading: "Password changed",
        body: `Hello ${name}, your account password was reset successfully. All previous sessions have been revoked.`,
        sms: `TrendifyGH: Your password was changed successfully. If this was not you, contact support immediately.`,
        buttonLabel: "Open Trendify",
        buttonUrl: payload.appUrl,
      }
    case "ORDER_PLACED":
      return {
        subject: `Order ${order} received`,
        preview: `We received order ${order}.`,
        heading: "Order received",
        body: `Hello ${name}, we have reserved your selected pieces while payment is completed.`,
        sms: `TrendifyGH: Order ${order} received. Complete payment before the reservation expires.`,
        details: [
          ...orderDetails(payload),
          ["Total", formatMoney(payload.amountPesewas, payload.currency)],
          ["Status", "Pending payment"],
        ],
        buttonLabel: "View order",
        buttonUrl: url,
        footer: guestFooter,
      }
    case "PAYMENT_SUCCESS":
      return {
        subject: `Payment confirmed for ${order}`,
        preview: `Payment for ${order} has been confirmed.`,
        heading: "Payment confirmed",
        body: `Hello ${name}, your payment has been verified and your order is now confirmed.`,
        sms: `TrendifyGH: Payment confirmed for ${order}. We will update you as your order moves through delivery.`,
        details: [
          ...orderDetails(payload),
          ["Amount", formatMoney(payload.amountPesewas, payload.currency)],
        ],
        buttonLabel: "Track order",
        buttonUrl: url,
        footer: guestFooter,
      }
    case "PAYMENT_FAILED":
      return {
        subject: `Payment update for ${order}`,
        preview: `Your payment attempt for ${order} was not completed.`,
        heading: "Payment was not completed",
        body: `Hello ${name}, the latest payment attempt for ${order} was not successful.${payload.note ? ` ${payload.note}` : ""}`,
        sms: `TrendifyGH: Payment for ${order} was not completed. Please retry checkout or contact support.`,
        details: orderDetails(payload),
        buttonLabel: "Review order",
        buttonUrl: url,
        footer: guestFooter,
      }
    case "TRACKING_UPDATED":
      return {
        subject: `Tracking updated for ${order}`,
        preview: `New delivery tracking is available for ${order}.`,
        heading: "Tracking details updated",
        body: `Hello ${name}, delivery tracking is now available for your order.`,
        sms: `TrendifyGH: ${order} tracking updated${payload.carrier ? ` via ${payload.carrier}` : ""}${payload.trackingNumber ? ` (${payload.trackingNumber})` : ""}.`,
        details: [
          ...orderDetails(payload),
          ...(payload.carrier ? [["Carrier", payload.carrier] as [string, string]] : []),
          ...(payload.trackingNumber
            ? [["Tracking number", payload.trackingNumber] as [string, string]]
            : []),
          ...(payload.estimatedDeliveryAt
            ? [["Estimated delivery", payload.estimatedDeliveryAt] as [string, string]]
            : []),
        ],
        buttonLabel: "Track order",
        buttonUrl: url,
        footer: guestFooter,
      }
    case "REFUND_CONFIRMED":
      return {
        subject: `Refund confirmed for ${order}`,
        preview: `Your refund for ${order} has been confirmed.`,
        heading: "Refund confirmed",
        body: `Hello ${name}, the refund for your order has been confirmed. Your provider may need additional processing time before the funds appear.`,
        sms: `TrendifyGH: Refund confirmed for ${order}. Your provider may need time to post the funds.`,
        details: [
          ...orderDetails(payload),
          ["Amount", formatMoney(payload.amountPesewas, payload.currency)],
        ],
        buttonLabel: "View order",
        buttonUrl: url,
        footer: guestFooter,
      }
    case "ORDER_STATUS_UPDATED": {
      const status = humanize(payload.status)
      return {
        subject: `${order} is ${status.toLowerCase()}`,
        preview: `Order ${order} status: ${status}.`,
        heading: status,
        body: `Hello ${name}, your order status has changed to ${status.toLowerCase()}.${payload.note ? ` ${payload.note}` : ""}`,
        sms: `TrendifyGH: ${order} is now ${status.toLowerCase()}.`,
        details: [...orderDetails(payload), ["Status", status]],
        buttonLabel: "View order",
        buttonUrl: url,
        footer: guestFooter,
      }
    }
  }
}

export async function renderOutboundMessage(
  template: NotificationTemplate,
  payload: OutboundPayload
): Promise<RenderedMessage> {
  const copy = buildOutboundCopy(template, payload)
  return {
    subject: copy.subject,
    html: await render(<TrendifyEmail copy={copy} />),
    text: await render(<TrendifyEmail copy={copy} />, { plainText: true }),
    sms: copy.sms,
  }
}

export async function renderAuthOtpMessage(input: {
  otp: string
  type: AuthOtpType | "phone-verification" | "phone-password-reset"
}): Promise<RenderedMessage> {
  const isReset = input.type === "forget-password" || input.type === "phone-password-reset"
  const isChange = input.type === "change-email"
  const copy: MessageCopy = {
    subject: isReset
      ? "Reset your Trendify password"
      : isChange
        ? "Confirm your new Trendify email"
        : "Your Trendify verification code",
    preview: `Your Fashion Trendify GH code is ${input.otp}.`,
    heading: isReset ? "Reset your password" : "Verification code",
    body: "Use the single-use code below to continue. It expires shortly and should never be shared.",
    sms: `TrendifyGH: Your ${isReset ? "password reset" : "verification"} code is ${input.otp}. Do not share it.`,
    details: [["Code", input.otp]],
    footer: "If you did not request this code, you can safely ignore this message.",
  }
  return {
    subject: copy.subject,
    html: await render(<TrendifyEmail copy={copy} />),
    text: await render(<TrendifyEmail copy={copy} />, { plainText: true }),
    sms: copy.sms,
  }
}
