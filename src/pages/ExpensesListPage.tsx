import React, { use, useEffect, useMemo, useRef, useState } from "react";
import ExpenseRow from "../ExpenseRow";
import {
  fetchExpenses,
  updateExpense,
  deleteExpense as apiDelete,
} from "../utils";
import type { Expense, TempEdit, SortDir } from "../types";

import { List, type RowComponentProps } from "react-window";

type SortKey = "date" | "cost";

const ROW_HEIGHT = 56;
const LIST_HEIGHT = 560;

function ExpensesRowComponent({
  index,
  style,
  expenses,
  editingId,
  tempEdit,
  setTempEdit,
  setEditingId,
  onSave,
  onDelete,
}: RowComponentProps<{
  expenses: Expense[];
  editingId: string | number | null;
  tempEdit: TempEdit;
  setTempEdit: React.Dispatch<React.SetStateAction<TempEdit>>;
  setEditingId: React.Dispatch<React.SetStateAction<string | number | null>>;
  onSave: (id: string | number, next: TempEdit) => Promise<void>;
  onDelete: (id: string | number) => Promise<void>;
}>) {
  const expense = expenses[index];
  if (!expense) return null;

  return (
    <div style={style}>
      <ExpenseRow
        key={expense.id ?? `${expense.date}-${index}`}
        serialNo={index + 1}
        expense={expense}
        isEditing={editingId === expense.id}
        tempEdit={tempEdit}
        setTempEdit={setTempEdit}
        setEditingId={setEditingId}
        onSave={onSave}
        onDelete={onDelete}
      />
    </div>
  );
}

const ExpensesListPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [tempEdit, setTempEdit] = useState<TempEdit>({
    description: "",
    date: "",
    cost: "",
  });

  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [dialogMsg, setDialogMsg] = useState("");
  const openDialog = (msg: string) => {
    setDialogMsg(msg);
    const d = dialogRef.current;
    if (d && typeof d.showModal === "function") d.showModal();
  };

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchExpenses();
        setExpenses(list);
      } catch (e) {
        console.error("Failed to fetch expenses:", e);
        setExpenses([]);
      }
    })();
  }, []);

  const toTime = (d?: string | number | Date) => {
    if (!d) return 0;
    const t = new Date(d).getTime();
    return Number.isNaN(t) ? 0 : t;
  };

  //TODO: Change the sorting logic to implement useMemo
  const sortedExpenses = [...expenses].sort((a, b) => {
    //TODO: Have the sorting logic here for date(default when you land on the page) and cost, asc and desc.
    //TODO: use the helper function `toTime`
    let cmp = 0;
    if (sortBy === "date") {
      //TODO: Add logic
    } else {
      //TODO: Add logic
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const toggleDir = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  const chooseSort = (key: SortKey) => {
    if (sortBy === key) {
      toggleDir();
    } else {
      setSortBy(key);
      setSortDir(key === "date" ? "desc" : "asc");
    }
  };

  const saveEdit = async (id: string | number, next: TempEdit) => {
    const parsedCost = parseFloat(next.cost);
    if (!next.description.trim()) {
      openDialog("Description is required");
      return;
    }
    if (Number.isNaN(parsedCost) || parsedCost < 0) {
      openDialog("Enter a valid non-negative cost");
      return;
    }

    const updated = { ...next, cost: +parsedCost.toFixed(2) };
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? ({ ...e, ...updated } as Expense) : e))
    );
    setEditingId(null);

    try {
      await updateExpense(id, updated);
    } catch (e) {
      console.error("Failed to save edit:", e);
    }
  };

  const deleteExpense = async (id: string | number) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (editingId === id) setEditingId(null);
    try {
      await apiDelete(id);
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  return (
    <div className="page">
      <div className="header">
        <h1 data-testid="page-expenses">Expenses</h1>
        <div className="spacer" />
      </div>

      <div className="table-header">
        <div className="th th-serial">Sr No.</div>
        <div className="th th-desc">Description</div>

        <div className="th th-date">
          <span className="th-label">Date</span>
          <button
            type="button"
            data-testid="sort-date"
            className={`sort-chip ${sortBy === "date" ? "active" : ""}`}
            onClick={() => chooseSort("date")}
            aria-pressed={sortBy === "date"}
            aria-label={`Sort by date ${
              sortBy === "date" ? `(${sortDir})` : ""
            }`}
            title={sortBy === "date" ? `Date (${sortDir})` : "Sort by Date"}
          >
            <span className="chip-icon">
              {sortBy === "date" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
            </span>
          </button>
        </div>

        <div className="th th-cost">
          <span className="th-label">Cost</span>
          <button
            type="button"
            data-testid="sort-cost"
            className={`sort-chip ${sortBy === "cost" ? "active" : ""}`}
            onClick={() => chooseSort("cost")}
            aria-pressed={sortBy === "cost"}
            aria-label={`Sort by cost ${
              sortBy === "cost" ? `(${sortDir})` : ""
            }`}
            title={sortBy === "cost" ? `Cost (${sortDir})` : "Sort by Cost"}
          >
            <span className="chip-icon">
              {sortBy === "cost" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
            </span>
          </button>
        </div>

        <div className="th th-actions">Actions</div>
      </div>

      <div
        className="list-wrapper"
        data-testid="expenses-list"
        style={{ height: LIST_HEIGHT }}
      >
        {/* TODO: Implement the Empty List fallback using  <div className="no-expenses" data-testid="empty-state"> */}
        <List
          rowComponent={ExpensesRowComponent}
          rowCount={sortedExpenses.length}
          rowHeight={ROW_HEIGHT}
          rowProps={{
            expenses: sortedExpenses,
            editingId,
            tempEdit,
            setTempEdit,
            setEditingId,
            onSave: saveEdit,
            onDelete: deleteExpense,
          }}
        />
      </div>

      <dialog
        ref={dialogRef}
        className="modal"
        onClose={() => setDialogMsg("")}
      >
        <div className="modal-body">
          <p>{dialogMsg}</p>
        </div>
        <form method="dialog" className="modal-actions">
          <button className="btn btn-primary">OK</button>
        </form>
      </dialog>
    </div>
  );
};

export default ExpensesListPage;
