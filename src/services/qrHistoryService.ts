import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { QrHistoryItem } from '../types';

// Synchronized verbatim with firebase-blueprint.json & firestore.rules
export const QR_CONTENT_MAX_LENGTH = 2048;
export const QR_TITLE_MAX_LENGTH = 120;

export function deriveQrTitle(rawContent: string): string {
  const cleaned = rawContent.trim();
  if (!cleaned) {
    return 'Untitled QR Code';
  }

  // Extract a clean, readable label for URLs
  if (/^https?:\/\//i.test(cleaned)) {
    try {
      const parsed = new URL(cleaned);
      const host = parsed.hostname.replace(/^www\./i, '');
      const pathPart = parsed.pathname.replace(/\/+$/, '');
      const combined =
        pathPart && pathPart !== '/' ? `${host}${pathPart}` : host;
      return combined.length > 64
        ? `${combined.slice(0, 61)}...`
        : combined.slice(0, QR_TITLE_MAX_LENGTH);
    } catch {
      // Fall through to plain text truncation
    }
  }

  const firstLine = cleaned.split(/\r?\n/)[0].trim() || cleaned;
  if (firstLine.length > 64) {
    return `${firstLine.slice(0, 61)}...`;
  }
  return firstLine.slice(0, QR_TITLE_MAX_LENGTH);
}

function toDateOrNull(value: unknown): Date | null {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as Timestamp).toDate === 'function'
  ) {
    return (value as Timestamp).toDate();
  }
  return null;
}

export async function saveQrHistoryItem(
  uid: string,
  rawContent: string,
  customTitle?: string
): Promise<string> {
  const sanitizedContent = rawContent.trim().slice(0, QR_CONTENT_MAX_LENGTH);
  if (!sanitizedContent) {
    throw new Error('QR content cannot be empty.');
  }

  const sanitizedTitle = (customTitle?.trim() || deriveQrTitle(sanitizedContent))
    .slice(0, QR_TITLE_MAX_LENGTH)
    .trim();

  const path = `users/${uid}/qr_history`;

  try {
    const colRef = collection(db, 'users', uid, 'qr_history');
    const docRef = await addDoc(colRef, {
      content: sanitizedContent,
      title: sanitizedTitle || 'Untitled QR Code',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToQrHistory(
  uid: string,
  onData: (items: QrHistoryItem[]) => void,
  onError: (error: Error) => void
): () => void {
  const path = `users/${uid}/qr_history`;
  const colRef = collection(db, 'users', uid, 'qr_history');
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: QrHistoryItem[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          content: typeof data.content === 'string' ? data.content : '',
          title:
            typeof data.title === 'string' && data.title.trim()
              ? data.title
              : deriveQrTitle(
                  typeof data.content === 'string' ? data.content : ''
                ),
          createdAt: toDateOrNull(data.createdAt),
          updatedAt: toDateOrNull(data.updatedAt)
        };
      });

      // Keep newest first even while pending serverTimestamp resolves locally
      items.sort((a, b) => {
        const timeA = a.createdAt ? a.createdAt.getTime() : Date.now();
        const timeB = b.createdAt ? b.createdAt.getTime() : Date.now();
        return timeB - timeA;
      });

      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (structuredError) {
        onError(
          structuredError instanceof Error
            ? structuredError
            : new Error('Unable to load your QR Library.')
        );
      }
    }
  );
}

export async function deleteQrHistoryItem(
  uid: string,
  qrId: string
): Promise<void> {
  const path = `users/${uid}/qr_history/${qrId}`;
  try {
    const docRef = doc(db, 'users', uid, 'qr_history', qrId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
