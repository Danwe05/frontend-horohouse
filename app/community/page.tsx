import { Suspense } from "react";
import { Metadata } from "next";
import { Loader2 } from "lucide-react";
import CommunityIndexClient from "./CommunityIndexClient";

export const metadata: Metadata = {
  title: "Community — HoroHouse Host Forum & Global Network",
  description: "Connect with hosts worldwide. Ask questions, share advice on real estate, property management, and find the latest HoroHouse updates. Join Africa's largest host community.",
  openGraph: {
    title: "HoroHouse Community — Share, Learn, and Grow as a Host",
    description: "The central hub for HoroHouse hosts in Cameroon and across Africa. Join discussions on property management, hosting tips, and local real estate insights.",
    type: "website",
  },
  alternates: {
    canonical: "/community",
  },
};

export default function CommunityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A6EF5]" />
      </div>
    }>
      <CommunityIndexClient />
    </Suspense>
  );
}