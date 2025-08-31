
"use server"

import { z } from "zod";
import { commitResolvedFile } from "../repositories/actions";


const FormSchema = z.object({
  repoFullName: z.string(),
  sourceBranch: z.string(),
  filePath: z.string(),
  resolvedContent: z.string(),
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
    });

    if (!parsed.success) {
        return { success: false, message: "Invalid form data." };
    }

    try {
        const result = await commitResolvedFile(
            parsed.data.repoFullName,
            parsed.data.sourceBranch,
            parsed.data.filePath,
            parsed.data.resolvedContent
        );
        
        if (!result.success) {
             return { success: false, message: result.error || "Failed to commit the resolved file." };
        }
        
        // Give GitHub a moment to process the commit
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return { success: true, message: "File conflict has been successfully resolved and committed." };

    } catch (e: any) {
        return { success: false, message: e.message || "An unknown error occurred during the commit process." };
    }
}
