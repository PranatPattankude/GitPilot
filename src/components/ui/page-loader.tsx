
"use client"

import { Loader } from "lucide-react";

export function PageLoader({ show }: { show: boolean }) {
  return (
    <div 
      className={`absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
        <div className="flex items-center gap-2">
            <Loader className="size-6 animate-spin text-primary" />
            <span className="text-lg font-medium text-muted-foreground">Loading...</span>
        </div>
    </div>
  )
}
