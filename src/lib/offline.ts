/**
 * Offline-first outbox: actions taken while offline are stored locally
 * (registrations in localStorage, photo uploads with their file blob in
 * IndexedDB) and synced to the database when connectivity returns.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const LS_KEY = "jeevan-outbox";
const DB_NAME = "jeevan-offline";
const STORE = "outbox";

export interface OutboxBase {
  id: string;
  createdAt: number;
}

export interface PatientRegistration extends OutboxBase {
  kind: "register_patient";
  payload: {
    full_name: string;
    age: number | null;
    gender: string | null;
    phone: string | null;
    village: string | null;
    district: string | null;
    language: string;
    consent_given: boolean;
  };
}

export interface PhotoUpload extends OutboxBase {
  kind: "upload_photo";
  payload: {
    patientId: string;
    caseId: string;
    imageType: string;
    qualityStatus: "ok" | "needs_retake";
    qualityNote?: string;
    fileName: string;
  };
  blob: Blob;
}

export type OutboxItem = PatientRegistration | PhotoUpload;

// ---- localStorage queue (registrations) ----

function readQueue(): PatientRegistration[] {
  try {
    return JSON.parse(window.localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeQueue(items: PatientRegistration[]) {
  window.localStorage.setItem(LS_KEY, JSON.stringify(items));
}

// ---- IndexedDB queue (photo blobs) ----

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(item: PhotoUpload) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbAll(): Promise<PhotoUpload[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as PhotoUpload[]);
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(id: string) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---- public API ----

export async function enqueue(item: OutboxItem) {
  if (item.kind === "register_patient") {
    writeQueue([...readQueue(), item]);
  } else {
    await idbPut(item);
  }
}

export async function countPending(): Promise<number> {
  return readQueue().length + (await idbAll()).length;
}

/** Try to send everything queued while we were offline. Returns synced count. */
export async function flushOutbox(): Promise<number> {
  let synced = 0;

  const regs = readQueue();
  const remaining: PatientRegistration[] = [];
  for (const item of regs) {
    const { error } = await supabase.from("patients").insert({
      ...item.payload,
      created_by: (await supabase.auth.getUser()).data.user?.id ?? null,
    });
    if (error) {
      if (isRetryable(error)) remaining.push(item);
      else console.error("Outbox item dropped (permanent error):", error.message);
    } else {
      synced++;
    }
  }
  writeQueue(remaining);

  const uploads = await idbAll();
  for (const item of uploads) {
    try {
      const path = `${item.payload.patientId}/${item.payload.caseId}/${Date.now()}-${item.payload.fileName}`;
      const { error: upErr } = await supabase.storage
        .from("oral-images")
        .upload(path, item.blob, { contentType: item.blob.type || "image/jpeg" });
      if (upErr) {
        if (isRetryable(upErr)) continue;
        await idbDelete(item.id);
        console.error("Outbox upload dropped:", upErr.message);
        continue;
      }
      const { error: rowErr } = await supabase.from("case_images").insert({
        case_id: item.payload.caseId,
        storage_path: path,
        image_type: item.payload.imageType,
        quality_status: item.payload.qualityStatus,
        quality_note: item.payload.qualityNote ?? null,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      });
      if (rowErr) {
        if (isRetryable(rowErr)) continue;
        await idbDelete(item.id);
        console.error("Outbox image row dropped:", rowErr.message);
        continue;
      }
      await supabase
        .from("screening_cases")
        .update({ status: "pending_review" })
        .eq("id", item.payload.caseId)
        .eq("status", "awaiting_images");
      await idbDelete(item.id);
      synced++;
    } catch {
      // keep in queue for next sync
    }
  }
  return synced;
}

function isRetryable(err: { message?: string } | null): boolean {
  if (!err) return false;
  const msg = err.message ?? "";
  return (
    msg.toLowerCase().includes("network") ||
    msg.toLowerCase().includes("fetch") ||
    msg.includes("Failed to")
  );
}

/** React hook exposing pending count and online state, auto-flushing on reconnect. */
export function useOutbox() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);

  const refresh = useCallback(async () => {
    setPending(await countPending());
  }, []);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = async () => {
      setOnline(true);
      await flushOutbox();
      await refresh();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    refresh();
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [refresh]);

  return { online, pending, refresh };
}
