
"use server"

import { z } from "zod";
import { commitResolvedFile, mergePullRequest } from "../repositories/actions";


const FormSchema = z.object({
  repoFullName: z.string(),
  sourceBranch: z.string(),
  filePath: z.string(),
  resolvedContent: z.string(),
  pullRequestNumber: z.coerce.number(),
});

type State = {
    success: boolean,
    message: string,
}


export async function resolveConflictFile(prevState: State, formData: FormData): Promise<State> {
    const parsed = FormSchema.safeParse({
        repoFullName: formData.get("repoFullName"),
        sourceBranch: formData.get("sourceBranch"),
        filePath: formData.get("filePath"),
        resolvedContent: formData.get("resolvedContent"),
        pullRequestNumber: formData.get("pullRequestNumber"),
    });

    if (!parsed.success) {
        return { success: false, message: "Invalid form data." };
    }

    try {
        const commitResult = await commitResolvedFile(
            parsed.data.repoFullName,
            parsed.data.sourceBranch,
            parsed.data.filePath,
            parsed.data.resolvedContent
        );
        
        if (!commitResult.success) {
             return { success: false, message: commitResult.error || "Failed to commit the resolved file." };
        }
        
        // The merge happens on the next button click now.
        // We just return success for the commit part.
        return { success: true, message: "File conflict has been successfully resolved and committed." };

    } catch (e: any) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        return { success: false, message: errorMessage || "An unknown error occurred during the commit process." };
    }
}
