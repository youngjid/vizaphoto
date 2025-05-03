"use client"

import Link from "next/link"
import Image from "next/image"
import { useAppContext } from "@/context/app-context"
import { countries } from "@/data/countries"

export function Footer() {
  const { setSelectedCountry } = useAppContext();
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
                <button
                  type="button"
                  className="text-slate-600 hover:text-blue-600 flex items-center gap-2 w-full text-left bg-transparent border-0 p-0"
                  onClick={() => setSelectedCountry(countries.find(c => c.code === "US") || null)}
                >
                  <Image src="/assets/flags/us.svg" alt="US flag" width={20} height={14} className="inline-block" />
                  United States
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-slate-600 hover:text-blue-600 flex items-center gap-2 w-full text-left bg-transparent border-0 p-0"
                  onClick={() => setSelectedCountry(countries.find(c => c.code === "GB") || null)}
                >
                  <Image src="/assets/flags/gb.svg" alt="UK flag" width={20} height={14} className="inline-block" />
                  United Kingdom
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-slate-600 hover:text-blue-600 flex items-center gap-2 w-full text-left bg-transparent border-0 p-0"
                  onClick={() => setSelectedCountry(countries.find(c => c.code === "CA") || null)}
                >
                  <Image src="/assets/flags/ca.svg" alt="Canada flag" width={20} height={14} className="inline-block" />
                  Canada
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-slate-600 hover:text-blue-600 flex items-center gap-2 w-full text-left bg-transparent border-0 p-0"
                  onClick={() => setSelectedCountry(countries.find(c => c.code === "AU") || null)}
                >
                  <Image src="/assets/flags/au.svg" alt="Australia flag" width={20} height={14} className="inline-block" />
                  Australia
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-slate-600 hover:text-blue-600 flex items-center gap-2 w-full text-left bg-transparent border-0 p-0"
                  onClick={() => setSelectedCountry(countries.find(c => c.code === "DE") || null)}
                >
                  <Image src="/assets/flags/de.svg" alt="Germany flag" width={20} height={14} className="inline-block" />
                  Germany
                </button>
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
