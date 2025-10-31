import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
} from "react-router-dom";
import ExpensesListPage from "./pages/ExpensesListPage";
import AddExpensePage from "./pages/AddExpensePage";
import TotalPage from "./pages/TotalPage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import { AuthProvider, useAuth } from "./AuthContext";
import RequireAuth from "./RequireAuth";
import LogoutButton from "./LogoutButton";

const Nav: React.FC = () => {
  const { pathname } = useLocation();
  const isAuthPage = pathname === "/signin" || pathname === "/signup";
  const { user } = useAuth();

  if (isAuthPage) return null;

  return (
    <nav className="top-nav">
      <NavLink to="/" end className="nav-link" data-testid="expenses">
        Expenses
      </NavLink>
      <NavLink to="/add" className="nav-link" data-testid="add-expense">
        Add Expense
      </NavLink>
      <NavLink to="/total" className="nav-link" data-testid="total-link">
        Total
      </NavLink>

      <div className="spacer" style={{ flex: 1 }} />

      {user?.email && (
        <span
          className="nav-link"
          style={{ opacity: 0.8 }}
          data-testid="user-email"
        >
          {user.email}
        </span>
      )}

      <LogoutButton />
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-container">
          <Nav />
          <div className="app-inner">
            <Routes>
              <Route path="/signin" element={<SignIn redirectTo="/" />} />
              <Route path="/signup" element={<SignUp redirectTo="/" />} />

              <Route
                path="/"
                element={
                  <RequireAuth>
                    <ExpensesListPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/add"
                element={
                  <RequireAuth>
                    <AddExpensePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/total"
                element={
                  <RequireAuth>
                    <TotalPage />
                  </RequireAuth>
                }
              />

              <Route path="*" element={<Navigate to="/signin" replace />} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
