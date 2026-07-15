import { readFile } from "node:fs/promises"
import path from "node:path"

import { imageSourceFiles } from "./simulation-data"

const IMAGE_PATTERN = /https:\/\/lh3\.googleusercontent\.com\/aida-public\/[A-Za-z0-9_-]+/g

export async function loadCuratedImageUrls() {
  const designsRoot = path.resolve(process.cwd(), "..", "Designs")
  const urls: string[] = []
  for (const source of imageSourceFiles) {
    const html = await readFile(path.join(designsRoot, ...source.split("/")), "utf8")
    for (const url of html.match(IMAGE_PATTERN) ?? []) {
      if (!urls.includes(url)) urls.push(url)
    }
  }
  if (urls.length < 53) {
    throw new Error(`The design exports contain only ${urls.length} usable public images; 53 are required`)
  }
  return urls.slice(0, 53)
}

async function preflightOne(url: string) {
  let lastError: unknown
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)
    try {
      const response = await fetch(url, {
        headers: { Range: "bytes=0-1023" },
        signal: controller.signal,
      })
      const contentType = response.headers.get("content-type") ?? ""
      await response.body?.cancel()
      if (response.ok && contentType.startsWith("image/")) return
      lastError = new Error(`HTTP ${response.status}, content-type ${contentType || "missing"}`)
    } catch (error) {
      lastError = error
    } finally {
      clearTimeout(timeout)
    }
  }
  throw new Error(`Image preflight failed for ${url}: ${String(lastError)}`)
}

export async function preflightImageUrls(urls: string[]) {
  const concurrency = 6
  let cursor = 0
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (cursor < urls.length) {
        const index = cursor
        cursor += 1
        await preflightOne(urls[index])
      }
    })
  )
}
