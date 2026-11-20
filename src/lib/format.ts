export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseJsonArray<T = string>(value: string | null | undefined): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `PV-${y}-${rand}`;
}

export const HEALTH_CONCERNS = [
  { id: "Immunity", label: "Immunity", description: "Daily defense & seasonal resilience" },
  { id: "Digestion", label: "Digestion", description: "Gut harmony & gentle detox" },
  { id: "Hair", label: "Hair Care", description: "Root strength & botanical shine" },
  { id: "Skin", label: "Skin Glow", description: "Radiance & saffron elixirs" },
  { id: "Stress & Sleep", label: "Stress & Sleep", description: "Calm mind & restorative rest" },
  { id: "Energy", label: "Energy & Vitality", description: "Stamina & daily vigor" },
] as const;

export const ORDER_STATUS_STEPS = ["PLACED", "PACKED", "SHIPPED", "DELIVERED"] as const;
