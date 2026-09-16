import "./globals.css";

export const metadata = {
  title: "Perfy Pinboard",
  description: "Your digital pinboard",
};

export const viewport = {
  themeColor: "#78350f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
