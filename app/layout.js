import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "sonner";

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const orig = console.error;
  console.error = (...args) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) return;
    orig.apply(console, args);
  };
}

export const metadata = {
  title: "VyaparStock — Best Business Billing, Invoicing & GST Software",
  description: "VyaparStock is the best secure, fast billing, invoicing, inventory management, and GST compliance reporting platform. Designed for Indian retail, wholesale, and agro-businesses to track sales, purchases, and outstanding dues.",
  keywords: [
    "billing software",
    "invoicing software",
    "best billing site",
    "GST billing software",
    "VyaparStock",
    "business invoicing platform",
    "ledger books",
    "Indian business accounting",
    "purchase ledger",
    "GSTR-1 report utility",
    "GSTR-3B summary tool",
    "HSN summary calculator",
    "outstanding payment tracker",
    "agro business billing app",
    "wholesale distribution invoice generator"
  ],
  authors: [{ name: "ADVIKS Software Solutions" }],
  creator: "ADVIKS Software Solutions",
  publisher: "ADVIKS Software Solutions",
  metadataBase: new URL("https://vyaparstock.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "VyaparStock — Best Business Billing, Invoicing & GST Software",
    description: "Simplify your business bookkeeping with customizable invoices, inventory tracking, GST registers, and outstanding dues management.",
    url: "https://vyaparstock.com",
    siteName: "VyaparStock",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VyaparStock — Best Business Billing, Invoicing & GST Software",
    description: "Track inventory, print custom bills, calculate GST liabilities, and manage ledger books under one platform.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const inter = { className: "font-sans antialiased" };

export default function RootLayout({ children }) {

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
