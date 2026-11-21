/**
 * Local filesystem storage — replaces @vercel/blob.
 * Files are saved under STORAGE_DIR (default /data/uploads, Railway volume).
 */
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const STORAGE_DIR = process.env.STORAGE_DIR ?? '/data/uploads'

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

export type StoredFile = {
  /** Relative pathname used as the DB key, e.g. "ai-video-studio/abc/image-xyz.webp" */
  pathname: string
}

export async function saveFile(
  pathname: string,
  bytes: Buffer,
): Promise<StoredFile> {
  const fullPath = path.join(STORAGE_DIR, pathname)
  await ensureDir(path.dirname(fullPath))
  await fs.writeFile(fullPath, bytes)
  return { pathname }
}

export async function readFile(pathname: string): Promise<Buffer | null> {
  try {
    const fullPath = path.join(STORAGE_DIR, pathname)
    return await fs.readFile(fullPath)
  } catch {
    return null
  }
}

export async function deleteFile(pathname: string): Promise<void> {
  try {
    const fullPath = path.join(STORAGE_DIR, pathname)
    await fs.unlink(fullPath)
  } catch {
    // ignore missing files
  }
}

export function makePathname(visitorId: string, kind: 'image' | 'video', ext: string): string {
  return `ai-video-studio/${visitorId}/${kind}-${crypto.randomUUID()}.${ext}`
}
