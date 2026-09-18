import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Page routes: unauthenticated visits get redirected to sign-in.
const isProtectedPage = createRouteMatcher(['/collections(.*)', '/onboarding(.*)']);

// API routes: unauthenticated requests get a JSON 401, never a redirect —
// the client can't do anything useful with an HTML sign-in page as a
// fetch() response body.
const isProtectedApi = createRouteMatcher(['/api/upload(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedApi(req)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, message: 'Sign in to start a hunt.' },
        { status: 401 }
      );
    }
    return;
  }

  if (isProtectedPage(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico)).*)',
    '/(api|trpc)(.*)',
  ],
};