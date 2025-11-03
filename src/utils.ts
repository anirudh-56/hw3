import type { Expense, TempEdit } from "./types";
import { auth, db } from "./firebase/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp,
  DocumentReference,
} from "firebase/firestore";
import { seedExpensesIfEmpty } from "./dev/seed";

export const formatMoney = (n: string | number, currency = "USD") => {
  const val = Number(n || 0);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(val);
  } catch {
    return `$${val.toFixed(2)}`;
  }
};

export async function signUp(
  email: string,
  password: string,
  seed: boolean = true
) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const isLocal =
      typeof window !== "undefined" && location.hostname === "localhost";

    if (isLocal && cred && seed) {
      await seedExpensesIfEmpty(cred.user.uid, 100);
    }

    if (cred) return cred.user;
    throw Error("Signup not implemented");
  } catch (error) {
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    const isLocal =
      typeof window !== "undefined" && location.hostname === "localhost";

    if (isLocal && cred) {
      await seedExpensesIfEmpty(cred.user.uid, 100);
    }

    if (cred) return cred.user;
  } catch (e: any) {
    const err = new Error(
      e?.message || "Failed to sign in. Please try again."
    ) as Error & {
      code?: string;
    };
    if (e?.code) err.code = e.code;
    throw err;
  }
}

export async function signOut() {
  if (!auth.currentUser) return;

  try {
    await fbSignOut(auth);

  } catch (e: any) {
    const err = new Error(
      e?.message || "Failed to sign out. Please try again."
    ) as Error & {
      code?: string;
    };
    if (e?.code) err.code = e.code;
    throw err;
  }
}

export function onAuthChanged(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}

export async function authedFetch(input: RequestInfo, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  const token = await getIdToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(input, { ...init, headers });
  if (res.status === 401) {
    window.location.assign("/signin");
    throw new Error("Unauthorized");
  }
  return res;
}

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  return uid;
}

function expensesCol(uid: string) {
  return collection(db, "users", uid, "expenses");
}

export const fetchExpenses = async (): Promise<Expense[] | {}> => {
  const uid = requireUid();

  const q = query(
    expensesCol(uid),
    where("deleted", "==", false),
    orderBy("date", "desc")
  );

  const snap = await getDocs(q);

  const list: Expense[] | {} = snap.docs.map((d) => {
    const x = d.data() as any;

    return {
      id: d.id,
      description: String(x.description ?? ""),
      date: String(x.date ?? ""),   
      cost: Number(x.cost ?? 0),
      deleted: Boolean(x.deleted ?? false),
    };
  });
  return list;
};

export const addExpense = async (expense: Omit<Expense, "id">) => {
  try {
    const uid = requireUid();

    if (!expense.description) {
      throw new Error("Description is required");
    }
    if (isNaN(Number(expense.cost)) || Number(expense.cost) < 0) {
      throw new Error("Enter a valid non-negative cost");
    }

    const payload = {
      description: expense.description.trim(),
      date: String(expense.date),  
      cost: Number(expense.cost),
      deleted: false,
      createdAt: serverTimestamp(),
    };

    await addDoc(expensesCol(uid), payload);
  } catch (error) {
    throw error;
  }
};

export const updateExpense = async (
  id: string | number,
  next: Partial<Expense> | TempEdit
) => {
  const uid = requireUid();
  const ref = await doc(db, "users", uid, "expenses", String(id));

  const body: any = {};
  if (next.description !== undefined) body.description = next.description;
  if (next.date !== undefined) body.date = next.date;
  if ((next as any).cost !== undefined) body.cost = Number((next as any).cost);
  if ((next as any).deleted !== undefined)
    body.deleted = !!(next as any).deleted;
  await updateDoc(ref, body);
};

export const deleteExpense = async (id: string | number) => {
  const uid = requireUid();
  const ref = doc(db, "users", uid, "expenses", String(id));
  //TODO : Implement soft delete of expense

  await updateDoc(ref, {deleted: true});
};
