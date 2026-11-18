import Stripe from "stripe";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
});

const sqs = new SQSClient({});

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const handler = async (event) => {
  const webhookSecret = required("STRIPE_WEBHOOK_SECRET");
  const queueUrl = required("STRIPE_EVENTS_QUEUE_URL");

  const signature =
    event?.headers?.["stripe-signature"] ??
    event?.headers?.["Stripe-Signature"] ??
    event?.headers?.["STRIPE-SIGNATURE"];

  if (!signature) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing Stripe signature." }) };
  }

  let payload = event?.body ?? "";
  if (event?.isBase64Encoded) {
    payload = Buffer.from(payload, "base64").toString("utf8");
  }

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error instanceof Error ? error.message : "Invalid Stripe webhook." }),
    };
  }

  await sqs.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(stripeEvent),
      MessageGroupId: stripeEvent.type,
      MessageDeduplicationId: stripeEvent.id,
    }),
  );

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
