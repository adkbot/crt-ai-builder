
import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata = { title: "CRT AI Builder v2.0", description: "No-code EA builder with Adaptive AI" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Navbar />
        <div className="main-content">
          {children}
        </div>
      </body>
    </html>
  );
}
