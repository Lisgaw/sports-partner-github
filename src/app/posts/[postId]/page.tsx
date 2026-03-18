"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import toast from "@/lib/toast";

export default function PostDetailPage() {
  const { postId } = useParams();
  const searchParams = useSearchParams();
  const targetCommentId = searchParams.get("commentId");
  const { data: session } = useSession();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null); // { id: string, name: string }

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${postId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gönderi bulunamadı");
      setPost(json.post);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      const json = await res.json();
      setComments(json.comments || []);
    } catch {
      toast.error("Yorumlar yüklenemedi");
    } finally {
      setCommentsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
  }, [postId, fetchPost, fetchComments]);

  // Target comment scroll
  useEffect(() => {
    if (!commentsLoading && targetCommentId) {
      const el = document.getElementById(`comment-${targetCommentId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-emerald-500", "bg-emerald-50/50");
        setTimeout(() => {
            el.classList.remove("ring-2", "ring-emerald-500", "bg-emerald-50/50");
        }, 3000);
      }
    }
  }, [commentsLoading, targetCommentId, comments]);

  const handleLike = async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      const json = await res.json();
      setPost((prev: any) => ({
        ...prev,
        liked: json.liked,
        _count: { ...prev._count, likes: json.likeCount }
      }));
    } catch {
      toast.error("İşlem yapılamadı");
    }
  };

  const handleCommentLike = async (commentId: string) => {
     try {
       const res = await fetch(`/api/comments/${commentId}/like`, { method: "POST" });
       const json = await res.json();
       
       const updateComment = (list: any[]): any[] => {
          return list.map(c => {
             if (c.id === commentId) {
                return { ...c, likedByMe: json.liked, _count: { ...c._count, likes: json.likeCount } };
             }
             if (c.replies?.length > 0) {
                return { ...c, replies: updateComment(c.replies) };
             }
             return c;
          });
       };
       setComments(prev => updateComment(prev));
     } catch { /* ignore */ }
  };

  const handleCommentDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments?commentId=${commentId}`, { method: "DELETE" });
      if (res.ok) {
        const removeFromList = (list: any[]): any[] =>
          list.filter(c => c.id !== commentId).map(c =>
            c.replies?.length ? { ...c, replies: removeFromList(c.replies) } : c
          );
        setComments(prev => removeFromList(prev));
        setPost((prev: any) => ({ ...prev, _count: { ...prev._count, comments: Math.max(0, (prev._count.comments || 1) - 1) } }));
      }
    } catch { /* ignore */ }
  };

  const handleCommentEdit = async (commentId: string, newContent: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, content: newContent }),
      });
      const json = await res.json();
      if (json.success) {
        const updateContent = (list: any[]): any[] =>
          list.map(c => {
            if (c.id === commentId) return { ...c, content: newContent };
            if (c.replies?.length) return { ...c, replies: updateContent(c.replies) };
            return c;
          });
        setComments(prev => updateContent(prev));
      }
    } catch { /* ignore */ }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            content: commentText.trim(),
            parentId: replyingTo?.id || null
        }),
      });
      const json = await res.json();
      if (json.comment) {
        if (replyingTo) {
            setComments(prev => prev.map(c => 
                c.id === replyingTo.id ? { ...c, replies: [...(c.replies || []), json.comment] } : c
            ));
        } else {
            setComments(prev => [...prev, json.comment]);
        }
        setCommentText("");
        setReplyingTo(null);
        setPost((prev: any) => ({ ...prev, _count: { ...prev._count, comments: (prev._count.comments || 0) + 1 } }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Yükleniyor...</div>;
  if (!post) return <div className="p-8 text-center text-gray-400">Gönderi bulunamadı veya erişim izniniz yok.</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 pb-32">
      <header className="flex items-center gap-4 mb-6">
        <Link href="/sosyal" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
          <span className="text-xl">←</span>
        </Link>
        <h1 className="font-bold text-lg">Gönderi Detayı</h1>
      </header>

      <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
        <div className="p-4 flex items-center gap-3">
          <Link href={`/profil/${post.user.id}`}>
            <div className="w-10 h-10 rounded-full bg-emerald-100 overflow-hidden flex items-center justify-center font-bold text-emerald-700">
              {post.user.avatarUrl ? <img src={post.user.avatarUrl} className="w-full h-full object-cover" /> : (post.user.name?.[0] ?? "?")}
            </div>
          </Link>
          <div>
            <Link href={`/profil/${post.user.id}`} className="font-bold text-sm hover:text-emerald-500 transition">{post.user.name}</Link>
            <p className="text-xs text-gray-400">{format(new Date(post.createdAt), "d MMMM yyyy, HH:mm", { locale: tr })}</p>
          </div>
        </div>

        {post.content && <p className="px-4 pb-3 text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>}
        
        {post.images?.length > 0 && (
          <div className="grid gap-1">
            {post.images.map((img: string, i: number) => (
              <img key={i} src={img} alt="" className="w-full h-auto max-h-[600px] object-cover" />
            ))}
          </div>
        )}

        <div className="p-4 border-t dark:border-gray-700 flex gap-6 items-center">
          <button onClick={handleLike} className={`flex items-center gap-2 text-sm transition ${post.liked ? "text-red-500 font-bold" : "text-gray-400 hover:text-red-400"}`}>
            <span className="text-xl">{post.liked ? "❤️" : "🤍"}</span> {post._count.likes}
          </button>
          <span className="flex items-center gap-2 text-sm text-gray-400">
            <span className="text-xl">💬</span> {post._count.comments}
          </span>
        </div>
      </article>

      <section className="space-y-6">
        <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-4 px-1">Yorumlar</h3>
        {commentsLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl" />)}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/20 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700">
             <p className="text-gray-400 text-sm">Henüz yorum yapılmamış. İlk yorumu sen yap!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((c: any) => (
                <CommentItem 
                    key={c.id} 
                    comment={c} 
                    onReply={(parent) => {
                        setReplyingTo(parent);
                        const input = document.getElementById("comment-input");
                        input?.focus();
                    }}
                    onLike={handleCommentLike}
                    onDelete={handleCommentDelete}
                    onEdit={handleCommentEdit}
                    currentUserId={session?.user?.id}
                    postOwnerId={post?.userId ?? post?.user?.id}
                />
            ))}
          </div>
        )}
      </section>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t dark:border-gray-800 max-w-2xl mx-auto z-50">
        {replyingTo && (
            <div className="bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-t-xl mb-1 flex justify-between items-center animate-in slide-in-from-bottom-2">
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                    <b>{replyingTo.name}</b> kişisine yanıt veriliyor...
                </p>
                <button onClick={() => setReplyingTo(null)} className="text-emerald-700 dark:text-emerald-300 text-xs hover:underline">Vazgeç</button>
            </div>
        )}
        <div className="flex gap-3 items-center">
            <input 
              id="comment-input"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleComment()}
              placeholder={replyingTo ? "Yanıt yaz..." : "Düşüncelerini paylaş..."}
              className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
            <button 
              onClick={handleComment}
              disabled={submitting || !commentText.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-6 py-3 text-sm font-bold disabled:opacity-50 transition-all transform active:scale-95 shrink-0"
            >
              {submitting ? "..." : "Gönder"}
            </button>
        </div>
      </div>
    </div>
  );
}

function CommentItem({ comment, onReply, onLike, onDelete, onEdit, currentUserId, postOwnerId }: { comment: any, onReply: (p: any) => void, onLike: (id: string) => void, onDelete?: (id: string) => void, onEdit?: (id: string, content: string) => void, currentUserId?: string, postOwnerId?: string }) {
    const [editing, setEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const isMyComment = currentUserId === comment.user?.id;
    const isPostOwner = currentUserId === postOwnerId;
    const canDelete = (isMyComment || isPostOwner) && onDelete;
    const canEdit = isMyComment && onEdit;

    return (
        <div id={`comment-${comment.id}`} className="group transition-all duration-300 p-1 rounded-2xl">
            <div className="flex gap-3">
                <Link href={`/profil/${comment.user?.id ?? ""}`} className="shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center font-bold text-sm shadow-sm">
                    {comment.user?.avatarUrl ? <img src={comment.user.avatarUrl} className="w-full h-full object-cover" /> : (comment.user?.name?.[0] ?? "?")}
                    </div>
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl rounded-tl-none shadow-sm relative">
                        <div className="flex justify-between items-start mb-1">
                            <Link href={`/profil/${comment.user?.id ?? ""}`} className="text-xs font-bold text-gray-800 dark:text-gray-100 hover:text-emerald-500 transition">{comment.user?.name ?? "Silinmiş Kullanıcı"}</Link>
                            <button 
                                onClick={() => onLike(comment.id)}
                                className={`text-xs flex items-center gap-1 transition ${comment.likedByMe ? "text-rose-500" : "text-gray-400 hover:text-rose-400"}`}
                            >
                                {comment.likedByMe ? "❤️" : "🤍"} <span className="font-medium">{comment._count?.likes || 0}</span>
                            </button>
                        </div>
                        {editing ? (
                            <div className="space-y-1.5">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    rows={2}
                                    maxLength={500}
                                    className="w-full text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => { const t = editContent.trim(); if (t && t !== comment.content) onEdit?.(comment.id, t); setEditing(false); }} className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition">Kaydet</button>
                                    <button onClick={() => { setEditing(false); setEditContent(comment.content); }} className="text-[11px] font-bold text-gray-400 hover:text-gray-600 transition">İptal</button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{comment.content}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 ml-1">
                        <p className="text-[10px] text-gray-400 font-medium">{format(new Date(comment.createdAt), "d MMM, HH:mm", { locale: tr })}</p>
                        <button 
                            onClick={() => onReply({ id: comment.id, name: comment.user?.name ?? "Kullanıcı" })}
                            className="text-[11px] font-bold text-gray-500 hover:text-emerald-600 uppercase tracking-tighter"
                        >
                            Yanıtla
                        </button>
                        {canEdit && !editing && (
                            <button onClick={() => setEditing(true)} className="text-[11px] font-bold text-gray-400 hover:text-blue-500 transition">Düzenle</button>
                        )}
                        {canDelete && (
                            <button onClick={() => { if (confirm("Bu yorumu silmek istiyor musun?")) onDelete?.(comment.id); }} className="text-[11px] font-bold text-gray-400 hover:text-red-500 transition">Sil</button>
                        )}
                    </div>

                    {/* Replies (Nested) */}
                    {comment.replies?.length > 0 && (
                        <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-100 dark:border-gray-800">
                            {comment.replies.map((reply: any) => (
                                <CommentItem key={reply.id} comment={reply} onReply={onReply} onLike={onLike} onDelete={onDelete} onEdit={onEdit} currentUserId={currentUserId} postOwnerId={postOwnerId} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

