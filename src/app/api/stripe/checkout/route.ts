import { NextResponse } from "next/server";
import { getOrCreateBrowserId } from "@/lib/session";
import { getStripe, vipPriceId } from "@/lib/stripe";

export async function POST() {
  const stripe = getStripe();
  const price = vipPriceId();
  const browserId = await getOrCreateBrowserId();
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://www.secretclubscrapbook.com";

  if (!stripe || !price) {
    // Dev fallback: grant VIP without Stripe when keys missing
    if (process.env.NODE_ENV !== "production") {
      const { grantVip } = await import("@/lib/entitlements");
      await grantVip({ browserId, sessionId: "dev_session" });
      return NextResponse.json({
        url: `${origin}/vip/success?dev=1`,
        dev: true,
      });
    }
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 },
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price, quantity: 1 }],
    success_url: `${origin}/vip/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?vip=cancelled`,
    client_reference_id: browserId,
    metadata: { browser_id: browserId, product: "vip_club_key" },
  });

  return NextResponse.json({ url: session.url });
}
