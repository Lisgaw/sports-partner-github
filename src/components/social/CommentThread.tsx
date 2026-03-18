"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useLocale } from "next-intl";
import { getDateFnsLocale, resolveAppLocale } from "@/lib/localized-ui";

interface CommentThreadProps {
  comment: any;
  postId: string;
  onLike: (commentId: string) => void;
  onReply: (p: { id: string; name: string }) => void;
  onDelete?: (commentId: string) => void;
  onEdit?: (commentId: string, newContent: string) => void;
  currentUserId?: string;
  postOwnerId?: string;
  isReply?: boolean;
}

const COMMENT_COPY = {
  tr: { liked: "Beğenildi", like: "Beğen", reply: "Yanıtla", hideReplies: "Yanıtları gizle", showReplies: "yanıt gör", edit: "Düzenle", delete: "Sil", save: "Kaydet", cancel: "İptal", confirmDelete: "Bu yorumu silmek istediğinize emin misiniz?" },
  en: { liked: "Liked", like: "Like", reply: "Reply", hideReplies: "Hide replies", showReplies: "replies", edit: "Edit", delete: "Delete", save: "Save", cancel: "Cancel", confirmDelete: "Are you sure you want to delete this comment?" },
  ru: { liked: "Нравится", like: "Нравится", reply: "Ответить", hideReplies: "Скрыть ответы", showReplies: "ответов", edit: "Изменить", delete: "Удалить", save: "Сохранить", cancel: "Отмена", confirmDelete: "Вы уверены, что хотите удалить этот комментарий?" },
} as const;

type CopyKeys = keyof typeof COMMENT_COPY;

export default function CommentThread({
  comment,
  postId,
  onLike,
  onReply,
  onDelete,
  onEdit,
  currentUserId,
  postOwnerId,
  isReply = false,
}: CommentThreadProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [menuOpen, setMenuOpen] = useState(false);
  const locale = useLocale();
  const safeLocale = resolveAppLocale(locale);
  const copy = COMMENT_COPY[safeLocale as CopyKeys] ?? COMMENT_COPY.en;
  const dateFnsLocale = getDateFnsLocale(safeLocale);
  const replyCount = comment.replies?.length ?? comment._count?.replies ?? 0;

  const isMyComment = currentUserId === comment.user?.id;
  const isPostOwner = currentUserId === postOwnerId;
  const canDelete = (isMyComment || isPostOwner) && onDelete;
  const canEdit = isMyComment && onEdit;

  const handleDelete = () => {
    if (!confirm(copy.confirmDelete)) return;
    onDelete?.(comment.id);
  };

  const handleSaveEdit = () => {
    const trimmed = editContent.trim();
    if (trimmed && trimmed !== comment.content) {
      onEdit?.(comment.id, trimmed);
    }
    setEditing(false);
  };

  return (
    <div className={isReply ? "ml-8 mt-1.5" : "mt-2"}>
      <div className="flex gap-2">
        <Link href={`/profil/${comment.user?.id}`} className="shrink-0 mt-0.5">
          <div className={`${
            isReply ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs"
          } rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-400 overflow-hidden`}>
            {comment.user?.avatarUrl ? (
              <img src={comment.user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              comment.user?.name?.charAt(0)?.toUpperCase()
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="inline-block max-w-full bg-gray-100 dark:bg-gray-700/60 rounded-2xl rounded-tl-sm px-3 py-2">
            <Link href={`/profil/${comment.user?.id}`} className="text-xs font-bold text-gray-800 dark:text-gray-100 hover:text-emerald-600 transition block">
              {comment.user?.name}
            </Link>
            {editing ? (
              <div className="mt-1 space-y-1.5">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={2}
                  maxLength={500}
                  className="w-full text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
                <div className="flex gap-1.5">
                  <button onClick={handleSaveEdit} className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition">{copy.save}</button>
                  <button onClick={() => { setEditing(false); setEditContent(comment.content); }} className="text-[11px] font-bold text-gray-400 hover:text-gray-600 transition">{copy.cancel}</button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed mt-0.5 whitespace-pre-wrap break-words">{comment.content}</p>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 ml-1">
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {format(new Date(comment.createdAt), "d MMM, HH:mm", { locale: dateFnsLocale })}
            </span>
            <button
              onClick={() => onLike(comment.id)}
              className={`text-[11px] font-bold transition ${
                comment.likedByMe ? "text-red-500" : "text-gray-500 dark:text-gray-400 hover:text-red-500"
              }`}
            >
              {comment.likedByMe ? copy.liked : copy.like}
              {comment._count?.likes > 0 && (
                <span className="ml-1 text-[10px] font-normal">{comment._count.likes} ❤️</span>
              )}
            </button>
            {!isReply && (
              <button
                onClick={() => onReply({ id: comment.id, name: comment.user?.name })}
                className="text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
              >
                {copy.reply}
              </button>
            )}
            {(canEdit || canDelete) && !editing && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition p-0.5 rounded"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <circle cx="10" cy="4" r="1.5" />
                    <circle cx="10" cy="10" r="1.5" />
                    <circle cx="10" cy="16" r="1.5" />
                  </svg>
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-[80]" onClick={() => setMenuOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-[81] overflow-hidden min-w-[120px]">
                      {canEdit && (
                        <button
                          onClick={() => { setEditing(true); setMenuOpen(false); }}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                          ✏️ {copy.edit}
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => { setMenuOpen(false); handleDelete(); }}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                        >
                          🗑️ {copy.delete}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {replyCount > 0 && !isReply && (
            <div className="mt-1.5">
              <button
                onClick={() => setShowReplies(v => !v)}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline ml-1"
              >
                <svg className={`w-3 h-3 transition-transform ${showReplies ? "rotate-90" : ""}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                {showReplies ? copy.hideReplies : `${replyCount} ${copy.showReplies}`}
              </button>
              {showReplies && (
                <div className="mt-1 space-y-1">
                  {(comment.replies ?? []).map((reply: any) => (
                    <CommentThread
                      key={reply.id}
                      comment={reply}
                      postId={postId}
                      onLike={onLike}
                      onReply={onReply}
                      onDelete={onDelete}
                      onEdit={onEdit}
                      currentUserId={currentUserId}
                      postOwnerId={postOwnerId}
                      isReply={true}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
