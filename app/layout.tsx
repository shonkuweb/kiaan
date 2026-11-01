import type { Metadata } from 'next';
import './globals.css';
import { Storefront } from './components/storefront';
export const metadata: Metadata = {
  title: 'Kiaan | Agro Care & Nursery',
  description: 'Beautiful Adenium plants for your garden. Explore rare varieties, healthy plants, and complete plant care support from Kiaan Nursery.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Storefront>{children}</Storefront></body></html>;
}
