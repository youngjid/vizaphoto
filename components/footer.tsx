import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-white border-t mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
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
            <p className="text-sm text-slate-600 mt-4">
              Create perfect passport and ID photos that meet official requirements for any country.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-slate-600 hover:text-blue-600">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-slate-600 hover:text-blue-600">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-slate-600 hover:text-blue-600">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-600 hover:text-blue-600">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Popular Countries</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-slate-600 hover:text-blue-600">
                  🇺🇸 United States
                </Link>
              </li>
              <li>
                <Link href="/" className="text-slate-600 hover:text-blue-600">
                  🇬🇧 United Kingdom
                </Link>
              </li>
              <li>
                <Link href="/" className="text-slate-600 hover:text-blue-600">
                  🇨🇦 Canada
                </Link>
              </li>
              <li>
                <Link href="/" className="text-slate-600 hover:text-blue-600">
                  🇦🇺 Australia
                </Link>
              </li>
              <li>
                <Link href="/" className="text-slate-600 hover:text-blue-600">
                  🇩🇪 Germany
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-slate-600 hover:text-blue-600">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-600 hover:text-blue-600">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-slate-600 hover:text-blue-600">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Vizaphoto.com. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
