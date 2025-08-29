"use server"

import {
  intelligentConflictResolution,
} from "@/ai/flows/intelligent-conflict-resolution"
import { z } from "zod"

const FormSchema = z.object({
  fileDiff: z.string().min(1, "File diff is required."),
  selectedSuggestion: z
    .string()
    .min(1, "Your suggested resolution is required."),
  unseenLines: z.string().transform((str) => str.split("\n").filter(Boolean)),
})

type State = {
  success: boolean
  data: { enhancedSuggestion: string } | null
  error: string | null
}

export async function resolveConflict(prevState: State, formData: FormData): Promise<State> {
  const parsed = FormSchema.safeParse({
    fileDiff: formData.get("fileDiff"),
    selectedSuggestion: formData.get("selectedSuggestion"),
    unseenLines: formData.get("unseenLines"),
  })

  if (!parsed.success) {
    return {
      success: false,
      data: null,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    }
  }

  try {
    const result = await intelligentConflictResolution(parsed.data);

    return { success: true, data: result, error: null }
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred."
    return { success: false, data: null, error }
  }
}
