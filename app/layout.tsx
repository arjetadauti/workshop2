import "./globals.css";
import type { ReactNode } from "react";

export const metadata = { title: "Shpenzimet e nderteses" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sq">
      <body>
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
