import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

const locales = ['en', 'fr', 'ar'];
const defaultLocale = 'en';

function getLocale(request: NextRequest): string {
  // Check if locale is already stored in cookie
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }

  // Use negotiator to determine locale from headers
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  
  try {
    return matchLocale(languages, locales, defaultLocale);
  } catch (e) {
    return defaultLocale;
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // // Exclude internal paths, static assets, and APIs
  if (
    pathname.includes('.') || // Files with extensions (icons, images, sitemap.xml)
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth/callback') || // Next-auth callback
    pathname.startsWith('/Flags')
  ) {
    return;
  }

  // Check if there is any supported locale in the pathname
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);

    // e.g. incoming is /products
    // The new URL is now /en/products
    return NextResponse.redirect(
      new URL(
        `/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`,
        request.url
      )
    );
  }

  // Extract the locale from the pathname to compute normalized path
  const localeMatch = pathname.match(/^\/([^\/]+)/);
  const currentLocale = localeMatch ? localeMatch[1] : defaultLocale;
  const normalizedPath = pathname.replace(new RegExp(`^/${currentLocale}`), '') || '/';

  // Create a response and set headers so they are available to Server Components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', normalizedPath);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/`
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
