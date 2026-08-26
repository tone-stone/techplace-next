"use client";

import Link from "next/link";
import { ExternalLink, Pencil, Trash2, Video as VideoIcon } from "lucide-react";
import { CATEGORY_ICONS, formatPostDate } from "@/lib/blog-posts";
import type { ManagedArticle } from "@/lib/blog/articles";
import type { DashboardRole } from "./types";

export default function ArticleList({
  articles,
  editingId,
  canDelete,
  role,
  onEdit,
  onDelete,
}: {
  articles: ManagedArticle[];
  editingId: string | null;
  canDelete: boolean;
  role: DashboardRole;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isAdmin = role === "admin";
  const cardClass = isAdmin ? "tp-dark-card-admin" : "tp-dark-card";
  const accentText = isAdmin ? "text-purple-300" : "text-indigo-300";
  const accentIconWrap = isAdmin
    ? "border-purple-400/20 bg-purple-500/10"
    : "border-indigo-400/20 bg-indigo-500/10";
  const editingRowClass = isAdmin
    ? "border-purple-400/50 bg-purple-500/6"
    : "border-indigo-400/50 bg-indigo-500/6";
  const rowHoverClass = isAdmin ? "hover:border-purple-400/30" : "hover:border-indigo-400/30";
  const editBtnActive = isAdmin
    ? "border-purple-400/50 bg-purple-500/20 text-purple-300"
    : "border-indigo-400/50 bg-indigo-500/20 text-indigo-300";
  const editBtnHover = isAdmin ? "hover:border-purple-400/40 hover:text-purple-300" : "hover:border-indigo-400/40 hover:text-indigo-300";

  return (
    <div className={`${cardClass} rounded-3xl p-6 sm:p-8`}>
      <h2 className="text-xl font-bold text-white mb-5">Artículos ({articles.length})</h2>

      <div className="space-y-3 max-h-180 overflow-y-auto pr-1">
        {articles.map((article) => {
          const Icon = CATEGORY_ICONS[article.category];
          const isEditing = article.id === editingId;
          return (
            // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
            <div
              key={article.id}
              onClick={() => onEdit(article.id)}
              className={`cursor-pointer rounded-2xl border p-4 transition-colors ${
                isEditing ? editingRowClass : `border-white/10 bg-white/2 ${rowHoverClass}`
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border ${accentIconWrap}`}
                >
                  {article.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={article.coverImageUrl} alt="" className="h-full w-full object-contain" />
                  ) : (
                    Icon && <Icon className={`h-6 w-6 ${accentText}`} strokeWidth={1.5} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="truncate font-semibold text-white">{article.title}</h3>
                    {article.status === "draft" ? (
                      <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                        Borrador
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                        Publicado
                      </span>
                    )}
                    {article.videoUrl && <VideoIcon className={`h-3.5 w-3.5 shrink-0 ${accentText}`} />}
                  </div>
                  <p className="truncate text-xs text-gray-400">
                    {article.authorName} · {article.category} · {formatPostDate(article.date)}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
                {article.status === "published" && (
                  <Link
                    href={`/blog/${article.slug}`}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 rounded-full border border-brand-blue/30 bg-brand-blue/10 px-3 py-1.5 text-xs font-medium text-brand-blue transition-colors hover:bg-brand-blue/20"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Ver artículo en el blog
                  </Link>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(article.id);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isEditing ? editBtnActive : `border-white/10 bg-white/5 text-gray-300 ${editBtnHover}`
                  }`}
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>

                {canDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(article.id);
                    }}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {articles.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">No hay artículos todavía.</p>
        )}
      </div>
    </div>
  );
}
