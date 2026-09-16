"use client";

/**
 * Account management panel. Used in two places, both inside `/admin`:
 *  - CRM "Usuarios" tab — `scope="all"`, every account, `assignableRoles`
 *    is whatever the signed-in dios/admin may grant.
 *  - Blog module "Usuarios del blog" sub-panel — `scope="blog"`, submits a
 *    hidden `panel=blog` so the server actions restrict to blog/redactor.
 * Backed by `createUserAction` / `updateUserAction` / `deleteUserAction` /
 * `listUsers`.
 */

import { useState, useTransition, type FormEvent } from "react";
import { Pencil, ShieldCheck, Trash2, User as UserIcon, UserPlus, X } from "lucide-react";
import { createUserAction, deleteUserAction, listUsers, updateUserAction, type ManagedUser } from "@/lib/auth/users";
import type { Role } from "@/lib/auth/roles";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

// Formats a user's initials (up to two) for their avatar badge.
function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const ROLE_LABELS: Record<Role, string> = {
  dios: "Modo Dios",
  admin: "Administrador",
  ejecutivo: "Ejecutivo",
  blog: "Blog",
  redactor: "Redactor",
};

/** Roles that read as "elevated" — get the accent badge + shield icon. */
const ELEVATED: Role[] = ["dios", "admin"];

const ACCENTS = {
  sky: {
    card: "tp-dark-card-crm",
    newBtn: "border-sky-400/30 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25",
    formBox: "border-sky-400/20 bg-sky-500/5",
    editRow: "border-sky-400/50 bg-sky-500/6",
    avatar: "border-sky-400/25 bg-sky-500/10 text-sky-300",
    badge: "border-sky-400/30 bg-sky-500/15 text-sky-300",
    editBtn: "hover:bg-sky-500/10 hover:text-sky-300",
    field: "focus:border-sky-400 focus:ring focus:ring-sky-400/30",
  },
  purple: {
    card: "tp-dark-card-admin",
    newBtn: "border-purple-400/30 bg-purple-500/15 text-purple-300 hover:bg-purple-500/25",
    formBox: "border-purple-400/20 bg-purple-500/5",
    editRow: "border-purple-400/50 bg-purple-500/6",
    avatar: "border-purple-400/25 bg-purple-500/10 text-purple-300",
    badge: "border-purple-400/30 bg-purple-500/15 text-purple-300",
    editBtn: "hover:bg-purple-500/10 hover:text-purple-300",
    field: "focus:border-purple-400 focus:ring focus:ring-purple-400/30",
  },
} as const;

/**
 * @param assignableRoles - Roles the signed-in manager may grant; also the
 * options shown in the form's Rol select.
 * @param accent - "sky" for the CRM Usuarios tab, "purple" for the Blog module.
 */
export default function UserManagement({
  currentUserId,
  initialUsers,
  assignableRoles,
  scope = "all",
  accent = "sky",
}: {
  currentUserId: string;
  initialUsers: ManagedUser[];
  assignableRoles: Role[];
  scope?: "all" | "blog";
  accent?: "sky" | "purple";
}) {
  const a = ACCENTS[accent];
  const fieldClasses = `tp-glass-input w-full px-3 py-2 rounded-lg text-white placeholder-gray-500 outline-none transition ${a.field}`;
  const defaultRole: Role = assignableRoles[0] ?? "redactor";

  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(defaultRole);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ManagedUser | null>(null);
  const [pending, startTransition] = useTransition();

  const isSelf = editingId === currentUserId;

  const refresh = async () => {
    const result = await listUsers({ blogOnly: scope === "blog" });
    if ("users" in result) setUsers(result.users);
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole(defaultRole);
    setEditingId(null);
    setFormOpen(false);
    setError(null);
  };

  const startCreate = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole(defaultRole);
    setError(null);
    setFormOpen(true);
  };

  const startEdit = (user: ManagedUser) => {
    setEditingId(user.id);
    setName(user.name);
    setEmail(user.email);
    setRole(assignableRoles.includes(user.role) ? user.role : defaultRole);
    setPassword("");
    setError(null);
    setFormOpen(true);
  };

  const removeUser = (id: string) => {
    if (id === currentUserId) return;
    setError(null);
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteUserAction(id, { blogOnly: scope === "blog" });
      if (result && "error" in result) {
        setError(result.error);
      } else {
        await refresh();
        if (editingId === id) resetForm();
      }
      setDeletingId(null);
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = editingId
        ? await updateUserAction(null, formData)
        : await createUserAction(null, formData);

      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      await refresh();
      resetForm();
    });
  };

  const elevated = users.filter((u) => ELEVATED.includes(u.role)).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={`${a.card} rounded-2xl p-5`}>
          <p className="text-2xl font-bold">{users.length}</p>
          <p className="text-xs text-gray-400">Usuarios totales</p>
        </div>
        <div className={`${a.card} rounded-2xl p-5`}>
          <p className="text-2xl font-bold">{elevated}</p>
          <p className="text-xs text-gray-400">Dios / Admin</p>
        </div>
        <div className={`${a.card} rounded-2xl p-5`}>
          <p className="text-2xl font-bold">{users.length - elevated}</p>
          <p className="text-xs text-gray-400">Resto</p>
        </div>
      </div>

      <div className={`${a.card} rounded-3xl p-6 sm:p-8`}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-white">Usuarios ({users.length})</h2>
          {!formOpen && (
            <button
              type="button"
              onClick={startCreate}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${a.newBtn}`}
            >
              <UserPlus className="h-4 w-4" /> Nuevo usuario
            </button>
          )}
        </div>

        {formOpen && (
          <form onSubmit={handleSubmit} className={`mb-5 space-y-3 rounded-2xl border p-4 ${a.formBox}`}>
            {editingId && <input type="hidden" name="id" value={editingId} />}
            {scope === "blog" && <input type="hidden" name="panel" value="blog" />}

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                {editingId ? "Editar usuario" : "Nuevo usuario"}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Cancelar
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nombre</label>
                <input
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Nombre completo"
                  className={fieldClasses}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="correo@ejemplo.com"
                  className={fieldClasses}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  {editingId ? "Nueva contraseña (opcional)" : "Contraseña"}
                </label>
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!editingId}
                  placeholder={editingId ? "Dejar en blanco para no cambiarla" : "Mínimo 8 caracteres"}
                  className={fieldClasses}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Rol</label>
                <select
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  disabled={isSelf}
                  className={`${fieldClasses} disabled:opacity-60`}
                >
                  {assignableRoles.map((r) => (
                    <option key={r} value={r} className="bg-[#0d0c16]">
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="tp-btn-animated rounded-full px-5 py-2 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 disabled:opacity-60"
            >
              {pending ? "Guardando…" : editingId ? "Guardar cambios" : "Crear usuario"}
            </button>
          </form>
        )}

        <div className="space-y-2.5">
          {users.map((user) => (
            <div
              key={user.id}
              className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 transition-colors ${
                user.id === editingId ? a.editRow : "border-white/10 bg-white/2"
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${a.avatar}`}
              >
                {initials(user.name)}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {user.name} {user.id === currentUserId && <span className="text-gray-500">(Tú)</span>}
                </p>
                <p className="truncate text-xs text-gray-400">{user.email}</p>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                  ELEVATED.includes(user.role)
                    ? a.badge
                    : "border-indigo-400/30 bg-indigo-500/15 text-indigo-300"
                }`}
              >
                {ELEVATED.includes(user.role) ? (
                  <ShieldCheck className="h-3.5 w-3.5" />
                ) : (
                  <UserIcon className="h-3.5 w-3.5" />
                )}
                {ROLE_LABELS[user.role]}
              </span>

              <button
                type="button"
                onClick={() => startEdit(user)}
                aria-label="Editar usuario"
                className={`shrink-0 rounded-full p-2 text-gray-500 transition-colors ${a.editBtn}`}
              >
                <Pencil className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setToDelete(user)}
                disabled={user.id === currentUserId || (pending && deletingId === user.id)}
                aria-label="Eliminar usuario"
                className="shrink-0 rounded-full p-2 text-gray-500 transition-colors enabled:hover:bg-red-500/10 enabled:hover:text-red-400 disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {users.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-500">No hay usuarios todavía.</p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar cuenta"
        confirmLabel="Desactivar"
        body={
          toDelete
            ? `Se desactivará la cuenta de ${toDelete.name} (${toDelete.email}); no podrá iniciar sesión.`
            : undefined
        }
        onConfirm={() => {
          if (toDelete) removeUser(toDelete.id);
        }}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
