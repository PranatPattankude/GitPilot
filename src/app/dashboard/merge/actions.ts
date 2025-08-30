
"use server"

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { intelligentConflictResolution } from "@/ai/flows/intelligent-conflict-resolution";
import { redirect } from "next/navigation";


const FormSchema = z.object({
  repoFullName: z.string(),
  pullRequestNumber: z.coerce.number(),
  filePath: z.string(),
  fileDiff: z.string(),
  selectedSuggestion: z.string(),
  unseenLines: z.string().optional(),
});

type State = {
    success: boolean,
    message: string,
}


export async function resolveConflict(prevState: State, formData: FormData): Promise<State> {
    const parsed = FormSchema.safeParse({
        repoFullName: formData.get("repoFullName"),
        pullRequestNumber: formData.get("pullRequestNumber"),
        filePath: formData.get("filePath"),
        fileDiff: formData.get("fileDiff"),
        selectedSuggestion: formData.get("selectedSuggestion"),
        unseenLines: formData.get("unseenLines"),
    });

    if (!parsed.success) {
        return { success: false, message: "Invalid form data." };
    }

    try {
        const result = await intelligentConflictResolution({
            fileDiff: parsed.data.fileDiff,
            selectedSuggestion: parsed.data.selectedSuggestion,
            unseenLines: parsed.data.unseenLines?.split('\n') || [],
        });
        
        console.log("AI Enhanced Suggestion:", result.enhancedSuggestion);
        
        // In a real application, you would now commit this `enhancedSuggestion` to the repo.
        // For this demo, we'll just log it and simulate success.

    } catch (e: any) {
        return { success: false, message: e.message || "An unknown error occurred with the AI." };
    }
    
    // For now, we will just return a success message and not actually commit.
    revalidatePath("/dashboard/merge");
    redirect("/dashboard/merge?status=resolved");
    
    // This part would be reached if redirect didn't happen
    return { success: true, message: "Conflict resolution submitted successfully (simulation)." };
}
