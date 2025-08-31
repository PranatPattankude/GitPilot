
"use client"

import { Code2, GitCommit, TestTube, Rocket } from "lucide-react"

const stages = [
  { name: "Code", icon: Code2, delay: "0s", pos: [50, 200] },
  { name: "Build", icon: GitCommit, delay: "2s", pos: [250, 200] },
  { name: "Test", icon: TestTube, delay: "4s", pos: [450, 200] },
  { name: "Deploy", icon: Rocket, delay: "6s", pos: [550, 200] },
]

export function DevOpsCycleAnimation() {
  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center">
      <svg
        width="80%"
        height="80%"
        viewBox="0 0 600 400"
        className="text-primary/10 dark:text-primary/5"
      >
        <defs>
          <linearGradient id="pulse-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d="M 50 200 C 150 100, 150 100, 250 200 S 350 300, 450 200 S 550 100, 550 200"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="5 10"
        />

        <path
          d="M 50 200 C 150 100, 150 100, 250 200 S 350 300, 450 200 S 550 100, 550 200"
          stroke="url(#pulse-gradient)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="50 550"
          className="pipeline-pulse"
        />

        {stages.map(({ name, icon: Icon, delay, pos }) => (
          <g key={name} transform={`translate(${pos[0]} ${pos[1]})`}>
            <circle
              r="30"
              fill="currentColor"
              className="stage-glow"
              style={{ animationDelay: delay }}
            />
            <foreignObject x="-16" y="-16" width="32" height="32">
              <div className="flex items-center justify-center w-full h-full">
                <Icon className="text-primary-foreground/80" />
              </div>
            </foreignObject>
          </g>
        ))}
      </svg>
    </div>
  )
}
