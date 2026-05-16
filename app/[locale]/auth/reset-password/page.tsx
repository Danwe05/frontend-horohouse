import { Metadata } from 'next';
import ResetPasswordClient from '@/components/auth/ResetPasswordClient';
import { getTranslations, Language } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const p = await params;
  const dictionary = getTranslations(p.locale as Language);
  const title = dictionary?.auth?.resetPassword?.title || 'Reset Password';
  const description = dictionary?.auth?.resetPassword?.desc || 'Enter your new password below';
  
  return {
    title: `${title} | HoroHouse`,
    description,
  };
}

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}