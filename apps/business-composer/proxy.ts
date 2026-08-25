import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isInternalRoute = createRouteMatcher([
  "/internal(.*)",
  "/api/internal(.*)",
]);

export default clerkMiddleware(
  async (auth, request) => {
    if (isInternalRoute(request)) await auth.protect();
  },
  {
    isSatellite: false,
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
  },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
