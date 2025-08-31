
"use server"

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirect } from "next/navigation";
import { commitAndMerge } from "../repositories/actions";


const FormSchema = z.object({
  repoFullName: z.string(),
  pullRequestNumber: z.coerce.number(),
  sourceBranch: z.string(),
  filePath: z.string(),
  resolvedContent: z.string(),
});

type State = {
    success: boolean,
    message: string,
}


export async function resolveConflict(prevState: State, formData: FormData): Promise<State> {
    const parsed = FormSchema.safeParse({
        repoFullName: formData.get("repoFullName"),
        pullRequestNumber: formData.get("pullRequestNumber"),
        sourceBranch: formData.get("sourceBranch"),
        filePath: formData.get("filePath"),
        resolvedContent: formData.get("resolvedContent"),
    });

    if (!parsed.success) {
        return { success: false, message: "Invalid form data." };
    }

    try {
        const result = await commitAndMerge({
            repoFullName: parsed.data.repoFullName,
            sourceBranch: parsed.data.sourceBranch,
            pullRequestNumber: parsed.data.pullRequestNumber,
            filePath: parsed.data.filePath,
            resolvedContent: parsed.data.resolvedContent,
        });
        
        if (!result.success) {
             return { success: false, message: result.error || "Failed to commit and merge." };
        }

    } catch (e: any) {
        return { success: false, message: e.message || "An unknown error occurred during the commit/merge process." };
    }
    
    revalidatePath("/dashboard/merge");
    redirect("/dashboard/merge?status=resolved");
    
    // This line is technically unreachable because of the redirect, but it satisfies the function signature.
    return { success: true, message: "Conflict resolved and merged successfully." };
}
