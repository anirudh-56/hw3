import { db } from "../firebase/firebase";
import {
  collection,
  doc,
  getDocs,
  limit as fsLimit,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { faker } from "@faker-js/faker";

const toYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

export async function seedExpensesIfEmpty(
  uid: string,
  n = 100
): Promise<boolean> {
  const col = collection(db, "users", uid, "expenses");

  const existing = await getDocs(query(col, fsLimit(1)));
  if (!existing.empty) return false;

  const batch = writeBatch(db);
  const cats = [
    "Coffee",
    "Groceries",
    "Dining",
    "Taxi",
    "Fuel",
    "Rent",
    "Utilities",
    "Internet",
    "Subscriptions",
    "Shopping",
  ];

  for (let i = 0; i < n; i++) {
    const d = faker.date.recent({ days: 180 });
    const payload = {
      description:
        faker.helpers.arrayElement(cats) +
        (faker.datatype.boolean() ? ` - ${faker.commerce.product()}` : ""),
      date: toYMD(d),
      cost: Number(
        faker.number.float({ min: 1, max: 250, multipleOf: 0.01 }).toFixed(2)
      ),
      deleted: false,
      createdAt: serverTimestamp(),
    };
    const ref = doc(col);
    batch.set(ref, payload);
  }

  await batch.commit();
  return true;
}
