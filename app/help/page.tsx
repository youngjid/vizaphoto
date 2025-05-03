import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import React from "react";

export default function HelpPage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6">Help Center</h1>
        <p className="text-slate-700 mb-4">This is the Help Center page. Please add your help and FAQ content here.</p>
      </main>
      <Footer />
    </>
  );
} 