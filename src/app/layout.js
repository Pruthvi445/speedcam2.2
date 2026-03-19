import './globals.css';
import { Providers } from '@/store';

export const metadata = {
  title: ' SpeedCam ',
  description: 'Advanced speed camera navigation system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}