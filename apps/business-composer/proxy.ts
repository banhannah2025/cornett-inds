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
    domain: process.env.NEXT_PUBLIC_CLERK_DOMAIN ?? "localhost:3002",
    isSatellite: process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE !== "false",
    satelliteAutoSync: true,
    signInUrl:
      process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ??
      "http://localhost:3000/sign-in",
    signUpUrl:
      process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ??
      "http://localhost:3000/sign-up",
  },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
