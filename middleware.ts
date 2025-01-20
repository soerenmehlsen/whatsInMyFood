import { clerkMiddleware } from "@clerk/nextjs/server";

//export default clerkMiddleware;

export default clerkMiddleware({
    publicRoutes: ["/", "/sign-in", "/sign-up"],
    afterAuth(auth, req) {
      if (!auth.userId && !auth.isPublicRoute) {
        return Response.redirect(new URL('/sign-in', req.url));
      }
    }
  });

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};