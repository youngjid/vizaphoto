import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import React from "react";

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
        <p className="text-slate-700 mb-4">This is the Contact Us page. Please add your contact information or form here.</p>
      </main>
      <Footer />
    </>
  );
} 