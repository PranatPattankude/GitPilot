
"use server"

import { z } from "zod";
import { commitResolvedFile, mergePullRequest } from "../repositories/actions";
import { useAppStore } from "@/lib/store";


const FormSchema = z.object({
  repoFullName: z.string(),
  sourceBranch: z.string(),
  filePath: z.string(),
  resolvedContent: z.string(),
  pullRequestNumber: z.coerce.number(),
  pullRequestUrl: z.string().url(),
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
        pullRequestUrl: formData.get("pullRequestUrl"),
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
        
        // This is a server action, but we can't call hooks directly.
        // We will notify on the client side after the form state updates.
        return { success: true, message: "File conflict has been successfully resolved and committed." };

    } catch (e: any) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        return { success: false, message: errorMessage || "An unknown error occurred during the commit process." };
    }
}
