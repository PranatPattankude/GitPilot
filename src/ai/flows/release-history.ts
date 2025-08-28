'use server';

/**
 * @fileOverview A Genkit flow for managing release history in Google Sheets.
 *
 * - getReleaseHistory - Fetches the release history from Google Sheets.
 * - addReleaseToHistory - Adds a new release entry to Google Sheets.
 * - Release - The type for a single release entry.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { google } from 'googleapis';

// Note: Ensure your environment is authenticated.
// For local development, use `gcloud auth application-default login`.
// For production, use Application Default Credentials.

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '';
const RANGE = 'Sheet1!A:F'; // Adjust if your sheet has a different name or structure

const ReleaseSchema = z.object({
  id: z.string(),
  type: z.enum(['single', 'bulk']),
  repos: z.array(z.string()),
  branch: z.string(),
  user: z.string(),
  timestamp: z.string().transform((str) => new Date(str)),
  status: z.string(),
});

export type Release = z.infer<typeof ReleaseSchema>;

const AddReleaseHistoryInputSchema = z.object({
    type: z.enum(['single', 'bulk']),
    repos: z.array(z.string()),
    branch: z.string(),
    user: z.string(),
    status: z.string(),
});

export type AddReleaseHistoryInput = z.infer<typeof AddReleaseHistoryInputSchema>;


const GetReleaseHistoryOutputSchema = z.array(ReleaseSchema);

async function getSheetsService() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

export const getReleaseHistory = ai.defineFlow(
  {
    name: 'getReleaseHistory',
    outputSchema: GetReleaseHistoryOutputSchema,
  },
  async () => {
    if (!SPREADSHEET_ID) {
      console.log(
        'GOOGLE_SHEET_ID environment variable not set. Returning empty array.'
      );
      return [];
    }
    console.log(`Fetching release history from sheet: ${SPREADSHEET_ID}`);

    try {
      const sheets = await getSheetsService();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
      });

      const rows = response.data.values;
      if (!rows || rows.length <= 1) { // Changed to <= 1 to account for only header
        console.log('No data found in Google Sheet (or only a header row). The sheet might be empty.');
        return [];
      }
      
      console.log(`Found ${rows.length} rows in the sheet (including header).`);

      // Skip header row and map to Release objects
      return rows.slice(1).map((row, index): Release => ({
        id: (index + 1).toString(),
        type: row[0] === 'bulk' ? 'bulk' : 'single',
        repos: row[1] ? row[1].split(', ') : [],
        branch: row[2],
        user: row[3],
        timestamp: new Date(row[4]),
        status: row[5],
      }));
    } catch (error: any) {
      console.error('Error fetching from Google Sheets:', error.message);
      if (error.code === 403) {
        console.error('Permission denied. Please ensure the service account has viewer/editor access to the Google Sheet.');
      }
      if (error.code === 404) {
        console.error(`Sheet not found. Please verify the SPREADSHEET_ID is correct: ${SPREADSHEET_ID}`);
      }
      // In case of error (e.g., sheet not found, permissions issue), return empty
      return [];
    }
  }
);


export const addReleaseToHistory = ai.defineFlow(
    {
        name: 'addReleaseToHistory',
        inputSchema: AddReleaseHistoryInputSchema,
        outputSchema: z.void(),
    },
    async (input) => {
        if (!SPREADSHEET_ID) {
            console.error('GOOGLE_SHEET_ID environment variable not set. Cannot add release to history.');
            return;
        }

        try {
            const sheets = await getSheetsService();
            const values = [
                [
                    input.type,
                    input.repos.join(', '),
                    input.branch,
                    input.user,
                    new Date().toISOString(),
                    input.status,
                ],
            ];

            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: RANGE,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values,
                },
            });
            console.log(`Successfully added release for ${input.repos.join(', ')} to the sheet.`);
        } catch (error: any) {
            console.error('Error writing to Google Sheets:', error.message);
            // We can throw here to let the caller know something went wrong.
            throw new Error('Failed to add release to history.');
        }
    }
);
