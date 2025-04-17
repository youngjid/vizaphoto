import Link from "next/link"
import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Camera className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold text-blue-600">Vizaphoto.com</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-slate-600 hover:text-blue-600">
            Home
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-blue-600">
            Pricing
          </Link>
          <Link href="/help" className="text-sm font-medium text-slate-600 hover:text-blue-600">
            Help
          </Link>
          <Link href="/contact" className="text-sm font-medium text-slate-600 hover:text-blue-600">
            Contact
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden md:inline-flex">
            Sign In
          </Button>
          <Button size="sm">Get Started</Button>
        </div>
      </div>
    </header>
  )
}
