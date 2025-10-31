import React from "react";
import type { Expense, TempEdit } from "./types";
import { formatMoney } from "./utils";

type Props = {
  serialNo: number;
  expense: Expense;
  isEditing: boolean;
  tempEdit: TempEdit;
  setTempEdit: React.Dispatch<React.SetStateAction<TempEdit>>;
  setEditingId: React.Dispatch<React.SetStateAction<string | number | null>>;
  onSave: (id: string | number, next: TempEdit) => void;
  onDelete: (id: string | number) => void;
};

const ExpenseRow: React.FC<Props> = ({
  serialNo,
  expense,
  isEditing,
  tempEdit,
  setTempEdit,
  setEditingId,
  onSave,
  onDelete,
}: Props) => {
  if (!expense) return null;

  return (
    <div className="expense-row" data-testid="expense-row">
      <div className="cell cell-serial" data-testid="cell-serial">
        {serialNo}
      </div>

      <div className="cell cell-desc" data-testid="cell-desc">
        {isEditing ? (
          <input
            className="input"
            value={tempEdit.description}
            onChange={(e) =>
              setTempEdit((s) => ({ ...s, description: e.target.value }))
            }
          />
        ) : (
          <span>{expense.description}</span>
        )}
      </div>

      <div className="cell cell-date" data-testid="cell-date">
        {isEditing ? (
          <input
            className="input"
            type="date"
            value={tempEdit.date}
            onChange={(e) =>
              setTempEdit((s) => ({ ...s, date: e.target.value }))
            }
          />
        ) : (
          <span>{expense.date}</span>
        )}
      </div>

      <div className="cell cell-cost" data-testid="cell-cost">
        {isEditing ? (
          <input
            className="input"
            type="number"
            step="0.01"
            value={tempEdit.cost}
            onChange={(e) =>
              setTempEdit((s) => ({ ...s, cost: e.target.value }))
            }
          />
        ) : (
          <span>{formatMoney(expense.cost)}</span>
        )}
      </div>

      <div className="cell cell-actions">
        {isEditing ? (
          <>
            <button
              className="btn btn-primary"
              data-testid="save-btn"
              onClick={() => onSave(expense.id!, tempEdit)}
            >
              Save
            </button>
            <button
              className="btn"
              data-testid="cancel-btn"
              onClick={() => setEditingId(null)}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              className="btn"
              data-testid="edit-btn"
              onClick={() => {
                setEditingId(expense.id ?? null);
                setTempEdit({
                  description: String(expense.description ?? ""),
                  date: String(expense.date ?? ""),
                  cost: String(expense.cost ?? ""),
                });
              }}
            >
              Edit
            </button>
            <button
              className="btn btn-danger"
              data-testid="delete-btn"
              onClick={() => expense.id != null && onDelete(expense.id!)}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ExpenseRow;
