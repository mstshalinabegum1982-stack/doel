import { doc, setDoc, Firestore } from 'firebase/firestore';

export async function saveToFraudBlacklist(
  firestoreDb: Firestore,
  sellerId: string,
  type: 'phone' | 'token',
  value: string,
  reason: string,
  associatedNumbers: string[] = [],
  associatedTokens: string[] = []
) {
  const docId = `${sellerId}_${type}_${value}`;
  const globalDocId = `global_${type}_${value}`;
  const payload = {
    sellerId,
    type,
    value,
    blockedAt: new Date().toISOString(),
    attemptsCount: 0,
    associatedNumbers,
    associatedTokens,
    reason: reason || 'Manually blacklisted'
  };
  await Promise.all([
    setDoc(doc(firestoreDb, 'fraud_blacklist', docId), payload, { merge: true }),
    setDoc(doc(firestoreDb, 'fraud_blacklist', globalDocId), { ...payload, sellerId: 'global' }, { merge: true })
  ]);
}
