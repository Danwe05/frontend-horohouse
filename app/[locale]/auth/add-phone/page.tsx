import { Metadata } from 'next';
import AddPhoneClient from '@/components/auth/AddPhoneClient';
import { getTranslations, Language } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const p = await params;
  const dictionary = getTranslations(p.locale as Language);
  const title = dictionary?.auth?.addPhone?.title || 'Add New Phone';
  const description = dictionary?.auth?.addPhone?.desc || 'Verify your new phone number';
  
  return {
    title: `${title} | HoroHouse`,
    description,
  };
}

export default function AddPhonePage({ params }: { params: Promise<{ locale: string }> }) {
  return <AddPhoneClient />;
}