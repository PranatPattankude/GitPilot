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
  fileDiff: z.string().describe('The diff of the file with conflicts.'),
  selectedSuggestion: z.string().describe('The user-selected suggestion for resolving a conflict.'),
  unseenLines: z.array(z.string()).describe('Array of unseen lines in the file.'),
});
export type IntelligentConflictResolutionInput = z.infer<typeof IntelligentConflictResolutionInputSchema>;

const IntelligentConflictResolutionOutputSchema = z.object({
  enhancedSuggestion: z.string().describe('The enhanced suggestion with additional matching lines applied.'),
});
export type IntelligentConflictResolutionOutput = z.infer<typeof IntelligentConflictResolutionOutputSchema>;


const ApplySuggestionInputSchema = z.object({
    suggestion: z.string().describe("The user's proposed resolution for a specific conflict."),
    unseenLines: z.array(z.string()).describe("A list of lines from the same file that were not part of the original conflict."),
});

const ApplySuggestionOutputSchema = z.object({
    reasoning: z.string().describe("An explanation of which lines were changed and why, or why no lines were changed."),
    modifiedUnseenLines: z.array(z.string()).describe("The list of unseen lines after applying the suggestion's logic to them."),
});


const applySuggestionToUnseenLines = ai.defineTool(
  {
    name: 'applySuggestionToUnseenLines',
    description: 'Given a user\'s suggested fix for a code conflict, analyze other lines of code from the same file and apply the same fix to any lines that have a similar pattern.',
    inputSchema: ApplySuggestionInputSchema,
    outputSchema: ApplySuggestionOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
      prompt: `A user has resolved a merge conflict. Their resolution is provided below. Your task is to act as an intelligent coding assistant and apply the same *pattern* of change to a list of "unseen lines" from the same file.

      ## User's Conflict Resolution (Suggestion):
      \`\`\`
      ${input.suggestion}
      \`\`\`

      ## Analysis of the User's Intent
      First, understand the change the user made. For example, they might have renamed a component, changed a function signature, or updated a variable.

      ## Unseen Lines to Analyze
      Here are other lines from the same file. Review them to see if any of them should be changed to match the user's resolution pattern.
      \`\`\`
      ${input.unseenLines.join('\n')}
      \`\`\`

      ## Your Task
      1.  **Identify Matching Patterns:** Determine which of the "Unseen Lines" are structurally or semantically similar to the code that the user changed in their suggestion.
      2.  **Apply the Same Change:** Modify the identified lines to follow the user's resolution pattern.
      3.  **Preserve Other Lines:** Any lines that do not match the pattern should be left completely unchanged.
      4.  **Format Output:** Return a JSON object with your reasoning and the final, modified list of unseen lines. The 'modifiedUnseenLines' array should contain *all* original unseen lines, with the relevant ones changed and the irrelevant ones preserved in their original state and order.

      **Example:**
      - **Suggestion:** Renames \`<PrimaryButton />\` to \`<MainButton />\`.
      - **Unseen Lines:** Contains a line with \`<SecondaryButton />\`.
      - **Your Reasoning:** The user is renaming button components. While "SecondaryButton" is not the same as "PrimaryButton", it follows a similar pattern that might need to be updated in a real-world refactor. However, based *only* on the provided suggestion, there is no direct evidence to change \`SecondaryButton\`. Therefore, no changes should be made.
      - **Your Output:** You would return the unseen lines unchanged.

      **Example 2:**
      - **Suggestion:** Changes \`import { PrimaryButton } from './components/Buttons';\` to \`import { MainButton } from './components/Buttons';\`.
      - **Unseen Lines:** Contains a line \`import { SecondaryButton } from './components/Buttons';\`.
      - **Your Reasoning:** The user is renaming an import from a specific file. The other import is from the same file and has a similar structure, but there is no direct instruction to rename "SecondaryButton", so it should be left alone.
      - **Your Output:** You would return the unseen lines unchanged.
      `,
      output: {
        schema: ApplySuggestionOutputSchema,
      },
      model: ai.getModel(),
    });

    return llmResponse.output()!;
  }
);


export async function intelligentConflictResolution(
  input: IntelligentConflictResolutionInput
): Promise<IntelligentConflictResolutionOutput> {
  const { selectedSuggestion, unseenLines } = input;

  if (unseenLines.length === 0) {
    return { enhancedSuggestion: selectedSuggestion };
  }

  // Use the tool to apply the suggestion to the unseen lines
  const toolResult = await applySuggestionToUnseenLines({
    suggestion: selectedSuggestion,
    unseenLines: unseenLines,
  });

  // For this flow, we will combine the original suggestion with the newly modified lines.
  // In a real application, you might want to create a more sophisticated diff or patch.
  const enhancedSuggestion = [
    "// AI-Enhanced Suggestion",
    "// -----------------------",
    "// Original user resolution:",
    selectedSuggestion,
    "\n// Changes applied to other lines in the file:",
    ...toolResult.modifiedUnseenLines,
    "\n// AI Reasoning:",
    `// ${toolResult.reasoning.split('\n').join('\n// ')}`
  ].join('\n');

  return { enhancedSuggestion };
}

// We are replacing the flow and prompt with a direct implementation.
// This is because the logic is now encapsulated within the `applySuggestionToUnseenLines` tool and the exported `intelligentConflictResolution` function.
const intelligentConflictResolutionFlow = ai.defineFlow(
  {
    name: 'intelligentConflictResolutionFlow',
    inputSchema: IntelligentConflictResolutionInputSchema,
    outputSchema: IntelligentConflictResolutionOutputSchema,
  },
  intelligentConflictResolution
);
