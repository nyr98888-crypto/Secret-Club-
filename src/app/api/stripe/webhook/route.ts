import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { grantVip } from "@/lib/entitlements";
import { getEntitlement } from "@/lib/store";

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const browserId =
      session.client_reference_id ||
      session.metadata?.browser_id ||
      null;
    if (browserId) {
      const existing = await getEntitlement(browserId);
      if (existing.stripeCheckoutSessionId !== session.id) {
        await grantVip({
          browserId,
          sessionId: session.id,
          customerId:
            typeof session.customer === "string" ? session.customer : null,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
