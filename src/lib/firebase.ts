import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GithubAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  projectId: 'gitpilot-8qubd',
  appId: '1:881264771425:web:d2abc7497c39f380ef8520',
  storageBucket: 'gitpilot-8qubd.firebasestorage.app',
  apiKey: 'AIzaSyAfCLUkK1Bsz9PcRWrCZO6JjBpKuWIhRJs',
  authDomain: 'gitpilot-8qubd.firebaseapp.com',
  measurementId: '',
  messagingSenderId: '881264771425',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const githubProvider = new GithubAuthProvider();

export { app, auth, githubProvider };
