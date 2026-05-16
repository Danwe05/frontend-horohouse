// Server Component — forces dynamic rendering before handing off to the client
export const dynamic = 'force-dynamic';

import MyReviewsClient from './MyReviewsClient';

export default function MyReviewsPage() {
  return <MyReviewsClient />;
}