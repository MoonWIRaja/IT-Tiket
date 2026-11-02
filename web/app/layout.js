import './globals.css';

const base = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const metadata = { appleWebApp: { capable: true, title: 'IT-Tiket', statusBarStyle: 'black-translucent' }, icons: { apple: `${base}/icon-192.png` }, title: 'IT-Tiket', description: 'IT support ticket system', manifest: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/manifest.webmanifest`, themeColor: '#2563eb' };

// Runs before paint so a saved dark theme does not flash light.
const themeScript = `document.documentElement.dataset.theme=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');addEventListener('beforeinstallprompt',e=>{e.preventDefault();window.__installPrompt=e});if('serviceWorker'in navigator)navigator.serviceWorker.register('${base}/sw.js')`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
