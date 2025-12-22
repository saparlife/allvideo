// DodoPayments subscription plans configuration
// You need to create these products in DodoPayments dashboard first
// Then update the product IDs here

export const PLANS = {
  starter: {
    name: "Starter",
    price: 29,
    storage: 50 * 1024 * 1024 * 1024, // 50 GB in bytes
    storageName: "50 GB",
    productId: "pdt_0NUeEEOUABhCIeZV7mrQT",
  },
  growth: {
    name: "Growth",
    price: 79,
    storage: 200 * 1024 * 1024 * 1024, // 200 GB
    storageName: "200 GB",
    productId: "pdt_0NUeEIA015S7xqQHeBZx7",
  },
  scale: {
    name: "Scale",
    price: 199,
    storage: 1024 * 1024 * 1024 * 1024, // 1 TB
    storageName: "1 TB",
    productId: "pdt_0NUeEMUGQtsKCEGJgB3yj",
  },
  enterprise: {
    name: "Enterprise",
    price: 499,
    storage: 5 * 1024 * 1024 * 1024 * 1024, // 5 TB
    storageName: "5 TB",
    productId: "pdt_0NUeES59DFkWjN2CvH2YY",
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanByProductId(productId: string) {
  return Object.entries(PLANS).find(([_, plan]) => plan.productId === productId);
}

export function getPlanByName(name: string): (typeof PLANS)[PlanKey] | undefined {
  const key = name.toLowerCase() as PlanKey;
  return PLANS[key];
}
