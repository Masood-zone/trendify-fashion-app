export async function sendAuthOtpSms(phoneNumber: string, code: string) {
  const endpoint = process.env.UELLOSEND_API_URL
  if (!endpoint) throw new Error("SMS delivery is not configured")
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.UELLOSEND_API_KEY || "",
      "X-API-Secret": process.env.UELLOSEND_API_SECRET || "",
    },
    body: JSON.stringify({
      recipient: phoneNumber,
      senderId: process.env.UELLOSEND_SENDER_ID || "TrendifyGH",
      message: `Your Trendify verification code is ${code}.`,
    }),
  })
  if (!response.ok) throw new Error("SMS delivery failed")
}
