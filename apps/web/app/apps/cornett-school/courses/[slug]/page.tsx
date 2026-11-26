import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { curriculum, assessmentPolicy } from "../../curriculum";
import { pathways } from "../../catalog";
import "../../school.css";

export const dynamicParams = false;
export function generateStaticParams() {
  return curriculum.map((course) => ({ slug: course.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = curriculum.find((item) => item.slug === slug);
  return {
    title: `${course?.title ?? "Course not found"} | Cornett School of Christianity`,
    description: course
      ? `Explore the proposed syllabus, learning outcomes, and assessment for ${course.title}.`
      : undefined,
  };
}
export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = curriculum.find((item) => item.slug === slug);
  if (!course) notFound();
  const pathway = pathways[course.pathway]!;
  const previous = curriculum.filter((item) => item.pathway < course.pathway);
  return (
    <div className="cornett-school">
      <header className="school-header">
        <Link href="/apps/cornett-school" className="school-parent">
          CORNETT SCHOOL OF CHRISTIANITY
        </Link>
        <span className="school-badge">{course.status}</span>
      </header>
      <main className="school-content school-course-page">
        <Link href="/apps/cornett-school?section=programs">
          Back to all pathways
        </Link>
        <p className="school-eyebrow">
          {course.id} · {pathway.level} · {course.hours} planned study hours
        </p>
        <h1>{course.title}</h1>
        <p className="school-lead">
          Part of {pathway.title}. This is a curriculum blueprint, not a
          released course. Full lessons, cleared resources, and graded
          assessments are in development.
        </p>
        <section className="school-card">
          <h2>Preparation and pace</h2>
          <p>
            {course.pathway === 0
              ? "No prior Bible knowledge required. Complete orientation and begin with the first course; follow the suggested sequence."
              : `Recommended preparation: complete ${pathways[course.pathway - 1]!.title}, or request a founder review of equivalent learning before graded enrollment.`}
          </p>
          <p>
            Plan approximately {Math.ceil(course.hours / 4)} weeks at four hours
            per week. Estimates include reading, study, practice, and
            assessment; they are not academic credit hours.
          </p>
          {previous.length > 0 && (
            <p className="school-muted">
              Earlier pathways build the reading, research, and communication
              skills used here. No automatic credit or exemption is granted in
              this preview.
            </p>
          )}
        </section>
        <section className="school-card">
          <h2>What you will be able to do</h2>
          <ul>
            {course.outcomes.map((outcome) => (
              <li key={outcome}>{outcome}</li>
            ))}
          </ul>
        </section>
        <h2>Planned learning units</h2>
        <div className="school-grid">
          {course.units.map((unit) => (
            <article className="school-card" key={unit.title}>
              <span className="school-badge">Lesson development pending</span>
              <h3>{unit.title}</h3>
              <p>{unit.question}</p>
              <p className="school-muted">
                Each unit will include original instruction, selected readings
                or cleared media, guided practice, and a knowledge check.
              </p>
            </article>
          ))}
        </div>
        <div className="school-grid">
          <section className="school-card">
            <h2>Historical inquiry</h2>
            <p>{course.history}</p>
          </section>
          <section className="school-card">
            <h2>Psychology and human experience</h2>
            <p>{course.psychology}</p>
          </section>
        </div>
        <section className="school-card">
          <h2>Scripture study</h2>
          <p>{course.scripture}</p>
          <p>
            Read complete passages in context. Identify the translation used and
            distinguish textual observation, historical evidence, theological
            interpretation, and personal application.
          </p>
          <h2>Applied assignment</h2>
          <p>{course.assignment}</p>
          <p className="school-muted">
            Use fictional or appropriately anonymized examples. Do not submit
            another person’s confidential pastoral or medical information.
          </p>
        </section>
        <section className="school-card">
          <h2>Proposed assessment standards</h2>
          <p>{assessmentPolicy.knowledge}</p>
          <p>{assessmentPolicy.assignments}</p>
          <p>{assessmentPolicy.review}</p>
          <div className="school-rubric">
            {assessmentPolicy.rubric.map((item) => (
              <div key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.standard}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="school-notice">
          <h2>Resource and release review</h2>
          <p>
            Required books, articles, and videos will be selected and checked
            for accuracy, perspective, accessibility, and commercial reuse
            rights before release. No unverified video series or copied textbook
            is required by this syllabus. This preview does not accept
            assignments or issue certificates.
          </p>
        </section>
        <footer className="school-footer">
          Cornett School of Christianity · Adult certificate education · No
          academic degrees
        </footer>
      </main>
    </div>
  );
}
