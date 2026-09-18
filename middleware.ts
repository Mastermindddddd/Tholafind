import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Anonymous *browsing* is still fine (e.g. viewing a shared /results page),
// but starting a hunt now requires a signed-in user. Collections and
// onboarding were already gated.
const isProtectedRoute = createRouteMatcher([
  '/collections(.*)',
  '/onboarding(.*)',
  '/api/upload(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless referenced in a search param.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico)).*)',
    // Always run for API routes.
    '/(api|trpc)(.*)',
  ],
};