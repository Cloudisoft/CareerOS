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
import { course as pythonFundamentals } from "./courses/python-fundamentals";
import { course as gitAndVersionControl } from "./courses/git-and-version-control";

import { course as reactFundamentals } from "./courses/react-fundamentals";
import { course as nextjsFullStack } from "./courses/nextjs-and-full-stack-react";
import { course as nodejsFundamentals } from "./courses/nodejs-fundamentals";
import { course as graphqlFundamentals } from "./courses/graphql-fundamentals";

import { course as dockerInPractice } from "./courses/docker-and-containers-in-practice";
import { course as kubernetesFundamentals } from "./courses/kubernetes-fundamentals";
import { course as terraformIac } from "./courses/infrastructure-as-code-with-terraform";
import { course as systemDesignFundamentals } from "./courses/system-design-fundamentals";

import { course as machineLearningFundamentals } from "./courses/machine-learning-fundamentals";
import { course as dataAnalysisFundamentals } from "./courses/data-analysis-fundamentals";
import { course as linuxFundamentals } from "./courses/linux-and-command-line-fundamentals";
import { course as agileFundamentals } from "./courses/agile-and-scrum-fundamentals";

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
  pythonFundamentals,
  reactFundamentals,
  nextjsFullStack,
  nodejsFundamentals,
  gitAndVersionControl,
  dockerInPractice,
  kubernetesFundamentals,
  terraformIac,
  machineLearningFundamentals,
  dataAnalysisFundamentals,
  systemDesignFundamentals,
  graphqlFundamentals,
  linuxFundamentals,
  agileFundamentals,
].sort((a, b) => a.order - b.order);
