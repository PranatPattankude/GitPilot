'use server';

/**
 * @fileOverview A Genkit flow for intelligent conflict resolution during branch merging.
 *
 * - intelligentConflictResolution - A function that enhances conflict resolution by identifying and applying similar, unseen lines.
 * - IntelligentConflictResolutionInput - The input type for the intelligentConflictResolution function.
 * - IntelligentConflictResolutionOutput - The return type for the intelligentConflictResolution function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentConflictResolutionInputSchema = z.object({
  fileDiff: z.string().describe('The diff of the file with conflicts, including the conflict markers (<<<<<<<, =======, >>>>>>>).'),
});
export type IntelligentConflictResolutionInput = z.infer<typeof IntelligentConflictResolutionInputSchema>;

const IntelligentConflictResolutionOutputSchema = z.object({
  suggestedResolution: z.string().describe('The AI-suggested resolution for the conflict.'),
});
export type IntelligentConflictResolutionOutput = z.infer<typeof IntelligentConflictResolutionOutputSchema>;


export async function intelligentConflictResolution(
  input: IntelligentConflictResolutionInput
): Promise<IntelligentConflictResolutionOutput> {
  return await intelligentConflictResolutionFlow(input);
}

const intelligentConflictResolutionFlow = ai.defineFlow(
  {
    name: 'intelligentConflictResolutionFlow',
    inputSchema: IntelligentConflictResolutionInputSchema,
    outputSchema: IntelligentConflictResolutionOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
        prompt: `You are an expert software engineer specializing in resolving git merge conflicts.
        You will be given a file diff that may contain one or more conflict sections marked with (<<<<<<<, =======, >>>>>>>).
        Your task is to analyze all conflicts and produce a single, clean, resolved version of the file content.

        Analyze the code between the markers for each conflict:
        - The code between '<<<<<<<' and '=======' is the target branch's version.
        - The code between '=======' and '>>>>>>>' is the source branch's version.

        Your goal is to intelligently merge the changes. You might need to:
        - Combine both changes if they are not mutually exclusive.
        - Choose one side over the other if they are conflicting.
        - Refactor the code slightly to accommodate both changes if possible.

        You must output ONLY the resolved code, without any conflict markers or extra explanations. 
        Your response must be a JSON object that strictly adheres to the following schema:
        { "suggestedResolution": "<final resolved file content>" }

        Here is the file diff with the conflict(s):
        \`\`\`
        ${input.fileDiff}
        \`\`\`
        `,
        output: {
            schema: IntelligentConflictResolutionOutputSchema,
        },
    });

    const result = llmResponse.output();
    if (!result) {
      throw new Error("AI did not return a valid suggestedResolution");
    }
    return result;
  }
);
