import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithPassword = vi.fn();
const signOut = vi.fn();
const redirectMock = vi.fn();
const revalidatePathMock = vi.fn();
const cookieDelete = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: vi.fn(), delete: cookieDelete }),
  headers: async () => ({ get: () => null }),
}));

vi.mock("next/server", () => ({
  // Not exercising the post-response logging path here — just confirming
  // login() doesn't blow up calling `after()` outside a request scope.
  after: (_fn: () => void) => {},
}));

let profileData: { role: string } | null = { role: "admin" };

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { signInWithPassword, signOut },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: profileData }),
        }),
      }),
    }),
  }),
}));

const { login, logout } = await import("./actions");

function formDataFrom(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("login", () => {
  beforeEach(() => {
    signInWithPassword.mockReset();
    signOut.mockReset();
    redirectMock.mockReset();
    revalidatePathMock.mockReset();
    profileData = { role: "admin" };
  });

  it("rejects an empty email/password without calling Supabase", async () => {
    const result = await login(null, formDataFrom({ email: "", password: "" }));

    expect(result).toEqual({ error: "Por favor ingresa email y contraseña" });
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("returns a generic error on bad credentials (doesn't leak which field was wrong)", async () => {
    signInWithPassword.mockResolvedValue({ data: {}, error: { message: "Invalid login credentials" } });

    const result = await login(null, formDataFrom({ email: "a@b.com", password: "wrong" }));

    expect(result).toEqual({ error: "Email o contraseña incorrectos" });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects to the requested path on success", async () => {
    signInWithPassword.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });

    await login(null, formDataFrom({ email: "a@b.com", password: "right", redirectTo: "/admin?tab=x" }));

    expect(redirectMock).toHaveBeenCalledWith("/admin?tab=x");
  });

  it("defaults to redirecting to /admin when no redirectTo is given", async () => {
    signInWithPassword.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });

    await login(null, formDataFrom({ email: "a@b.com", password: "right" }));

    expect(redirectMock).toHaveBeenCalledWith("/admin");
  });

  it("revalidates the layout so the signed-in UI reflects the new session", async () => {
    signInWithPassword.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });

    await login(null, formDataFrom({ email: "a@b.com", password: "right" }));

    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
  });

  it("lets a redactor sign in (every role can open the dashboard)", async () => {
    profileData = { role: "redactor" };
    signInWithPassword.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });

    await login(null, formDataFrom({ email: "a@b.com", password: "right" }));

    expect(redirectMock).toHaveBeenCalledWith("/admin");
    expect(signOut).not.toHaveBeenCalled();
  });

  it("signs an account with no dashboard role back out and rejects it", async () => {
    profileData = null;
    signInWithPassword.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });

    const result = await login(null, formDataFrom({ email: "a@b.com", password: "right" }));

    expect(result).toEqual({
      error: "Tu cuenta no tiene acceso al panel. Contacta a un administrador.",
    });
    expect(signOut).toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("logout", () => {
  beforeEach(() => {
    signOut.mockReset();
    redirectMock.mockReset();
    revalidatePathMock.mockReset();
  });

  it("signs out and redirects to the requested path", async () => {
    await logout(formDataFrom({ redirectTo: "/login?expired=1" }));

    expect(signOut).toHaveBeenCalled();
    expect(cookieDelete).toHaveBeenCalledWith("tp_seen");
    expect(redirectMock).toHaveBeenCalledWith("/login?expired=1");
  });

  it("defaults to /login when no redirectTo is given", async () => {
    await logout();

    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
