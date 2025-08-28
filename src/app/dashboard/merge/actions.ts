"use server"

import {
  intelligentConflictResolution,
  type IntelligentConflictResolutionInput,
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
    // In a real scenario, the AI model would provide a truly intelligent suggestion.
    // We are mocking a successful response here to demonstrate the flow.
    const mockEnhancedSuggestion = `// AI has analyzed your suggestion and applied it to similar patterns.
    
import { PrimaryButton as MainButton } from './components/Buttons';
import { SecondaryButton as MainButton } from './components/Buttons';

const App = () => (
  <div>
    <MainButton />
    <MainButton />
  </div>
);`

    // const result = await intelligentConflictResolution(parsed.data);
    const result = { enhancedSuggestion: mockEnhancedSuggestion }

    return { success: true, data: result, error: null }
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred."
    return { success: false, data: null, error }
  }
}
