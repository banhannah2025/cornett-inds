import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { StudentWorkspace } from "./student-workspace";
import "../school.css";
export const metadata = {
  title: "Student Learning Center | Cornett School of Christianity",
};
export const dynamic = "force-dynamic";
export default async function StudentPage() {
  const enabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const signedIn = enabled ? Boolean((await auth()).userId) : false;
  return (
    <div className="cornett-school">
      <header className="school-header">
        <Link className="school-parent" href="/apps/cornett-school">
          CORNETT SCHOOL OF CHRISTIANITY
        </Link>
        <span className="school-badge">Student learning center</span>
      </header>
      <main className="school-content school-course-page">
        <h1>
          Your learning.
          <br />
          <em>Your next step.</em>
        </h1>
        {signedIn ? (
          <StudentWorkspace />
        ) : (
          <section className="school-card">
            <h2>
              {enabled ? "Sign in to continue" : "Account setup is pending"}
            </h2>
            <p>
              Practice lessons are available without a student record. Recorded
              learning requires sign-in, private storage, and founder-approved
              pilot access. Paid enrollment is not open.
            </p>
            {enabled && (
              <Link href="/sign-in?redirect_url=%2Fapps%2Fcornett-school%2Fstudent">
                Sign in to Blended Works
              </Link>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
