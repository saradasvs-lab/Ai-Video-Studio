import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const STORAGE_DIR = process.env.STORAGE_DIR ?? '/data/uploads'

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

export async function saveFile(pathname: string, bytes: Buffer): Promise<void> {
  const fullPath = path.join(STORAGE_DIR, pathname)
  await ensureDir(path.dirname(fullPath))
  await fs.writeFile(fullPath, bytes)
}

export async function readFile(pathname: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(path.join(STORAGE_DIR, pathname))
  } catch {
    return null
  }
}

export async function deleteFile(pathname: string): Promise<void> {
  try {
    await fs.unlink(path.join(STORAGE_DIR, pathname))
  } catch {
    // ignore missing
  }
}

export function makePathname(visitorId: string, kind: 'image' | 'video', ext: string): string {
  return `aetherfield/${visitorId}/${kind}-${crypto.randomUUID()}.${ext}`
}
