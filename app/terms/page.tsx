import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import React from "react";

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="text-slate-700 mb-4">This is the Terms of Service page. Please add your terms and conditions here.</p>
      </main>
      <Footer />
    </>
  );
} 