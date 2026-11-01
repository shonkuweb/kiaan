import { NextRequest } from 'next/server';
import { getStoreSettings, updateStoreSettings } from '../../../lib/server/db';
import { checkLocalAdmin } from '../../../lib/server/r2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = getStoreSettings();
    // Return settings with password masked for security
    return Response.json(
      {
        ...settings,
        adminPassword: '', // Don't expose raw password in GET
        hasPassword: Boolean(settings.adminPassword),
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const denied = checkLocalAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const current = getStoreSettings();

    const updates: Record<string, any> = {};

    // Password change logic
    if (body.newPassword !== undefined && String(body.newPassword).trim() !== '') {
      const newPwd = String(body.newPassword).trim();
      const currentPwd = String(body.currentPassword || '').trim();

      if (current.adminPassword && current.adminPassword !== currentPwd) {
        return Response.json(
          { error: 'Current password is incorrect. Please re-enter current password.' },
          { status: 400 }
        );
      }

      if (newPwd.length < 4) {
        return Response.json(
          { error: 'New password must be at least 4 characters long.' },
          { status: 400 }
        );
      }

      updates.adminPassword = newPwd;
    }

    if (body.minOrderValue !== undefined) {
      updates.minOrderValue = Math.max(0, Number(body.minOrderValue) || 0);
    }

    if (body.minOrderQuantity !== undefined) {
      updates.minOrderQuantity = Math.max(1, Number(body.minOrderQuantity) || 1);
    }

    if (body.deliveryCharge !== undefined) {
      updates.deliveryCharge = Math.max(0, Number(body.deliveryCharge) || 0);
    }

    if (body.freeDeliveryThreshold !== undefined) {
      updates.freeDeliveryThreshold = Math.max(0, Number(body.freeDeliveryThreshold) || 0);
    }

    if (body.hero !== undefined) updates.hero = Boolean(body.hero);
    if (body.featured !== undefined) updates.featured = Boolean(body.featured);
    if (body.reviews !== undefined) updates.reviews = Boolean(body.reviews);
    if (body.newsletter !== undefined) updates.newsletter = Boolean(body.newsletter);
    if (body.title !== undefined) updates.title = String(body.title).trim();
    if (body.subtitle !== undefined) updates.subtitle = String(body.subtitle).trim();

    const updated = updateStoreSettings(updates);

    return Response.json({
      ...updated,
      adminPassword: '',
      hasPassword: Boolean(updated.adminPassword),
      message: 'Store settings saved successfully.',
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not update settings' },
      { status: 500 }
    );
  }
}
