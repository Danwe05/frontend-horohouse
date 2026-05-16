import { apiClient } from "@/lib/api";
import StudentIndexClient from "./StudentIndexClient";

export default async function StudentsPage() {
  const [initialData, stats, translations] = await Promise.all([
    apiClient.searchStudentProperties({ page: 1, limit: 18, sortBy: "campusProximityMeters", sortOrder: "asc" }).catch(() => ({ properties: [], total: 0, totalPages: 1 })),
    apiClient.getStudentPropertyStats().catch(() => null),
    {}
  ]);

  return (
    <StudentIndexClient 
      initialData={initialData} 
      initialStats={stats}
      translations={translations}
    />
  );
}