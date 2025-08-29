
"use client"

import * as React from "react"
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SessionProvider } from "next-auth/react"

// We can't use the metadata export in a client component,
// so we'll manage the title in the RootLayout component directly.

export default function RootLayout({
  children,
  session,
}: Readonly<{
  children: React.ReactNode;
  session: any; // next-auth session
}>) {

  React.useEffect(() => {
    document.title = "GitPilot - Merge branches, resolve conflicts, and track releases with ease.";
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-body antialiased">
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
