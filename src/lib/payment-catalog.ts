import type { ProcessorId } from "@/lib/shop-types";

export type ProcessorField = {
  key: "publishableKey" | "merchantId" | "statementDescriptor" | "secretKey" | "webhookSecret";
  label: string;
  placeholder: string;
  secret?: boolean;
  hint?: string;
};

export type ProcessorCatalogEntry = {
  id: ProcessorId;
  name: string;
  recommended?: boolean;
  rate: string;
  blurb: string;
  methods: string;
  fields: ProcessorField[];
  defaultOffNote?: string;
};

export const PROCESSOR_CATALOG: ProcessorCatalogEntry[] = [
  {
    id: "stripe",
    name: "Stripe",
    recommended: true,
    rate: "2.9% + $0.30 online · Apple Pay + Google Pay included",
    blurb: "Recommended first. Authorize at checkout, capture when the tablet Accepts, void if declined.",
    methods: "Card, Apple Pay, Google Pay, ACH (0.8% cap $5)",
    fields: [
      { key: "publishableKey", label: "Publishable key", placeholder: "pk_…" },
      { key: "secretKey", label: "Secret key", placeholder: "sk_…", secret: true },
      { key: "webhookSecret", label: "Webhook signing secret", placeholder: "whsec_…", secret: true },
      { key: "statementDescriptor", label: "Statement descriptor", placeholder: "SOUTH END PIZZA" },
    ],
  },
  {
    id: "helcim",
    name: "Helcim",
    rate: "Interchange + 0.50% + $0.25 online · $0/mo",
    blurb: "Cheapest at volume.",
    methods: "Card, Google Pay, ACH (0.5% cap $6)",
    fields: [
      { key: "merchantId", label: "Account ID", placeholder: "Helcim account ID" },
      { key: "secretKey", label: "API token", placeholder: "API token", secret: true },
      { key: "publishableKey", label: "Checkout / HelcimPay.js token", placeholder: "Checkout token" },
    ],
  },
  {
    id: "square",
    name: "Square",
    rate: "Online API 2.9% + $0.30 (not the Free hosted 3.3% rate)",
    blurb: "Only if the shop already uses Square hardware.",
    methods: "Card, Apple Pay, Google Pay, Cash App if Square enables it",
    fields: [
      { key: "publishableKey", label: "Application ID", placeholder: "sq0idp-…" },
      { key: "secretKey", label: "Access token", placeholder: "Access token", secret: true },
      { key: "merchantId", label: "Location ID", placeholder: "Location ID" },
    ],
  },
  {
    id: "stax",
    name: "Stax",
    rate: "$99/mo + interchange + $0.15–$0.18",
    blurb: "High volume later.",
    methods: "Card",
    defaultOffNote: "Turn on after ~$40k/month",
    fields: [
      { key: "publishableKey", label: "Public key / web token", placeholder: "Public token" },
      { key: "secretKey", label: "Secret API key", placeholder: "Secret API key", secret: true },
    ],
  },
  {
    id: "paypal",
    name: "PayPal",
    rate: "~2.99–3.49% + $0.49",
    blurb: "Optional, not primary. Expensive on $25 pies.",
    methods: "PayPal",
    defaultOffNote: "Leave off unless a customer asks for PayPal.",
    fields: [
      { key: "publishableKey", label: "Client ID", placeholder: "Client ID" },
      { key: "secretKey", label: "Secret", placeholder: "Secret", secret: true },
    ],
  },
];

export function catalogFor(id: ProcessorId) {
  return PROCESSOR_CATALOG.find((p) => p.id === id) ?? PROCESSOR_CATALOG[0];
}
