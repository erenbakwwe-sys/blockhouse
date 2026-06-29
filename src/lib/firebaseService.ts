// Firebase Service Wrapper with Auto-Fallback to Mock Database for Demo Mode
import { auth, db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { mockDbInstance } from './mockDb';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function getUserId(): string {
  if (localStorage.getItem('demo_mode') === 'true') {
    return 'demo';
  }
  return auth.currentUser?.uid || 'demo';
}

export function isDemoMode(): boolean {
  return getUserId() === 'demo';
}

// ------------------------------------------------------------------
// Generic Data Operations Supporting Demo Mode and Real Firestore
// ------------------------------------------------------------------

export async function fetchDoc(path: string): Promise<any> {
  if (isDemoMode()) {
    const parts = path.split('/');
    if (parts[0] === 'users' && parts.length === 2) {
      return mockDbInstance.getDoc('users', parts[1]);
    }
    return null;
  }

  try {
    const ref = doc(db, path);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveDoc(path: string, data: any): Promise<void> {
  if (isDemoMode()) {
    const parts = path.split('/');
    if (parts[0] === 'users' && parts.length === 2) {
      mockDbInstance.setDoc('users', parts[1], data);
    }
    return;
  }

  try {
    const ref = doc(db, path);
    await setDoc(ref, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchCollection(colName: string): Promise<any[]> {
  const userId = getUserId();
  if (isDemoMode()) {
    return mockDbInstance.getCollection(colName, userId);
  }

  const path = `users/${userId}/${colName}`;
  try {
    const ref = collection(db, path);
    const snap = await getDocs(ref);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function createDocument(colName: string, data: any): Promise<string> {
  const userId = getUserId();
  if (isDemoMode()) {
    return mockDbInstance.addDoc(colName, userId, data);
  }

  const path = `users/${userId}/${colName}`;
  try {
    const ref = collection(db, path);
    const docRef = await addDoc(ref, {
      ...data,
      createdAt: data.createdAt || Date.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return "";
  }
}

export async function updateDocument(colName: string, docId: string, data: any): Promise<void> {
  const userId = getUserId();
  if (isDemoMode()) {
    mockDbInstance.updateDoc(colName, userId, docId, data);
    return;
  }

  const path = `users/${userId}/${colName}/${docId}`;
  try {
    const ref = doc(db, path);
    await updateDoc(ref, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteDocument(colName: string, docId: string): Promise<void> {
  const userId = getUserId();
  if (isDemoMode()) {
    mockDbInstance.deleteDoc(colName, userId, docId);
    return;
  }

  const path = `users/${userId}/${colName}/${docId}`;
  try {
    const ref = doc(db, path);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeCollection(colName: string, callback: (data: any[]) => void): () => void {
  const userId = getUserId();
  if (isDemoMode()) {
    const fetchAndCallback = () => {
      callback(mockDbInstance.getCollection(colName, userId));
    };
    fetchAndCallback();
    return mockDbInstance.subscribe(fetchAndCallback);
  }

  const path = `users/${userId}/${colName}`;
  const ref = collection(db, path);
  const q = query(ref, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
}
