import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { addExpense } from "../utils";

const AddExpensePage: React.FC = () => {
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [cost, setCost] = useState("");
  const navigate = useNavigate();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [dialogMsg, setDialogMsg] = useState("");

  const openDialog = (msg: string) => {
    setDialogMsg(msg);
    const d = dialogRef.current;
    if (d && typeof d.showModal === "function") d.showModal();
  };

  const clear = () => {
    setDesc("");
    setDate(new Date().toISOString().slice(0, 10));
    setCost("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedCost = parseFloat(cost);

    //TODO: Validate the parsedCost and description before submitting
    const payload = {
      description: desc.trim(),
      date,
      cost: +parsedCost.toFixed(2),
    };

    try {
      await addExpense(payload);
      clear();
      navigate("/");
    } catch (err) {
      console.error("Failed to add:", err);
      openDialog("Failed to add expense");
    }
  };

  return (
    <div className="page">
      <div className="header">
        <h1 data-testid="page-add">Add Expense</h1>
        <div className="spacer" />
        <Link className="link" to="/">
          ← Back to List
        </Link>
      </div>

      <form onSubmit={onSubmit} className="add-form" data-testid="add-form">
        <input
          className="input"
          data-testid="desc-input"
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <input
          className="input"
          data-testid="date-input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          className="input"
          data-testid="cost-input"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
        />
        <button
          className="btn btn-primary"
          type="submit"
          data-testid="submit-btn"
        >
          Add
        </button>
      </form>

      <dialog
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-labelledby="add-expense-dialog-title"
        aria-describedby="add-expense-dialog-desc"
        onClose={() => {
          setDialogMsg("");
        }}
      >
        <div className="modal-body">
          <p id="add-expense-dialog-desc" className="modal-message">
            {dialogMsg}
          </p>
        </div>
        <form method="dialog" className="modal-actions">
          <button className="btn btn-primary">OK</button>
        </form>
      </dialog>
    </div>
  );
};

export default AddExpensePage;
