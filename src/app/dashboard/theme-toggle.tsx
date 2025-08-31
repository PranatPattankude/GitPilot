
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [theme, setThemeState] = React.useState<"light" | "dark">("dark")

  React.useEffect(() => {
    // On mount, read the theme from localStorage and the class on <html>
    // This handles the case where the user has a theme set from a previous session
    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    const newTheme = storedTheme || (document.documentElement.classList.contains("dark") ? "dark" : "light");
    setThemeState(newTheme)
  }, [])

  const setTheme = (newTheme: "light" | "dark") => {
    setThemeState(newTheme)
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    localStorage.setItem("theme", newTheme)
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-white/80 hover:text-white hover:bg-white/10 focus-visible:text-white focus-visible:bg-white/10">
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
