import { Metadata } from "next";
import { notFound } from "next/navigation";
import apiClient from "@/lib/api";
import CommunityPostClient from "./CommunityPostClient";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  try {
    const post = await apiClient.getCommunityPostBySlug(slug);
    
    // Create a clean description from body/excerpt
    const description = post.excerpt || post.body?.slice(0, 160) || post.title;
    
    return {
      title: `${post.title} — HoroHouse Community`,
      description: description,
      openGraph: {
        title: post.title,
        description: description,
        type: "article",
        publishedTime: post.createdAt,
        authors: [post.authorSnapshot.name],
        tags: post.tags,
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: description,
      },
      alternates: {
        canonical: `/community/${slug}`,
      },
    };
  } catch (error) {
    return {
      title: "Post Not Found — HoroHouse Community",
    };
  }
}

export default async function CommunityPostPage({ params }: Props) {
  const { slug } = params;
  
  let post;
  try {
    post = await apiClient.getCommunityPostBySlug(slug);
  } catch (error) {
    notFound();
  }

  // Fetch replies and related posts on the server as well for faster initial load
  let replies = [];
  let related = [];
  try {
    const [repliesRes, relatedRes] = await Promise.all([
      apiClient.getCommunityPostReplies(post.id, { limit: 20 }),
      apiClient.getCommunityPosts({ category: post.category, limit: 4 }),
    ]);
    replies = repliesRes.data ?? [];
    related = (relatedRes.data ?? []).filter((r: any) => r.id !== post.id).slice(0, 3);
  } catch (error) {
    console.error("Failed to fetch additional post data:", error);
  }

  return (
    <CommunityPostClient 
      initialPost={post} 
      initialReplies={replies} 
      initialRelated={related} 
    />
  );
}
