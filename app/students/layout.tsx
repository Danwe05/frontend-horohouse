import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Housing Cameroon — Verified Accommodations | HoroHouse",
  description: "Find your perfect student home near campus in Cameroon. Verified housing in Yaoundé, Douala, Buea, and more. Affordable apartments with reliable power and water.",
  keywords: ["student housing Cameroon", "hostel Yaounde", "accommodation Douala", "verified student homes Africa", "Buea student apartments"],
  alternates: {
    canonical: "/students",
  },
  openGraph: {
    title: "Verified Student Housing in Cameroon | HoroHouse",
    description: "Book your perfect student accommodation near your campus with verified power and water sources.",
    type: "website",
    url: "/students",
  },
};

export default function StudentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
