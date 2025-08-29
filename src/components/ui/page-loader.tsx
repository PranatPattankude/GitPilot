
"use client"

import { Loader } from "lucide-react";
import { Skeleton } from "./skeleton";

export function PageLoader() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
            <Loader className="size-6 animate-spin text-primary" />
            <span className="text-lg font-medium text-muted-foreground">Loading...</span>
        </div>
    </div>
  )
}
