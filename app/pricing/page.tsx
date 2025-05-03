import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import React from "react";

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6">Pricing</h1>
        <p className="text-slate-700 mb-4">This is the Pricing page. Please add your pricing details here.</p>
      </main>
      <Footer />
    </>
  );
} 