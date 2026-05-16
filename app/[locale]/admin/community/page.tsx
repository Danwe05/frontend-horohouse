"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Eye, Trash2, ShieldCheck, Flag } from "lucide-react";
import { apiClient } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function AdminCommunityDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") {
      router.push("/");
      return;
    }
    fetchFlaggedPosts();
  }, [user]);

  const fetchFlaggedPosts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getFlaggedCommunityPosts();
      setPosts(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUnflag = async (id: string) => {
    try {
      await apiClient.unflagCommunityPost(id);
      setPosts(p => p.filter(x => x.id !== id));
    } catch (err) {
      alert("Failed to dismiss report.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteCommunityPost(id);
      setPosts(p => p.filter(x => x.id !== id));
    } catch (err) {
      alert("Failed to delete post.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#DDDDDD]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 font-sans">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-red-50 rounded-xl">
          <Flag className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#222222]">Reported Discussions</h1>
          <p className="text-[#717171] text-sm mt-1">Review posts flagged by the community for moderation</p>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="py-20 text-center border border-[#EBEBEB] rounded-2xl bg-[#F7F7F7]">
          <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-[#222222]">All clear!</p>
          <p className="text-[#717171]">There are currently no reported discussions to review.</p>
        </div>
      ) : (
        <div className="border border-[#EBEBEB] rounded-2xl overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#F7F7F7] text-[#717171] border-b border-[#EBEBEB]">
                <tr>
                  <th className="px-6 py-4 font-semibold">Discussion Title</th>
                  <th className="px-6 py-4 font-semibold">Author</th>
                  <th className="px-6 py-4 font-semibold text-center">Reports</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBEB]">
                {posts.map(post => (
                  <tr key={post.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate font-medium text-[#222222]">
                        {post.title}
                      </div>
                      <div className="text-xs text-[#717171] mt-1 line-clamp-1 truncate max-w-xs">
                        {post.body || post.excerpt || "No content"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#EBEBEB] flex items-center justify-center text-[10px] font-bold shrink-0">
                          {post.authorSnapshot.initials}
                        </div>
                        <span className="text-[#222222] font-medium">{post.authorSnapshot.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 font-bold text-xs">
                        {post.flaggedBy.length}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 flex items-right justify-end">
                      <Link
                        href={`/community/${post.slug}`}
                        target="_blank"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#DDDDDD] text-[#717171] hover:text-[#222222] hover:bg-slate-100 transition-colors"
                        title="View post"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#DDDDDD] text-[#717171] hover:text-green-600 hover:border-green-600 hover:bg-green-50 transition-colors"
                            title="Dismiss reports (unflag)"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Dismiss reports?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will clear all reports and restore the post's status. It will no longer appear in this moderation queue.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleUnflag(post.id)} className="bg-green-600 hover:bg-green-700 text-white border-none">
                              Dismiss Reports
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#DDDDDD] text-[#717171] hover:text-red-600 hover:border-red-600 hover:bg-red-50 transition-colors"
                            title="Delete post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this discussion?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this content? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(post.id)} className="bg-red-600 hover:bg-red-700 text-white border-none">
                              Delete Post
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
