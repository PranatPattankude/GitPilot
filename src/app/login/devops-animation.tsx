
"use client"

import { Code2, GitCommit, TestTube, Rocket } from "lucide-react"

const stages = [
  { name: "Code", icon: Code2, delay: "0s" },
  { name: "Build", icon: GitCommit, delay: "2s" },
  { name: "Test", icon: TestTube, delay: "4s" },
  { name: "Deploy", icon: Rocket, delay: "6s" },
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
        
        {/* Connection Path */}
        <path
          d="M 50 200 C 150 100, 150 100, 250 200 S 350 300, 450 200 S 550 100, 550 200"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="5 10"
        />

        {/* Animated Pulse on Path */}
        <path
          d="M 50 200 C 150 100, 150 100, 250 200 S 350 300, 450 200 S 550 100, 550 200"
          stroke="url(#pulse-gradient)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="50 550"
          className="pipeline-pulse"
        />

        {/* Stages */}
        <g transform="translate(50 200)">
          <circle r="30" fill="currentColor" className="stage-glow" style={{ animationDelay: stages[0].delay }} />
          <stages[0].icon className="text-primary-foreground/80" x="-16" y="-16" width="32" height="32" />
        </g>
        <g transform="translate(250 200)">
          <circle r="30" fill="currentColor" className="stage-glow" style={{ animationDelay: stages[1].delay }} />
          <stages[1].icon className="text-primary-foreground/80" x="-16" y="-16" width="32" height="32" />
        </g>
         <g transform="translate(450 200)">
          <circle r="30" fill="currentColor" className="stage-glow" style={{ animationDelay: stages[2].delay }} />
          <stages[2].icon className="text-primary-foreground/80" x="-16" y="-16" width="32" height="32" />
        </g>
        <g transform="translate(550 200)">
          <circle r="30" fill="currentColor" className="stage-glow" style={{ animationDelay: stages[3].delay }} />
          <stages[3].icon className="text-primary-foreground/80" x="-16" y="-16" width="32" height="32" />
        </g>
      </svg>
    </div>
  )
}
