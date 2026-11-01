import type { Metadata } from 'next';
import { CheckoutClient } from './checkout-client';

export const metadata: Metadata = {
  title: 'Checkout | Kiaan Agro Care & Nursery',
  description: 'Complete your purchase of healthy Adenium plants and Agrocare essentials with simple, secure checkout.',
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
