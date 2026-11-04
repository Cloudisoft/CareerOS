const SOURCE_LABELS: Record<string, string> = {
  careeros: "Career OS",
  adzuna: "Adzuna",
  jsearch: "JSearch",
  greenhouse: "Greenhouse",
  lever: "Lever",
  ashby: "Ashby",
  workable: "Workable",
  smartrecruiters: "SmartRecruiters",
  linkedin: "LinkedIn",
  indeed: "Indeed",
  ziprecruiter: "ZipRecruiter",
  dice: "Dice",
  glassdoor: "Glassdoor",
};

export function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}
