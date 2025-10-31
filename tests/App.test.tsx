import React from "react";
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import AddExpensePage from "../src/pages/AddExpensePage";
import ExpensesListPage from "../src/pages/ExpensesListPage";
import TotalPage from "../src/pages/TotalPage";
import SignIn from "../src/pages/SignIn";
import SignUp from "../src/pages/SignUp";
import RequireAuth from "../src/RequireAuth";
import { AuthProvider } from "../src/AuthContext";

import * as utils from "../src/utils";
import test from "node:test";

function AppShell({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

async function ensureSignedOut() {
  try {
    await utils.signOut();
  } catch {}
}

function uniqueEmail(prefix = "t") {
  return `${prefix}+${Date.now()}@example.com`;
}

function rowsToDescs() {
  const rows = screen.queryAllByTestId("expense-row");
  return rows.map((row) => {
    const cell = within(row).getByTestId("cell-desc");
    const input = cell.querySelector("input") as HTMLInputElement | null;
    return input ? input.value : cell.textContent?.trim();
  });
}

beforeAll(async () => {
  vi.useRealTimers();
});

beforeEach(async () => {
  //TODO: Make sure your sign out function works correctly for all tests to run properly
  await ensureSignedOut();
  (window.location.assign as any).mockReset?.();
});

describe("Homework 3 Tests", async () => {
  const testEmail = uniqueEmail("setup");
  const testPassword = "secret123";
  //TODO: Start the implementation from signUp functionality
  const testUser = await utils.signUp(testEmail, testPassword, false);
  expect(testUser?.uid).toBeTruthy();

  it("(10pts) User is not able to access expenses list when not signed in", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppShell>
          <Routes>
            <Route
              path="/"
              element={
                <RequireAuth>
                  <ExpensesListPage />
                </RequireAuth>
              }
            />
            <Route
              path="/signin"
              element={<div data-testid="signin-page">Sign In</div>}
            />
          </Routes>
        </AppShell>
      </MemoryRouter>
    );

    expect(await screen.findByTestId("signin-page")).toBeInTheDocument();
    expect(screen.queryByTestId("expenses-list")).not.toBeInTheDocument();
  });

  it("(10pts) Signs up succesfully from api and shows empty state when there are no expenses", async () => {
    const email = uniqueEmail("empty");
    await utils.signUp(email, "secret123", false);

    await waitFor(
      async () => {
        const list = await utils.fetchExpenses();
        expect(list.length).toBe(0);
      },
      { timeout: 10000 }
    );

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppShell>
          <Routes>
            <Route
              path="/"
              element={
                <RequireAuth>
                  <ExpensesListPage />
                </RequireAuth>
              }
            />
          </Routes>
        </AppShell>
      </MemoryRouter>
    );

    try {
      await waitForElementToBeRemoved(() => screen.getByText(/loading/i));
    } catch {}

    const listEl = await screen.findByTestId("expenses-list");
    expect(listEl).toBeInTheDocument();
    expect(await screen.findByTestId("empty-state")).toBeInTheDocument();
    expect(screen.queryAllByTestId("expense-row")).toHaveLength(0);
  });

  it("(10pts) Sign in, then add the expense via UI and expense list shows it", async () => {
    await utils.signIn(testEmail, testPassword);

    render(
      <MemoryRouter initialEntries={["/add"]}>
        <AppShell>
          <Routes>
            <Route
              path="/add"
              element={
                <RequireAuth>
                  <AddExpensePage />
                </RequireAuth>
              }
            />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <ExpensesListPage />
                </RequireAuth>
              }
            />
          </Routes>
        </AppShell>
      </MemoryRouter>
    );

    await waitForElementToBeRemoved(() => screen.getByText(/loading/i));

    const tag = `Test-Coffee`;

    await userEvent.type(screen.getByTestId("desc-input"), tag);
    await userEvent.type(screen.getByTestId("cost-input"), "3.5");
    await userEvent.click(screen.getByTestId("submit-btn"));

    await waitFor(
      async () => {
        const list = await utils.fetchExpenses();
        expect(list.some((e) => e.description === tag)).toBe(true);
      },
      { timeout: 2000 }
    );

    await screen.findByTestId("expenses-list");

    await waitFor(() => {
      expect(screen.getByTestId("expenses-list")).toHaveTextContent(tag);
    });
  });

  it("(10pts) Expenses List sorting implements useMemo: default sort by date desc → cost asc/desc toggles", async () => {
    const email = uniqueEmail("signup");
    await utils.signUp(email, "secret123", false);
    await utils.addExpense({
      description: "Zed",
      date: "2024-01-03",
      cost: 100,
      deleted: false,
    });
    await utils.addExpense({
      description: "Mike",
      date: "2024-01-02",
      cost: 50,
      deleted: false,
    });
    await utils.addExpense({
      description: "Alpha",
      date: "2024-01-01",
      cost: 1,
      deleted: false,
    });

    await waitFor(async () => {
      const list = await utils.fetchExpenses();
      const descs = list.map((e) => e.description).sort();
      expect(descs).toEqual(["Alpha", "Mike", "Zed"]);
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppShell>
          <Routes>
            <Route
              path="/"
              element={
                <RequireAuth>
                  <ExpensesListPage />
                </RequireAuth>
              }
            />
          </Routes>
        </AppShell>
      </MemoryRouter>
    );

    try {
      await waitForElementToBeRemoved(() => screen.getByText(/loading/i));
    } catch {}

    const rows = await screen.findAllByTestId("expense-row");
    expect(rows.length).toBeGreaterThanOrEqual(3);

    const readDescs = () =>
      screen.getAllByTestId("expense-row").map((row) => {
        const cell = within(row).getByTestId("cell-desc");
        const input = cell.querySelector("input") as HTMLInputElement | null;
        return input ? input.value : cell.textContent?.trim();
      });

    expect(readDescs()).toEqual(["Zed", "Mike", "Alpha"]);

    await userEvent.click(screen.getByTestId("sort-cost"));
    expect(readDescs()).toEqual(["Alpha", "Mike", "Zed"]);

    await userEvent.click(screen.getByTestId("sort-cost"));
    expect(readDescs()).toEqual(["Zed", "Mike", "Alpha"]);

    const firstRow = screen.getAllByTestId("expense-row")[0];
    await userEvent.click(within(firstRow).getByTestId("edit-btn"));
    expect(readDescs()).toEqual(["Zed", "Mike", "Alpha"]);
  });

  it("(10pts) Deleting an expense removes it from list (soft delete in api)", async () => {
    await utils.signIn(testEmail, testPassword);
    await utils.addExpense({
      description: "To remove",
      date: "2024-01-01",
      cost: 2,
      deleted: false,
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppShell>
          <Routes>
            <Route
              path="/"
              element={
                <RequireAuth>
                  <ExpensesListPage />
                </RequireAuth>
              }
            />
          </Routes>
        </AppShell>
      </MemoryRouter>
    );

    const row = (await screen.findAllByTestId("expense-row"))[0];
    await userEvent.click(within(row).getByTestId("delete-btn"));

    expect(await screen.findByTestId("expenses-list")).toBeInTheDocument();
    expect(
      screen.queryByTestId("empty-state") || screen.getByTestId("expenses-list")
    ).toBeTruthy();
  });

  it("(10pts) SignIn with wrong password shows an error, while correct password succesfully logs in the user", async () => {
    const email = uniqueEmail("signin");
    await utils.signUp(email, "correct123", false);
    await utils.signOut();

    render(
      <MemoryRouter initialEntries={["/signin"]}>
        <AppShell>
          <Routes>
            <Route path="/signin" element={<SignIn redirectTo="/" />} />
          </Routes>
        </AppShell>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByTestId("email-input"), email);
    await userEvent.type(screen.getByTestId("password-input"), "wrong");
    await userEvent.click(screen.getByTestId("submit-btn"));
    expect(await screen.findByTestId("error-box")).toBeInTheDocument();

    await userEvent.clear(screen.getByTestId("password-input"));
    await userEvent.type(screen.getByTestId("password-input"), "correct123");
    await userEvent.click(screen.getByTestId("submit-btn"));
    await Promise.resolve();
    await waitFor(
      () => {
        expect(window.location.assign).toHaveBeenCalledWith("/");
      },
      { timeout: 10000 }
    );
  });

  it("(10pts) Successful Account creation from the signup page and redirects to Expenses List page", async () => {
    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <AppShell>
          <Routes>
            <Route path="/signup" element={<SignUp redirectTo="/" />} />
          </Routes>
        </AppShell>
      </MemoryRouter>
    );

    const email = uniqueEmail("redir");
    await userEvent.type(screen.getByTestId("email-input"), email);
    await userEvent.type(screen.getByTestId("password-input"), "secret123");
    await userEvent.type(
      screen.getByTestId("confirm-password-input"),
      "secret123"
    );
    await userEvent.click(screen.getByTestId("submit-btn"));

    await waitFor(
      () => {
        expect(window.location.assign).toHaveBeenCalledWith("/");
      },
      { timeout: 10000 }
    );
  });

  it("(5pts) Total page shows correct sum of fetched expenses", async () => {
    const email = uniqueEmail("total");
    await utils.signUp(email, testPassword, false);
    await utils.addExpense({
      description: "A",
      date: "2024-01-01",
      cost: 12.5,
      deleted: false,
    });
    await utils.addExpense({
      description: "B",
      date: "2024-01-02",
      cost: 7.5,
      deleted: false,
    });

    render(
      <MemoryRouter initialEntries={["/total"]}>
        <AppShell>
          <Routes>
            <Route
              path="/total"
              element={
                <RequireAuth>
                  <TotalPage />
                </RequireAuth>
              }
            />
          </Routes>
        </AppShell>
      </MemoryRouter>
    );

    await waitForElementToBeRemoved(() => screen.getByText(/loading/i));

    await waitFor(() => {
      expect(screen.getByTestId("total-value").textContent).toMatch(/\$20\.00/);
    });
  });

  it("(5pts) Add Expense: shows errors for empty description and negative cost (single flow)", async () => {
    await utils.signIn(testEmail, testPassword);

    render(
      <MemoryRouter initialEntries={["/add"]}>
        <AppShell>
          <Routes>
            <Route
              path="/add"
              element={
                <RequireAuth>
                  <AddExpensePage />
                </RequireAuth>
              }
            />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <ExpensesListPage />
                </RequireAuth>
              }
            />
          </Routes>
        </AppShell>
      </MemoryRouter>
    );

    try {
      await waitForElementToBeRemoved(() => screen.getByText(/loading/i));
    } catch {}

    await userEvent.clear(screen.getByTestId("desc-input"));
    await userEvent.clear(screen.getByTestId("cost-input"));
    await userEvent.type(screen.getByTestId("cost-input"), "10");
    await userEvent.click(screen.getByTestId("submit-btn"));

    const dlg1 = await screen.findByRole("dialog");
    expect(
      within(dlg1).getByText(/description is required/i)
    ).toBeInTheDocument();
    await userEvent.click(within(dlg1).getByRole("button", { name: /ok/i }));

    expect(screen.getByTestId("page-add")).toBeInTheDocument();

    await userEvent.type(screen.getByTestId("desc-input"), "Test Item");
    await userEvent.clear(screen.getByTestId("cost-input"));
    await userEvent.type(screen.getByTestId("cost-input"), "-5");
    await userEvent.click(screen.getByTestId("submit-btn"));

    const dlg2 = await screen.findByRole("dialog");
    expect(
      within(dlg2).getByText(/enter a valid non-negative cost/i)
    ).toBeInTheDocument();
    await userEvent.click(within(dlg2).getByRole("button", { name: /ok/i }));

    // still on Add page
    expect(screen.getByTestId("page-add")).toBeInTheDocument();

    // Ensure nothing got written
    await waitFor(async () => {
      const list = await utils.fetchExpenses();
      expect(list.some((e) => e.description === "Test Item")).toBe(false);
    });
  });

  it("(10pts) SignUp shows error when passwords do not match", async () => {
    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <AppShell>
          <Routes>
            <Route path="/signup" element={<SignUp redirectTo="/" />} />
          </Routes>
        </AppShell>
      </MemoryRouter>
    );

    await userEvent.type(
      screen.getByTestId("email-input"),
      "mismatch@test.com"
    );
    await userEvent.type(screen.getByTestId("password-input"), "onepass");
    await userEvent.type(
      screen.getByTestId("confirm-password-input"),
      "otherpass"
    );
    await userEvent.click(screen.getByTestId("submit-btn"));

    const err = await screen.findByTestId("error-box");
    expect(err).toHaveTextContent(/passwords do not match/i);
  });
});
