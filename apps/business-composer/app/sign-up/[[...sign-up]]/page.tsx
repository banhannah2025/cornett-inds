import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--canvas)] px-6 py-16">
      <SignUp signInUrl="/sign-in" />
    </main>
  );
}
