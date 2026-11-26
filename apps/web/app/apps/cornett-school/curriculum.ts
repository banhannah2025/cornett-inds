import courses from "./curriculum.json";

export const curriculum = courses;
export const assessmentPolicy = {
  status: "Proposed standards — founder approval required before enrollment",
  knowledge:
    "Score at least 80% on each course knowledge assessment. Review and reassessment will be available; practice alone does not count as a graded attempt.",
  assignments:
    "Submit every required assignment. Each rubric dimension must meet the competent standard; strengths in one area cannot compensate for an unresolved safeguarding or integrity concern.",
  review:
    "The founder reviews substantial work and approves final pathway completion. AI feedback is identified and can be challenged through a human review request.",
  rubric: [
    {
      title: "Textual and historical accuracy",
      standard:
        "Interpret passages in context, identify sources, and distinguish evidence from inference.",
    },
    {
      title: "Reasoning and perspective",
      standard:
        "Support conclusions, represent other traditions fairly, and acknowledge uncertainty.",
    },
    {
      title: "Practical skill and care",
      standard:
        "Demonstrate the assigned skill, respect consent and boundaries, and recognize when referral is needed.",
    },
    {
      title: "Communication and integrity",
      standard:
        "Communicate accessibly, attribute sources and AI assistance, and protect other people’s private information.",
    },
  ],
};
export const pathwayProjects = [
  "A contextual passage study, an explanation of the gospel, and a realistic discipleship and study plan.",
  "A historical interpretation portfolio with an annotated timeline, a source comparison, and an accessible teaching plan.",
  "A researched theological essay, a psychology research critique, and a comparison of Christian traditions using primary sources.",
  "A ministry portfolio integrating teaching, pastoral care boundaries, safeguarding, governance, budgeting, and a continuing-learning plan.",
];
