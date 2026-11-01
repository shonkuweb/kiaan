import { AdminPanel } from './panel';
export const metadata = { title: 'Inventory | Kiaan Admin', robots: { index: false, follow: false } };
export default function Page() { return <AdminPanel tab="inventory" />; }
