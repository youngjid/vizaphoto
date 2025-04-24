import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AppProvider } from "@/context/app-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Vizaphoto.com - Passport & ID Photo Maker",
  description: "Create perfect passport and ID photos that meet official requirements for any country",
  icons: {
    icon: [
      { url: '/assets/brand/favicon.ico', sizes: 'any' }
    ]
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AppProvider>{children}</AppProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'