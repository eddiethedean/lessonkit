export const PACKAGE_TARGETS = [
  "react-vite",
  "scorm12",
  "scorm2004",
  "xapi",
  "cmi5",
  "standalone",
] as const;

export type PackageTarget = (typeof PACKAGE_TARGETS)[number];
