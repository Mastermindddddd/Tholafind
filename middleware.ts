import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Anonymous search is a deliberate product decision (see Phase 1 of the
// implementation plan): don't force signup before someone sees value.
// Only collections and onboarding require a signed-in user.
const isProtectedRoute = createRouteMatcher(['/collections(.*)', '/onboarding(.*)']);

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
