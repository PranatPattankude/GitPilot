'use server';

/**
 * @fileOverview A Genkit flow for managing release history in Google Sheets.
 *
 * - getReleaseHistory - Fetches the release history from Google Sheets.
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

    try {
      const sheets = await getSheetsService();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return [];
      }

      // Skip header row and map to Release objects
      return rows.slice(1).map((row, index): Release => ({
        id: (index + 1).toString(),
        type: row[0] === 'bulk' ? 'bulk' : 'single',
        repos: row[1].split(', '),
        branch: row[2],
        user: row[3],
        timestamp: new Date(row[4]),
        status: row[5],
      }));
    } catch (error) {
      console.error('Error fetching from Google Sheets:', error);
      // In case of error (e.g., sheet not found, permissions issue), return empty
      return [];
    }
  }
);
