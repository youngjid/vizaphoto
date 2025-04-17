"use client"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"

// Initialize Stripe (in a real app, you would use your own publishable key)
const stripePromise = loadStripe("pk_test_your_key_here")

export function Stripe({ children, options, className }) {
  return (
    <Elements stripe={stripePromise} options={options}>
      <StripeForm className={className}>{children}</StripeForm>
    </Elements>
  )
}

function StripeForm({ children, className }) {
  const stripe = useStripe()
  const elements = useElements()

  return (
    <form className={className}>
      {children}
      <PaymentElement className="mt-4" />
    </form>
  )
}
