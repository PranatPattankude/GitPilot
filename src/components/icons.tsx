import type { SVGProps } from "react";

export function GitPilotLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M22 12h-4" />
      <path d="M6 12H2" />
      <path d="m19.07 4.93-3.12 3.12" />
      <path d="m8.05 15.95-3.12 3.12" />
      <path d="m19.07 19.07-3.12-3.12" />
      <path d="m8.05 8.05-3.12-3.12" />
      <circle cx="12" cy="12" r="2" />
      <path d="M15.2 15.2 18 18" />
      <path d="m12 8-2.5 2.5" />
      <path d="m8 12 2.5 2.5" />
    </svg>
  );
}
