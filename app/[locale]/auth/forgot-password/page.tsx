import { Metadata } from 'next';
import ForgotPasswordClient from '@/components/auth/ForgotPasswordClient';
import { getTranslations, Language } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const p = await params;
  const dictionary = getTranslations(p.locale as Language);
  const title = dictionary?.auth?.forgotPassword?.title || 'Forgot Password';
  const description = dictionary?.auth?.forgotPassword?.desc || 'Enter your email address to reset password';
  
  return {
    title: `${title} | HoroHouse`,
    description,
  };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}