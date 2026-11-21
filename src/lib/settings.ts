import { prisma } from "./db";

export async function getStoreSettings() {
  let settings = await prisma.storeSetting.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.storeSetting.create({
      data: {
        id: "default",
        storeName: "PranVeda",
        tagline: "Ancient Wisdom, Pure Vitality",
        whatsappNumber: "919876543210",
        supportEmail: "care@pranveda.in",
        address: "104 Botanical Arcade, SG Highway, Ahmedabad, Gujarat 380054",
        instagramUrl: "https://instagram.com/pranveda.ayurveda",
        upiId: "pranveda@okhdfcbank",
        upiName: "PranVeda Apothecary",
        freeShippingThreshold: 499,
        shippingFee: 49,
      },
    });
  }

  return settings;
}
