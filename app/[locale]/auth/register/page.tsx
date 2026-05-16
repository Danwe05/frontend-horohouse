import { Metadata } from 'next';
import RegisterClient from '@/components/auth/RegisterClient';
import { getTranslations, Language } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const p = await params;
  const dictionary = getTranslations(p.locale as Language);
  const title = dictionary?.auth?.register?.createAccount || 'Create Account';
  const description = dictionary?.auth?.register?.createAccountAndStart || 'Create your account and start your journey';
  
  return {
    title: `${title} | HoroHouse`,
    description,
  };
}

export default function RegisterPage() {
  return <RegisterClient />;
}