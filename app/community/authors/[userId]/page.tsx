import { Metadata } from "next";
import { notFound } from "next/navigation";
import apiClient from "@/lib/api";
import CommunityAuthorClient from "./CommunityAuthorClient";

interface Props {
  params: { userId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = params;
  try {
    const profile = await apiClient.getCommunityAuthorProfile(userId);
    const { user } = profile;
    
    const description = user.bio || `${user.name} is a ${user.role.replace("_", " ")} on HoroHouse Community.`;
    
    return {
      title: `${user.name} — HoroHouse Community Author`,
      description: description,
      openGraph: {
        title: `${user.name}'s Profile — HoroHouse Community`,
        description: description,
        type: "profile",
        username: user.name,
      },
      alternates: {
        canonical: `/community/authors/${userId}`,
      },
    };
  } catch (error) {
    return {
      title: "Author Not Found — HoroHouse Community",
    };
  }
}

export default async function CommunityAuthorPage({ params }: Props) {
  const { userId } = params;
  
  let profile;
  let postsRes;
  try {
    [profile, postsRes] = await Promise.all([
      apiClient.getCommunityAuthorProfile(userId),
      apiClient.getCommunityAuthorPosts(userId, { limit: 30, sortOrder: "desc" }),
    ]);
  } catch (error) {
    notFound();
  }

  return (
    <CommunityAuthorClient 
      initialProfile={profile} 
      initialPosts={postsRes.data ?? []} 
    />
  );
}
