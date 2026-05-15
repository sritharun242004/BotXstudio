// src/lib/garment-cache.ts
// Hash-based garment reference cache via IndexedDB.
// Avoids regenerating the same garment cutout when the user hits Generate again
// with the same garment photos — the most expensive single step in the pipeline.

import type { GeminiInlineImage } from "./gemini";

const DB_NAME = "botx_garment_cache_v1";
const STORE = "garment_refs";
const MAX_ENTRIES = 30;

type CacheEntry = {
  hash: string;
  dataUrl: string;
  mimeType: string;
  ts: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "hash" });
        store.createIndex("ts", "ts");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** SHA-256 fingerprint of all garment images (mimeType + raw bytes). */
export async function hashImages(images: GeminiInlineImage[]): Promise<string> {
  const parts: Uint8Array[] = [];
  for (const img of images) {
    const prefix = new TextEncoder().encode(img.mimeType + ":");
    parts.push(prefix, img.data);
  }
  const total = parts.reduce((s, p) => s + p.length, 0);
  const combined = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) { combined.set(p, offset); offset += p.length; }
  const buf = await crypto.subtle.digest("SHA-256", combined);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Look up a cached garment reference. Returns null on cache miss or any error. */
export async function getCachedGarmentRef(
  hash: string,
): Promise<{ dataUrl: string; mimeType: string } | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(hash);
      req.onsuccess = () => {
        const entry = req.result as CacheEntry | undefined;
        resolve(entry ? { dataUrl: entry.dataUrl, mimeType: entry.mimeType } : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/** Persist a generated garment reference. Cache failures are silently swallowed. */
export async function storeCachedGarmentRef(
  hash: string,
  dataUrl: string,
  mimeType: string,
): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ hash, dataUrl, mimeType, ts: Date.now() } satisfies CacheEntry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await evictOldEntries(db);
  } catch {
    // Non-fatal
  }
}

async function evictOldEntries(db: IDBDatabase): Promise<void> {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const countReq = store.count();
    countReq.onsuccess = () => {
      const excess = countReq.result - MAX_ENTRIES;
      if (excess <= 0) { resolve(); return; }
      let deleted = 0;
      const cursorReq = store.index("ts").openCursor();
      cursorReq.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (!cursor || deleted >= excess) { resolve(); return; }
        cursor.delete();
        deleted++;
        cursor.continue();
      };
      cursorReq.onerror = () => resolve();
    };
    countReq.onerror = () => resolve();
  });
}
