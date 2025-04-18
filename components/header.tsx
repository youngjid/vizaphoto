import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function Header() {
  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        <Link href="/" className="flex items-center -my-6">
          <Image
            src="/assets/brand/logo-no-bg.png"
            alt="Vizaphoto.com"
            width={480}
            height={144}
            className="h-32 w-auto max-w-none"
            priority
          />
        </Link>
        <nav className="flex items-center gap-8">
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-base font-medium text-slate-600 hover:text-blue-600">
              Home
            </Link>
            <Link href="/pricing" className="text-base font-medium text-slate-600 hover:text-blue-600">
              Pricing
            </Link>
            <Link href="/help" className="text-base font-medium text-slate-600 hover:text-blue-600">
              Help
            </Link>
            <Link href="/contact" className="text-base font-medium text-slate-600 hover:text-blue-600">
              Contact
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="default" className="hidden md:inline-flex">
              Sign In
            </Button>
            <Button size="default">Get Started</Button>
          </div>
        </nav>
      </div>
    </header>
  )
}
