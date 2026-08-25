import { SignUp } from "@clerk/nextjs";

const dashboardUrl =
  process.env.NEXT_PUBLIC_BUSINESS_COMPOSER_URL ?? "http://localhost:3002";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <SignUp forceRedirectUrl={dashboardUrl} />
    </main>
  );
}
