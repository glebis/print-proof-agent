import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PrintProof — агент-корректор типографии',
  description: 'Корректура за день вместо недели. Менеджер проверяет, агент работает.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
