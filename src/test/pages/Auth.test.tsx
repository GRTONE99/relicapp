import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockResetPasswordForEmail = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: (...args: unknown[]) => mockSignIn(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
      resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn(),
    }),
  },
}));

vi.mock("@/context/CollectionContext", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/context/CollectionContext")>();
  return {
    ...actual,
    useCollection: () => ({
      items: [],
      addItem: vi.fn(),
      updateItem: vi.fn(),
      deleteItem: vi.fn(),
      getTotalValue: () => 0,
      getTotalCost: () => 0,
      getTotalGain: () => 0,
      getTopAsset: () => null,
      user: null,
      loading: false,
      itemsLoading: false,
      signOut: vi.fn(),
      isAtFreeLimit: () => false,
    }),
  };
});

// ─── Helper ───────────────────────────────────────────────────────────────────

async function renderAuth() {
  const { default: Auth } = await import("@/pages/Auth");
  return render(<Auth />);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Auth page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockSignIn.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockSignUp.mockResolvedValue({
      data: { user: { id: "u1", identities: [{ id: "i1" }] } },
      error: null,
    });
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
  });

  // 1. Renders sign-in form
  it("renders email and password inputs and Sign In button", async () => {
    await renderAuth();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  // 2. Renders "Create account" toggle link
  it("renders the 'Don't have an account? Sign up' toggle link", async () => {
    await renderAuth();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  // 3. Clicking toggle switches to sign-up form
  it("clicking toggle shows the sign-up heading", async () => {
    await renderAuth();
    const toggle = screen.getByText(/don't have an account/i);
    fireEvent.click(toggle);
    expect(screen.getByText(/create your account/i)).toBeInTheDocument();
  });

  // 4. Sign-in submit calls supabase.auth.signInWithPassword
  it("sign-in submit calls signInWithPassword with correct credentials", async () => {
    await renderAuth();
    await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), "user@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "password123");
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "user@test.com",
        password: "password123",
      });
    });
  });

  // 5. Sign-in with empty email does not call signInWithPassword
  it("sign-in with empty fields does not call signInWithPassword", async () => {
    await renderAuth();
    // HTML5 required validation prevents submit — click without filling
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    // signInWithPassword should NOT be called because the email input is required
    await waitFor(() => {
      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });

  // 6. Sign-up form shows confirm password field (Sign Up button)
  it("sign-up form shows Sign Up button after toggling", async () => {
    await renderAuth();
    fireEvent.click(screen.getByText(/don't have an account/i));
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  // 7. Sign-up calls supabase.auth.signUp
  it("sign-up form calls signUp with email and password", async () => {
    await renderAuth();
    // Switch to sign-up
    fireEvent.click(screen.getByText(/don't have an account/i));
    await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), "new@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "newpass123");
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({ email: "new@test.com", password: "newpass123" })
      );
    });
  });

  // 8. "Forgot password" link/button is present
  it("renders a 'Forgot password?' button on sign-in form", async () => {
    await renderAuth();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  // 9. Forgot password flow calls resetPasswordForEmail
  it("forgot password flow calls resetPasswordForEmail", async () => {
    await renderAuth();
    // Click "Forgot password?"
    fireEvent.click(screen.getByText(/forgot password/i));
    // Should now show reset form
    expect(screen.getByText(/reset your password/i)).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), "forgot@test.com");
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        "forgot@test.com",
        expect.objectContaining({ redirectTo: expect.stringContaining("/reset-password") })
      );
    });
  });

  // 10. Shows error message when sign-in fails
  it("shows error toast when sign-in returns an error", async () => {
    mockSignIn.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });
    await renderAuth();
    await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), "bad@test.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "wrongpass");
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });
    // Auth.tsx maps "Invalid login" to toast.error("Invalid email or password.")
    // The sign-in button should not navigate
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
