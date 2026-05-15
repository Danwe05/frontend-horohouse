import { redirect } from "next/navigation";

/**
 * Old route `/community/author/[username]` — username-based lookups are no
 * longer supported now that the API is user-ID based.
 * Redirect gracefully to the community index.
 */
export default function LegacyAuthorPage() {
  redirect("/community");
}
