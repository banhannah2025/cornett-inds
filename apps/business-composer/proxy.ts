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
    domain: "localhost:3002",
    isSatellite: true,
    satelliteAutoSync: true,
    signInUrl: "http://localhost:3000/sign-in",
    signUpUrl: "http://localhost:3000/sign-up",
  },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
