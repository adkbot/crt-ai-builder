"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link href="/" className="brand-link">
                    <span className="brand-icon">🤖</span>
                    <span className="brand-text">CRT AI Builder</span>
                </Link>
            </div>

            <div className="navbar-menu">
                <Link
                    href="/"
                    className={`nav-link ${pathname === "/" ? "active" : ""}`}
                >
                    🏠 Início
                </Link>

                <Link
                    href="/editor"
                    className={`nav-link ${pathname === "/editor" ? "active" : ""}`}
                >
                    ✏️ Editor
                </Link>

                <Link
                    href="/chat"
                    className={`nav-link ${pathname === "/chat" ? "active" : ""}`}
                >
                    💬 Chat IA
                </Link>
            </div>
        </nav>
    );
}
