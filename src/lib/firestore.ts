
import * as admin from 'firebase-admin';

// Initialize the Firebase Admin SDK
// This ensures that we only initialize the app once, which is a best practice.
if (!admin.apps.length) {
  try {
    const privateKey = (process.env.FIRESTORE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    
    if (!process.env.FIRESTORE_PROJECT_ID) {
      throw new Error('FIRESTORE_PROJECT_ID is not set in the environment variables.');
    }
    if (!process.env.FIRESTORE_CLIENT_EMAIL) {
      throw new Error('FIRESTORE_CLIENT_EMAIL is not set in the environment variables.');
    }
     if (!privateKey) {
      throw new Error('FIRESTORE_PRIVATE_KEY is not set in the environment variables.');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIRESTORE_PROJECT_ID,
        clientEmail: process.env.FIRESTORE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.message);
    // We can decide how to handle this error. For now, we'll log it.
    // In a production app, you might want to have more robust error handling.
  }
}

const db = admin.firestore();
const tagsCollection = db.collection('repositoryTags');

/**
 * Updates the tags for a specific repository.
 * @param repoId The ID of the repository (as a string).
 * @param tags An array of strings representing the tags.
 */
export async function updateTagsForRepo(repoId: string, tags: string[]): Promise<void> {
  if (!admin.apps.length) {
    console.error("Firebase Admin not initialized. Skipping Firestore operation.");
    return;
  }
  try {
    // The document ID will be the repository ID.
    const docRef = tagsCollection.doc(repoId);
    await docRef.set({ tags: tags }, { merge: true });
    console.log(`Successfully updated tags for repo ${repoId}`);
  } catch (error) {
    console.error(`Error updating tags for repo ${repoId}:`, error);
    throw new Error('Failed to update tags in Firestore.');
  }
}

/**
 * Fetches the tags for a specific repository.
 * @param repoId The ID of the repository (as a string).
 * @returns A promise that resolves to an array of tag strings.
 */
export async function getTagsForRepo(repoId: string): Promise<string[]> {
  if (!admin.apps.length) {
    console.error("Firebase Admin not initialized. Skipping Firestore operation.");
    return [];
  }
  try {
    const docRef = tagsCollection.doc(repoId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return []; // No tags found for this repo
    }

    // The document data should contain a 'tags' field which is an array.
    return doc.data()?.tags || [];
  } catch (error) {
    console.error(`Error fetching tags for repo ${repoId}:`, error);
    // Return empty array on error to avoid breaking the entire repo list
    return [];
  }
}
