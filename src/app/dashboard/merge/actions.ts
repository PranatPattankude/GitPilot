
"use server"

import { commitAndMerge } from "../repositories/actions"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const FormSchema = z.object({
  repoFullName: z.string(),
  sourceBranch: z.string(),
  pullRequestNumber: z.coerce.number(),
  filePath: z.string().min(1, "File path is required."),
  resolvedContent: z.string().min(1, "Resolved content cannot be empty."),
})

type State = {
  success: boolean
  message: string | null
}

export async function resolveConflictAndMerge(prevState: State, formData: FormData): Promise<State> {
  const parsed = FormSchema.safeParse({
    repoFullName: formData.get("repoFullName"),
    sourceBranch: formData.get("sourceBranch"),
    pullRequestNumber: formData.get("pullRequestNumber"),
    filePath: formData.get("filePath"),
    resolvedContent: formData.get("resolvedContent"),
  })

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.errors.map((e) => e.message).join(", "),
    }
  }

  try {
    const result = await commitAndMerge(parsed.data);

    if (!result.success) {
      return { success: false, message: result.error || "An unknown error occurred." };
    }
    
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred."
    return { success: false, message: error }
  }

  // Revalidate the merge page to clear the resolved conflict
  revalidatePath("/dashboard/merge");
  
  // Redirect to the merge page with a success message (as a query param, for example)
  // Or, we could just show the success message on the same page. For now, let's redirect.
  redirect("/dashboard/merge?status=success");
}
