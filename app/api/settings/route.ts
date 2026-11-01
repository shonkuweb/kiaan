import { getStoreSettings } from '../../lib/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = getStoreSettings();
    return Response.json(
      {
        minOrderValue: settings.minOrderValue ?? 0,
        minOrderQuantity: settings.minOrderQuantity ?? 1,
        deliveryCharge: settings.deliveryCharge ?? 69,
        freeDeliveryThreshold: settings.freeDeliveryThreshold ?? 999,
        title: settings.title,
        subtitle: settings.subtitle,
        hero: settings.hero,
        featured: settings.featured,
        reviews: settings.reviews,
        newsletter: settings.newsletter,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    return Response.json(
      {
        minOrderValue: 0,
        minOrderQuantity: 1,
        deliveryCharge: 69,
        freeDeliveryThreshold: 999,
        hero: true,
        featured: true,
        reviews: true,
        newsletter: true,
      },
      { status: 200 }
    );
  }
}
