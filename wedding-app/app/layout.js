export const metadata = {
  title: 'Wedding Memories',
  description: 'Scatta foto e video del matrimonio e caricali in un attimo.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif', background: '#faf7f2', color: '#1f1f1f' }}>
        {children}
      </body>
    </html>
  );
}
