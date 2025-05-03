import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import React from "react";

export default function CookiePolicyPage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>
        <p className="text-slate-700 mb-4">This is the Cookie Policy page. Please add your cookie policy details here.</p>
      </main>
      <Footer />
    </>
  );
} 