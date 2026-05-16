import { Metadata } from 'next';
import LoginClient from '@/components/auth/LoginClient';
import { getTranslations, Language } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const p = await params;
  const dictionary = getTranslations(p.locale as Language);
  // Default fallbacks in case translation object structure differs occasionally
  const title = dictionary?.auth?.login?.signIn || 'Sign In';
  const description = dictionary?.auth?.login?.signInToContinue || 'Sign in to continue to your account';
  
  return {
    title: `${title} | HoroHouse`,
    description,
  };
}

export default function LoginPage() {
  return <LoginClient />;
}