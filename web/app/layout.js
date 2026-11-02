import './globals.css';

export const metadata = { title: 'IT-Tiket', description: 'IT support ticket system' };

// Runs before paint so a saved dark theme does not flash light.
const themeScript = `document.documentElement.dataset.theme=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
