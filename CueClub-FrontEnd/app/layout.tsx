import type { Metadata } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import '../styles/globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: '--font-space',
});
const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Cue-Club | Master the Art of Precision',
  description: 'The world\'s most exclusive destination for premium billiards, pool, carrom, and darts. Join the elite community of precision gaming.',
  icons: {
    icon: '/images/logo-cueclub.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased selection:bg-primary/30 selection:text-white`}>
        {children}
      </body>
    </html>
  )
}
