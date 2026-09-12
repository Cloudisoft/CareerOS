import type { CourseSeed } from "./course-types";
export type { CourseSeed } from "./course-types";

import { course as resumeWriting } from "./courses/resume-writing-that-gets-interviews";
import { course as interviewPrep } from "./courses/interview-prep-that-actually-works";
import { course as negotiating } from "./courses/negotiating-your-offer";
import { course as jobSearchStrategy } from "./courses/job-search-strategy-in-the-ai-era";
import { course as cloudFundamentals } from "./courses/cloud-computing-fundamentals";
import { course as devopsFundamentals } from "./courses/devops-and-ci-cd-fundamentals";
import { course as cybersecurityFundamentals } from "./courses/cybersecurity-fundamentals-for-it";
import { course as networkingFundamentals } from "./courses/networking-fundamentals";
import { course as sqlFundamentals } from "./courses/sql-and-database-fundamentals";

import { course as javascriptFundamentals } from "./courses/javascript-fundamentals";
import { course as typescriptFundamentals } from "./courses/typescript-fundamentals";

import { course as reactFundamentals } from "./courses/react-fundamentals";
import { course as nextjsFullStack } from "./courses/nextjs-and-full-stack-react";

import { course as dockerInPractice } from "./courses/docker-and-containers-in-practice";
import { course as kubernetesFundamentals } from "./courses/kubernetes-fundamentals";

// NOTE: more native courses (Python, Git, Node.js, GraphQL, Terraform, System
// Design, Machine Learning, Data Analysis, Linux, Agile/Scrum) are in
// progress and will be added to this list as they land — see the Learning
// Hub rebuild task. This file intentionally only lists courses that exist
// as real, complete files today.

export const COURSES: CourseSeed[] = [
  resumeWriting,
  interviewPrep,
  negotiating,
  jobSearchStrategy,
  cloudFundamentals,
  devopsFundamentals,
  cybersecurityFundamentals,
  networkingFundamentals,
  sqlFundamentals,
  javascriptFundamentals,
  typescriptFundamentals,
  reactFundamentals,
  nextjsFullStack,
  dockerInPractice,
  kubernetesFundamentals,
].sort((a, b) => a.order - b.order);
