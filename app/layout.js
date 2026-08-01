import './globals.css';

export const metadata = {
  title: 'Tabs',
  description: 'shared tabs board'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
