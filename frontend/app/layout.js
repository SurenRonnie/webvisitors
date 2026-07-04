import './globals.css';

export const metadata = {
  title: 'VisitorIQ',
  description: 'See which companies are visiting your website before they fill out a form.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
