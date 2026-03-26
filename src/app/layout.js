import './globals.css';
import { Providers } from '@/store'; // Redux Providers

export const metadata = {
  title: "Navzy | Advanced Tactical Map",
  description: "Advanced safety and driving insights with Navzy AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}