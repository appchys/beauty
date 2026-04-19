import {
  collection as fsCollection,
  doc as fsDoc,
  documentId,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  where as fsWhere,
  orderBy as fsOrderBy,
  limit as fsLimit,
  writeBatch,
  type DocumentReference,
  type QueryConstraint,
} from 'firebase/firestore';
import { db, storage } from './firebase';

type DocTarget = DocumentReference | { ref?: DocumentReference };
type AdminDocSnapshot = {
  id: string;
  exists: boolean;
  data: () => unknown;
  ref: DocumentReference;
};

function unwrapDocRef(target: DocTarget): DocumentReference {
  if (target && 'ref' in target && target.ref) {
    return target.ref;
  }

  return target as DocumentReference;
}

function createDocWrapper(ref: DocumentReference) {
  return {
    ref,
    async get(): Promise<AdminDocSnapshot> {
      const snapshot = await getDoc(ref);
      return {
        id: snapshot.id,
        exists: snapshot.exists(),
        data: () => snapshot.data(),
        ref,
      };
    },
    async set(data: unknown) {
      return setDoc(ref, data as never);
    },
    async update(data: unknown) {
      return updateDoc(ref, data as never);
    },
    async delete() {
      return deleteDoc(ref);
    },
  };
}

function createCollectionWrapper(
  collectionRef: ReturnType<typeof fsCollection>,
  constraints: QueryConstraint[] = []
) {
  return {
    doc(id: string) {
      return createDocWrapper(fsDoc(collectionRef, id));
    },
    where(field: string, op: Parameters<typeof fsWhere>[1], value: unknown) {
      const constraint =
        field === '__name__'
          ? fsWhere(documentId(), op, value as never)
          : fsWhere(field, op, value as never);

      return createCollectionWrapper(collectionRef, [...constraints, constraint]);
    },
    orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
      return createCollectionWrapper(collectionRef, [
        ...constraints,
        fsOrderBy(field, direction),
      ]);
    },
    limit(count: number) {
      return createCollectionWrapper(collectionRef, [...constraints, fsLimit(count)]);
    },
    async get() {
      if (constraints.length === 0) {
        return getDocs(collectionRef);
      }

      return getDocs(query(collectionRef, ...constraints));
    },
  };
}

function normalizeCollectionRef(path: string) {
  return fsCollection(db, path);
}

function normalizeDocRef(path: string) {
  const parts = path.split('/').filter(Boolean);
  if (parts.length < 2 || parts.length % 2 !== 0) {
    throw new Error(`Invalid document path: ${path}`);
  }

  return fsDoc(db, path);
}

function createBatchWrapper() {
  const batch = writeBatch(db);

  return {
    set(target: DocTarget, data: unknown) {
      batch.set(unwrapDocRef(target), data as never);
      return this;
    },
    update(target: DocTarget, data: unknown) {
      batch.update(unwrapDocRef(target), data as never);
      return this;
    },
    delete(target: DocTarget) {
      batch.delete(unwrapDocRef(target));
      return this;
    },
    commit() {
      return batch.commit();
    },
  };
}

export function getAdminDb() {
  return {
    collection(name: string) {
      return createCollectionWrapper(normalizeCollectionRef(name));
    },
    doc(path: string) {
      return createDocWrapper(normalizeDocRef(path));
    },
    batch() {
      return createBatchWrapper();
    },
  };
}

export function getAdminStorage() {
  return storage;
}
