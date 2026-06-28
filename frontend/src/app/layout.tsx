import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPORT LOUNGE — Премиум кальянная",
  description: "SPORT LOUNGE — премиум кальянная с авторскими миксами, уютной атмосферой и лучшим сервисом. Закажите кальян онлайн.",
  keywords: "кальянная, hookah, sport lounge, премиум кальян, кальян на заказ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
