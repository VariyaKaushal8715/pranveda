import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌿 Seeding PranVeda Ayurveda database...");

  // 1. Store Settings
  await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      storeName: "PranVeda",
      tagline: "Ancient Wisdom, Pure Vitality",
      whatsappNumber: "919876543210",
      supportEmail: "care@pranveda.in",
      address: "104 Botanical Arcade, SG Highway, Ahmedabad, Gujarat 380054",
      instagramUrl: "https://instagram.com/pranveda.ayurveda",
      freeShippingThreshold: 499,
      shippingFee: 49,
    },
  });

  // 2. Users (Admin + Demo Customer)
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const customerPassword = await bcrypt.hash("Customer@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@pranveda.in" },
    update: {},
    create: {
      name: "PranVeda Admin",
      email: "admin@pranveda.in",
      phone: "9876543210",
      passwordHash: adminPassword,
      role: "ADMIN",
      address: "104 Botanical Arcade, SG Highway",
      city: "Ahmedabad",
      state: "Gujarat",
      pincode: "380054",
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@pranveda.in" },
    update: {},
    create: {
      name: "Aarav Patel",
      email: "customer@pranveda.in",
      phone: "9825012345",
      passwordHash: customerPassword,
      role: "CUSTOMER",
      address: "24 Banyan Courtyard, Navrangpura",
      city: "Ahmedabad",
      state: "Gujarat",
      pincode: "380009",
    },
  });

  // 3. Categories
  const categoryData = [
    {
      name: "Herbal Capsules & Tablets",
      slug: "herbal-capsules",
      description: "Standardized, high-potency root & botanical extracts in plant-based capsules.",
    },
    {
      name: "Classical Churnas & Rasayanas",
      slug: "churnas-rasayanas",
      description: "Time-honored Vedic blends crafted in small batches for daily vitality.",
    },
    {
      name: "Botanical Oils & Elixirs",
      slug: "botanical-oils",
      description: "Cold-pressed & slow-infused Ayurvedic oils for luminous skin and strong hair.",
    },
    {
      name: "Pure Resins & Ark Drops",
      slug: "resins-drops",
      description: "Concentrated Himalayan minerals and sacred herbal distillations.",
    },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoryData) {
    const saved = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: cat,
    });
    categories[cat.slug] = saved.id;
  }

  // 4. Demo Products (8 authentic PranVeda formulations)
  const products = [
    {
      name: "KSM-66 Ashwagandha Root Capsules",
      slug: "ksm-66-ashwagandha-root-capsules",
      subtitle: "Full-Spectrum Organic Adaptogen for Calm & Resilience",
      description:
        "Harvested from sun-drenched Rajasthan farms, PranVeda KSM-66 Ashwagandha delivers pure root-only extract standardized to 5% withanolides. Formulated to gently lower daily stress, promote deep restorative sleep, and support balanced physical stamina without drowsiness.",
      ingredients:
        "Organic KSM-66 Ashwagandha Root Extract (Withania somnifera) 600mg, Organic Black Pepper Extract (Piperine) 5mg for enhanced absorption, Plant Cellulose Capsule.",
      benefits:
        "• Helps calm the nervous system & manage everyday cortisol stress\n• Supports deep, uninterrupted restorative sleep cycles\n• Enhances natural strength, recovery & sustained daily energy\n• 100% root-only extract, zero fillers, lab-tested for heavy metals",
      howToUse:
        "Take 1 capsule twice daily with warm milk or water after meals, or as advised by your Ayurvedic practitioner.",
      price: 649,
      compareAtPrice: 799,
      packSize: "60 Veg Capsules",
      stock: 48,
      categoryId: categories["herbal-capsules"],
      concerns: JSON.stringify(["Stress & Sleep", "Energy"]),
      images: JSON.stringify(["/images/ashwagandha.jpg"]),
      isFeatured: true,
      isBestSeller: true,
      isActive: true,
    },
    {
      name: "Organic Triphala Churna",
      slug: "organic-triphala-churna",
      subtitle: "Classical Three-Fruit Gut Cleanse & Digestive Harmony",
      description:
        "A revered Tridoshic rasayana uniting sun-dried Amalaki, Bibhitaki, and Haritaki in classic Ayurvedic proportions. PranVeda Triphala Churna gently cleanses the digestive tract, supports regular morning metabolism, and nourishes gut microbiome balance.",
      ingredients:
        "Certified Organic Amalaki (Emblica officinalis), Bibhitaki (Terminalia bellirica), Haritaki (Terminalia chebula) — shade-dried and stone-milled.",
      benefits:
        "• Promotes smooth, gentle overnight digestive cleansing\n• Balances Vata, Pitta & Kapha doshas naturally\n• Rich in natural Vitamin C and gut-soothing polyphenols\n• Non-habit forming daily gut wellness ritual",
      howToUse:
        "Mix 1 teaspoon (3–5g) in a cup of lukewarm water 30 minutes before bedtime. Follow with warm water.",
      price: 349,
      compareAtPrice: 449,
      packSize: "200g Glass Jar",
      stock: 65,
      categoryId: categories["churnas-rasayanas"],
      concerns: JSON.stringify(["Digestion", "Immunity"]),
      images: JSON.stringify(["/images/triphala.jpg"]),
      isFeatured: true,
      isBestSeller: true,
      isActive: true,
    },
    {
      name: "Royal Saffron Chyawanprash",
      slug: "royal-saffron-chyawanprash",
      subtitle: "Slow-Cooked A2 Bilona Ghee & Kashmiri Kesar Immunity Rasayana",
      description:
        "Prepared in small copper-lined batches using wild forest Amla, 42 classical Ayurvedic herbs, pure A2 Gir Cow Bilona Ghee, raw forest honey, and Grade-1 Pampore Kashmiri Saffron. An indulgent daily spoonful for year-round respiratory & immune strength.",
      ingredients:
        "Wild Forest Amla (52%), A2 Gir Cow Bilona Ghee, Raw Forest Honey, Kashmiri Kesar (Saffron), Ashwagandha, Giloy, Shatavari, Pippali, Cardamom, Cinnamon, Clove & 32 classical herbs.",
      benefits:
        "• Fortifies natural immunity across changing seasons\n• Supports healthy lungs, vitality & youthful rejuvenation\n• Free from refined white sugar and artificial preservatives\n• Safe and nourishing for the entire family",
      howToUse:
        "Enjoy 1 teaspoon every morning followed by warm milk or lukewarm water.",
      price: 799,
      compareAtPrice: 999,
      packSize: "500g Amber Jar",
      stock: 34,
      categoryId: categories["churnas-rasayanas"],
      concerns: JSON.stringify(["Immunity", "Energy"]),
      images: JSON.stringify(["/images/chyawanprash.jpg"]),
      isFeatured: true,
      isBestSeller: true,
      isActive: true,
    },
    {
      name: "Kumkumadi Miraculous Facial Oil",
      slug: "kumkumadi-miraculous-facial-oil",
      subtitle: "21-Herb Kashmiri Saffron Night Elixir for Luminous Radiance",
      description:
        "Crafted strictly according to the classical Ashtanga Hridaya text, this liquid-gold facial elixir infuses pure Kashmiri Saffron, Red Sandalwood, Manjistha, and Vetiver into cold-pressed sesame & almond oils. Wake up to visibly calmer, brighter, deeply nourished skin.",
      ingredients:
        "Kashmiri Saffron (Crocus sativus), Red Sandalwood (Rakta Chandan), Manjistha, Yashtimadhu (Licorice), Lotus Stamen, Vetiver, Cold-Pressed Sesame Oil.",
      benefits:
        "• Illuminates dull, uneven skin tone & softens fine lines\n• Visibly diminishes dark spots and post-blemish marks\n• Deeply hydrates without clogging pores\n• 100% botanical, zero mineral oil, silicones or synthetic fragrance",
      howToUse:
        "Warm 3–4 drops between your palms and press gently onto damp cleansed face and neck every night before sleep.",
      price: 1299,
      compareAtPrice: 1599,
      packSize: "30ml Dropper Bottle",
      stock: 26,
      categoryId: categories["botanical-oils"],
      concerns: JSON.stringify(["Skin"]),
      images: JSON.stringify(["/images/kumkumadi.jpg"]),
      isFeatured: true,
      isBestSeller: true,
      isActive: true,
    },
    {
      name: "Bhringraj & Amla Nourishing Hair Oil",
      slug: "bhringraj-amla-nourishing-hair-oil",
      subtitle: "Slow-Infused Kshirapaka Scalp Ritual for Root Strength",
      description:
        "Known in Ayurveda as 'Keshraj' — the king of herbs for hair — fresh Bhringraj leaves are slow-simmered for 18 hours with wild Amla, Brahmi, Hibiscus, and cold-pressed black sesame oil to fortify follicles, curb hair fall, and restore velvety shine.",
      ingredients:
        "Fresh Bhringraj Juice, Wild Amla, Brahmi, Hibiscus Petals, Fenugreek Seeds, Curry Leaves, Cold-Pressed Black Sesame & Coconut Oils.",
      benefits:
        "• Strengthens roots & noticeably reduces seasonal hair fall\n• Soothes dry scalp while cooling the mind during champi massage\n• Promotes thicker, lustrous, naturally conditioned strands\n• Lightweight absorption with authentic herbal aroma",
      howToUse:
        "Massage gently into scalp for 5–10 minutes using fingertips. Leave on for at least 1 hour or overnight before rinsing with a mild cleanser.",
      price: 549,
      compareAtPrice: 699,
      packSize: "200ml Glass Bottle",
      stock: 42,
      categoryId: categories["botanical-oils"],
      concerns: JSON.stringify(["Hair"]),
      images: JSON.stringify(["/images/bhringraj-oil.jpg"]),
      isFeatured: false,
      isBestSeller: true,
      isActive: true,
    },
    {
      name: "Panch Tulsi Ark Drops",
      slug: "panch-tulsi-ark-drops",
      subtitle: "Concentrated Extract of 5 Sacred Holy Basil Varieties",
      description:
        "A potent botanical distillation combining Rama, Shyama, Vana, Vishnu, and Nimbu Tulsi extracts. Just two drops in warm water or herbal tea awaken antioxidant defense, clear seasonal congestion, and refresh digestion naturally.",
      ingredients:
        "Pure Concentrated Extracts of Rama Tulsi, Shyama Tulsi, Vana Tulsi, Vishnu Priya Tulsi, and Nimbu Tulsi.",
      benefits:
        "• Supports daily respiratory clarity & seasonal immunity\n• Natural antioxidant shield against urban pollution & fatigue\n• Soothes throat comfort and supports clean digestion\n• Ultra-concentrated: over 250 servings per bottle",
      howToUse:
        "Add 2–3 drops to a glass of warm water, green tea, or kadha twice daily.",
      price: 299,
      compareAtPrice: 375,
      packSize: "30ml Dropper Bottle",
      stock: 80,
      categoryId: categories["resins-drops"],
      concerns: JSON.stringify(["Immunity", "Digestion"]),
      images: JSON.stringify(["/images/tulsi-drops.jpg"]),
      isFeatured: false,
      isBestSeller: false,
      isActive: true,
    },
    {
      name: "Brahmi & Shankhpushpi Mind Elixir",
      slug: "brahmi-shankhpushpi-mind-elixir",
      subtitle: "Nootropic Medhya Rasayana for Focus, Memory & Tranquility",
      description:
        "Uniting two celebrated Medhya (mind-nourishing) botanicals — Bacopa monnieri (Brahmi) and Shankhpushpi — this clean daily supplement supports mental clarity, sustained concentration, and calm cognitive stamina for busy modern schedules.",
      ingredients:
        "Standardized Brahmi Extract (20% Bacosides) 350mg, Shankhpushpi Whole Herb Extract 250mg, Organic Jatamansi 50mg.",
      benefits:
        "• Enhances sharp focus, recall & calm mental alertness\n• Helps quiet mental fatigue without caffeine jitters\n• Nourishes nervous system clarity for students & professionals\n• Vegan, gluten-free & third-party purity tested",
      howToUse:
        "Take 1 capsule in the morning and 1 in the evening with warm water after food.",
      price: 599,
      compareAtPrice: 749,
      packSize: "60 Veg Capsules",
      stock: 38,
      categoryId: categories["herbal-capsules"],
      concerns: JSON.stringify(["Stress & Sleep"]),
      images: JSON.stringify(["/images/brahmi-elixir.jpg"]),
      isFeatured: false,
      isBestSeller: false,
      isActive: true,
    },
    {
      name: "Pure Himalayan Shilajit Resin",
      slug: "pure-himalayan-shilajit-resin",
      subtitle: "Gold-Grade 16,000ft Himalayan Mineral Resin (>75% Fulvic Acid)",
      description:
        "Ethically harvested from high-altitude Himalayan rock fissures above 16,000 feet and purified using traditional Triphala decoction (Surya Tapi method). Packed with over 84 bioavailable trace minerals and natural fulvic acid for peak vitality, cellular energy, and endurance.",
      ingredients:
        "100% Pure Himalayan Gold-Grade Shilajit Resin (Asphaltum punjabianum), naturally rich in Fulvic Acid (>75%) & Humic minerals. Includes brass dosing spoon.",
      benefits:
        "• Fuels sustained cellular energy, strength & active stamina\n• Supports natural vitality, recovery & micronutrient absorption\n• Lab-certified purity report for every batch — zero fillers\n• Authentic soft tar-like resin texture with brass spoon",
      howToUse:
        "Dissolve a pea-sized portion (250–300mg) in warm water or milk every morning on an empty stomach.",
      price: 1499,
      compareAtPrice: 1899,
      packSize: "20g Luxury Glass Jar",
      stock: 19,
      categoryId: categories["resins-drops"],
      concerns: JSON.stringify(["Energy", "Immunity"]),
      images: JSON.stringify(["/images/shilajit-resin.jpg"]),
      isFeatured: true,
      isBestSeller: true,
      isActive: true,
    },
  ];

  const createdProducts: Record<string, string> = {};
  for (const prod of products) {
    const saved = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: prod,
      create: prod,
    });
    createdProducts[prod.slug] = saved.id;
  }

  // 5. Coupons
  const coupons = [
    {
      code: "PRAN10",
      discountType: "PERCENT",
      discountValue: 10,
      minOrderAmount: 0,
      maxDiscount: 500,
      isActive: true,
    },
    {
      code: "WELCOME15",
      discountType: "PERCENT",
      discountValue: 15,
      minOrderAmount: 799,
      maxDiscount: 600,
      isActive: true,
    },
    {
      code: "AYUR200",
      discountType: "FLAT",
      discountValue: 200,
      minOrderAmount: 1499,
      maxDiscount: null,
      isActive: true,
    },
  ];

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: coupon,
      create: coupon,
    });
  }

  // 6. Seed Reviews (only if none exist)
  const reviewCount = await prisma.review.count();
  if (reviewCount === 0) {
    await prisma.review.createMany({
      data: [
        {
          productId: createdProducts["ksm-66-ashwagandha-root-capsules"],
          userId: customer.id,
          authorName: "Aarav Patel",
          rating: 5,
          title: "Noticeably calmer sleep within 10 days",
          comment:
            "I used to wake up tired every morning. Two weeks with PranVeda KSM-66 Ashwagandha and my evening stress dropped significantly. Packaging feels truly apothecary-grade.",
          verifiedPurchase: true,
        },
        {
          productId: createdProducts["kumkumadi-miraculous-facial-oil"],
          authorName: "Meera Deshmukh",
          rating: 5,
          title: "Pure Kashmiri saffron aroma — real glow!",
          comment:
            "Just 3 drops before bed and my skin feels plump and luminous by morning. Zero greasiness and you can tell the saffron is genuine.",
          verifiedPurchase: true,
        },
        {
          productId: createdProducts["royal-saffron-chyawanprash"],
          authorName: "Dr. Rohan Joshi",
          rating: 5,
          title: "Authentic taste, no sugary syrup feel",
          comment:
            "Most market brands taste like sugar jam. PranVeda's Chyawanprash has that earthy, spiced Amla & A2 ghee richness my grandmother used to make.",
          verifiedPurchase: true,
        },
        {
          productId: createdProducts["pure-himalayan-shilajit-resin"],
          authorName: "Vikramaditya Mehta",
          rating: 5,
          title: "Genuine resin & amazing morning energy",
          comment:
            "Dissolves completely in warm water with a golden-amber hue. My afternoon fatigue is completely gone and the brass spoon is a classy touch.",
          verifiedPurchase: true,
        },
        {
          productId: createdProducts["organic-triphala-churna"],
          authorName: "Neha Shah",
          rating: 4,
          title: "Very gentle and finely milled",
          comment:
            "Works smoothly without any stomach discomfort. Love the dark glass jar that keeps it fresh.",
          verifiedPurchase: true,
        },
        {
          productId: createdProducts["bhringraj-amla-nourishing-hair-oil"],
          authorName: "Priya Nair",
          rating: 5,
          title: "Reduced hair fall after 4 washes",
          comment:
            "Has a relaxing traditional herbal scent and washes out easily. My hair feels noticeably thicker at the roots.",
          verifiedPurchase: true,
        },
      ],
    });
  }

  // 7. Seed one sample order for Admin dashboard preview
  const orderCount = await prisma.order.count();
  if (orderCount === 0) {
    await prisma.order.create({
      data: {
        orderNumber: "PV-2026-1001",
        userId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || "9825012345",
        shippingAddress: "24 Banyan Courtyard, Navrangpura",
        shippingCity: "Ahmedabad",
        shippingState: "Gujarat",
        shippingPincode: "380009",
        subtotal: 1948,
        discount: 195,
        couponCode: "PRAN10",
        shippingFee: 0,
        total: 1753,
        paymentMethod: "RAZORPAY",
        paymentStatus: "PAID",
        razorpayOrderId: "order_demo_seed_1001",
        razorpayPaymentId: "pay_demo_seed_1001",
        orderStatus: "SHIPPED",
        trackingNote: "Dispatched via BlueDart Ayurveda Express — AWB #BD889241",
        items: {
          create: [
            {
              productId: createdProducts["ksm-66-ashwagandha-root-capsules"],
              productName: "KSM-66 Ashwagandha Root Capsules",
              productImage: "/images/ashwagandha.jpg",
              packSize: "60 Veg Capsules",
              price: 649,
              quantity: 1,
            },
            {
              productId: createdProducts["kumkumadi-miraculous-facial-oil"],
              productName: "Kumkumadi Miraculous Facial Oil",
              productImage: "/images/kumkumadi.jpg",
              packSize: "30ml Dropper Bottle",
              price: 1299,
              quantity: 1,
            },
          ],
        },
      },
    });
  }

  console.log("✅ PranVeda seed complete!");
  console.log(`   Admin login:    ${admin.email} / Admin@123`);
  console.log(`   Customer login: ${customer.email} / Customer@123`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
