import { prisma } from "./db";
import { parseJsonArray } from "./format";

export interface VaidyaResponse {
  message: string;
  suggestedProducts: {
    id: string;
    slug: string;
    name: string;
    subtitle?: string | null;
    price: number;
    image: string;
    packSize: string;
    doshaTag: string;
  }[];
  followUps: string[];
}

// Ayurvedic Clinical Knowledge Graph & Symptom Resolution Engine
export async function getVaidyaAdvice(
  userQuery: string,
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<VaidyaResponse> {
  const query = userQuery.toLowerCase().trim();

  // Load live active catalog
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true },
  });

  const getProduct = (slugSub: string) => {
    const found = products.find((p) => p.slug.includes(slugSub));
    if (!found) return null;
    const imgs = parseJsonArray<string>(found.images);
    return {
      id: found.id,
      slug: found.slug,
      name: found.name,
      subtitle: found.subtitle,
      price: found.price,
      image: imgs[0] || "/images/ashwagandha.jpg",
      packSize: found.packSize,
      doshaTag: getDoshaForProduct(found.slug),
    };
  };

  const ashwagandha = getProduct("ashwagandha");
  const triphala = getProduct("triphala");
  const chyawanprash = getProduct("chyawanprash");
  const kumkumadi = getProduct("kumkumadi");
  const bhringraj = getProduct("bhringraj");
  const tulsi = getProduct("tulsi");
  const brahmi = getProduct("brahmi");
  const shilajit = getProduct("shilajit");

  // 1. Check for Gujarati or Hindi greetings / simple pleasantries
  if (
    /^(hi|hello|hey|namaste|kem cho|kemcho|pranam|ram ram|halo)\b/i.test(query) &&
    query.split(" ").length <= 4
  ) {
    return {
      message: `નમસ્તે (Namaste)! I am your **PranVeda Ayurvedic Vaidya**.

In classical Ayurveda, true wellness starts with understanding your body's unique dosha balance (**Vata, Pitta, and Kapha**) and daily routine (*Dinacharya*).

Tell me openly:
• What health or wellness concern are you facing? (e.g. stress, sleep issues, acidity, hair fall, skin dullness, low energy)
• Or ask me any question about Ayurvedic herbs, diet (*Ahara*), and rituals.

How may I assist your healing journey today?`,
      suggestedProducts: [],
      followUps: [
        "🌙 મને ઊંઘ નથી આવતી અને સ્ટ્રેસ રહે છે",
        "🔥 Acidity and digestion problems",
        "✨ Natural glowing skin tips",
        "🌿 How to boost daily immunity?",
      ],
    };
  }

  // 2. STRESS, SLEEP, ANXIETY, OVERTHINKING (Vata Aggravation)
  if (
    query.match(
      /(sleep|insomnia|ungh|ung|stress|anxiety|tension|chinta|overthinking|restless|dhyan|mathu|headache|mental fatigue|tired mind|vichar)/i
    )
  ) {
    const prods = [ashwagandha, brahmi].filter(Boolean) as NonNullable<typeof ashwagandha>[];
    return {
      message: `🌿 **Ayurvedic Assessment: Vata Imbalance (વાત પ્રકોપ)**

In Ayurveda, disturbed sleep, restless nighttime thoughts, and mental stress are caused by an aggravated **Vata Dosha** (the air and ether elements governing nervous system activity). When Vata runs too high, the mind (*Manas*) remains hyperactive even in bed.

### 🍵 Holistic Ahara & Lifestyle Rituals (આયુર્વેદિક ઉપાય):
1. **Padabhyanga (Foot Massage):** Before sleeping, gently massage the soles of your feet with warm sesame or coconut oil for 3–5 minutes. This instantly grounds agitated Vata.
2. **Warm Golden Milk:** Drink a cup of lukewarm milk with a pinch of nutmeg (*Jaiphal*) and turmeric 30 minutes before bed.
3. **Avoid Night Screens:** Disconnect from bright mobile screens at least 45 minutes before sleep to calm the pineal gland.

### 🌿 Vedic Formulations for Restful Sleep & Mind Calm:
• **KSM-66 Ashwagandha:** Standardized root-only adaptogen that lowers evening cortisol and restores deep REM sleep.
• **Brahmi & Shankhpushpi Elixir:** Traditional *Medhya Rasayana* that cools mental chatter, sharpens clarity, and promotes peaceful relaxation.`,
      suggestedProducts: prods,
      followUps: [
        "Can I take Ashwagandha with warm milk?",
        "How long does it take to see results?",
        "What foods aggravate Vata dosha?",
      ],
    };
  }

  // 3. DIGESTION, ACIDITY, CONSTIPATION, BLOATING (Pitta/Kapha Agni Imbalance)
  if (
    query.match(
      /(digest|acidity|gas|constipation|kabjiyaat|kabj|bloat|pet|stomach|jalan|burning|pitta|sour|acid|gut|cleanse|detox|motion)/i
    )
  ) {
    const prods = [triphala, tulsi].filter(Boolean) as NonNullable<typeof triphala>[];
    return {
      message: `🔥 **Ayurvedic Assessment: Mandagni & Pitta/Kapha Dosha (જઠરાગ્નિ અસંતુલન)**

According to the classical *Charaka Samhita*, nearly all chronic ailments originate from weakened digestive fire (*Mandagni*) leading to the buildup of toxic metabolic waste called **Ama (આમ)**.
• Heartburn / Acidity = Excess **Pitta** (heat/bile element).
• Bloating & Constipation = Sluggish **Apana Vata** in the lower colon.

### 🍵 Ahara & Digestive Habits (પાચન સુધારવાના નિયમો):
1. **Ushnodaka (Sip Warm Water):** Never drink chilled ice water during or immediately after meals as it extinguishes your digestive Agni. Sip warm water instead.
2. **Ginger & Rock Salt:** Chew a thin slice of fresh ginger with a pinch of sendha namak 10 minutes before lunch to awaken digestive juices naturally.
3. **Avoid Late Dinners:** Finish dinner before 8:00 PM, and avoid sour, excessively spicy, or fermented foods in the evening.

### 🌿 Recommended Botanical Cleanse:
• **Organic Triphala Churna:** The classical 3-fruit Vedic rasayana (Amla, Haritaki, Bibhitaki). It does not cause dependency; it gently tones the intestinal muscles, cleanses Ama overnight, and relieves acid flare-ups.
• **Panch Tulsi Ark:** 2 drops in warm water supports gut flora and metabolic cleansing.`,
      suggestedProducts: prods,
      followUps: [
        "How to drink Triphala churna at night?",
        "Is Triphala habit-forming?",
        "What should I eat for acidity relief?",
      ],
    };
  }

  // 4. SKIN RADIANCE, GLOW, PIGMENTATION, BLEMISHES (Pitta / Rakta Dhatu)
  if (
    query.match(
      /(skin|glow|chehra|face|pigmentation|dark spot|blemish|acne|khil|wrinkle|dull|radiance|tan|saffron|kesar|kumkumadi)/i
    )
  ) {
    const prods = [kumkumadi, chyawanprash].filter(Boolean) as NonNullable<typeof kumkumadi>[];
    return {
      message: `✨ **Ayurvedic Assessment: Rakta Dhatu & Pitta Balance (ત્વચાનું તેજ)**

Ayurveda views the skin as a direct mirror of your **Rakta Dhatu (blood tissue)** and **Bhrajaka Pitta** (the sub-dosha responsible for skin luster and temperature). Topical creams with chemical silicones only coat the surface, whereas classical Ayurvedic elixirs nourish the deep sub-dermal layers.

### 🌸 Daily Ayurvedic Beauty Ritual (સૌંદર્ય ઉપચાર):
1. **Damp Skin Application:** Never apply facial oils to dry skin. Always wash your face with mild lukewarm water, leave it damp, warm 3–4 drops between clean palms, and press gently into the face and neck.
2. **Kashmiri Saffron Night Recovery:** Overnight is when cellular regeneration peaks. Pure saffron threads and red sandalwood actively reduce dark melanin clusters while you rest.
3. **Hydration & Purity:** Drink 2–3 liters of water, and avoid excess fried snacks that overheat the blood.

### 🌿 Signature Luminous Formulations:
• **Kumkumadi Miraculous Facial Oil:** Handcrafted with authentic Grade-1 Kashmiri saffron and 21 Himalayan herbs steeped in cold-pressed sesame oil. Restores golden morning glow and softens blemishes.
• **Royal Saffron Chyawanprash:** Blood-purifying Amla and Kashmiri Kesar cleanse the internal system for lasting radiance.`,
      suggestedProducts: prods,
      followUps: [
        "How many drops of Kumkumadi oil should I use?",
        "Can I use Kumkumadi oil on oily skin?",
        "What causes pigmentation in Ayurveda?",
      ],
    };
  }

  // 5. HAIR FALL, DANDRUFF, ROOT STRENGTH, GREYING (Asthi Dhatu & Pitta Heat)
  if (
    query.match(
      /(hair|fall|bal|dandruff|scalp|thinning|regrowth|alopecia|grey|safed|champi|follicle|bhringraj|amla)/i
    )
  ) {
    const prods = [bhringraj].filter(Boolean) as NonNullable<typeof bhringraj>[];
    return {
      message: `🌿 **Ayurvedic Assessment: Asthi Dhatu & Scalp Pitta (કેશ આરોગ્ય)**

In Ayurvedic anatomy, hair (*Kesha*) is the byproduct (*Upadhatu*) of **Asthi Dhatu (bone tissue)** and is vulnerable to excess body heat (**Pitta**). When excessive mental stress or heat travels upwards to the crown of the head, hair follicles shrink, leading to accelerated hair fall.

### 💆 Classical Scalp Therapy (કેશ રક્ષણ ઉપાય):
1. **The 10-Minute Champi Ritual:** Warm your hair oil slightly in a bowl of hot water (never direct flame). Massage the scalp with gentle circular motions to stimulate micro-circulation and cool the cerebral nervous system.
2. **Overnight or 1-Hour Soak:** Leave the botanical oils to penetrate the roots for at least 1–2 hours before washing with a sulfate-free cleanser.
3. **Diet for Hair:** Eat 4–5 soaked almonds, amla juice, and curry leaves daily to strengthen bone tissue and collagen.

### 🌿 The Rebound Formulation:
• **Bhringraj & Amla Hair Oil:** Known in ancient texts as *Keshraj* ("King of Hair"), our oil is prepared using the classical 18-hour *Kshirapaka* method to deliver genuine root nourishment and curb seasonal shedding.`,
      suggestedProducts: prods,
      followUps: [
        "How often should I oil my hair?",
        "Does Bhringraj help with dandruff?",
        "What diet stops hair fall quickly?",
      ],
    };
  }

  // 6. ENERGY, WEAKNESS, STAMINA, IMMUNITY, VITALITY (Ojas Depletion)
  if (
    query.match(
      /(energy|stamina|weakness|fatigue|shakti|power|exhaust|tired|thakav|recovery|shilajit|vitality|ojas|gym|workout|libido)/i
    )
  ) {
    const prods = [shilajit, chyawanprash].filter(Boolean) as NonNullable<typeof shilajit>[];
    return {
      message: `⚡ **Ayurvedic Assessment: Ojas & Dhatu Nourishment (ઓજસ અને ઊર્જા)**

In Ayurveda, **Ojas (ઓજસ)** is the supreme essence of all seven bodily tissues. When Ojas is depleted through chronic work stress, poor nutrition, or erratic schedules, the body experiences physical lethargy, low recovery, and afternoon exhaustion.

### 🍵 Ojas-Building Lifestyle Tips (શક્તિવર્ધક ઉપાય):
1. **Morning Mineral Tonic:** Dissolve a pea-sized portion of purified Himalayan Shilajit resin in lukewarm water or grass-fed cow's milk on an empty stomach.
2. **Whole Food Fuel:** Include dates, figs (*Anjeer*), pure cow's ghee, and seasonal fresh fruits in your breakfast.
3. **Avoid Caffeine Dependency:** Excessive black coffee depletes adrenal reserves; replace morning coffee with botanical energy rasayanas.

### 🌿 Potent Natural Rasayanas:
• **Pure Himalayan Shilajit Resin:** Sourced from 16,000ft high-altitude rock faces with >75% fulvic acid and 84+ ionic trace minerals for cellular ATP energy.
• **Royal Saffron Chyawanprash:** Slow-cooked in Gir Cow A2 bilona ghee and raw wild honey for full-spectrum stamina.`,
      suggestedProducts: prods,
      followUps: [
        "How to take Shilajit resin correctly?",
        "Is Shilajit safe for daily use?",
        "Can Shilajit be taken during summer?",
      ],
    };
  }

  // 7. COLD, COUGH, IMMUNITY, RESPIRATORY (Kapha Prana Imbalance)
  if (
    query.match(
      /(cold|cough|sardi|udharas|khasi|throat|fever|immunity|infection|kadha|tulsi|respiratory|breath|allergy)/i
    )
  ) {
    const prods = [tulsi, chyawanprash].filter(Boolean) as NonNullable<typeof tulsi>[];
    return {
      message: `🛡️ **Ayurvedic Assessment: Pranavaha Srotas & Kapha Defense (રોગપ્રતિકારક શક્તિ)**

Seasonal weather shifts frequently aggravate **Kapha Dosha**, creating congestion in the chest, sinuses, and throat channels (*Pranavaha Srotas*). Ayurveda focuses on strengthening internal immune defense rather than suppressing symptoms with drowsy antihistamines.

### 🍵 Classical Home Kadha Ritual (ઘરગથ્થુ ઉકાળો):
1. **Panch Tulsi Water:** Add 2–3 drops of pure Panch Tulsi extract into warm water or herbal tea twice daily. Sacred holy basil leaves are naturally rich in antimicrobial eugenol.
2. **Steam Inhalation:** Inhale warm steam infused with a drop of eucalyptus or tulsi oil before bed to clear nasal airways.
3. **Avoid Mucus-Forming Foods:** Temporarily avoid cold milk, bananas, curds at night, and refined sugar.

### 🌿 Immunity Shield Formulations:
• **Panch Tulsi Ark Drops:** Distilled from 5 sacred varieties of wild holy basil for instant respiratory clarity.
• **Royal Saffron Chyawanprash:** Vitamin C-rich wild Amla and 42 classical herbs to fortify your family's daily defense.`,
      suggestedProducts: prods,
      followUps: [
        "How many drops of Tulsi ark per glass?",
        "Can children take Chyawanprash?",
        "Best kadha recipe for sore throat?",
      ],
    };
  }

  // 8. HOW TO TAKE / DOSAGE / MILK QUESTIONS (Educational, NO pushy sales)
  if (
    query.match(
      /(how to take|dosage|milk|water|morning|night|empty stomach|when to consume|kai rite levu|kem levu|timing)/i
    )
  ) {
    return {
      message: `🌿 **Ayurvedic Guidance on Anupana (The Vehicle of Herbs)**

In classical pharmacology, the substance you take your herb with is called **Anupana (અનુપાન)**. The right Anupana carries the active botanical phytochemicals deep into your body's tissues (*Dhatus*):

| Formulation | Best Time | Ideal Anupana (With What) |
| :--- | :--- | :--- |
| **Ashwagandha** | 30 mins before bed | Warm cow's milk (or warm water) + pinch of nutmeg |
| **Triphala Churna** | Bedtime (30m after dinner) | Lukewarm water (1 cup) |
| **Himalayan Shilajit** | Early morning empty stomach | Warm water or warm milk |
| **Kumkumadi Oil** | Night before sleep | On clean, damp face with gentle upward press |
| **Chyawanprash** | Morning empty stomach | 1 tsp followed by warm milk/water |
| **Bhringraj Hair Oil** | 1–2 hours before bath or overnight | Warm oil gently with finger pads |

Always listen to your body, and maintain a consistent 21-day routine for optimal cellular resonance.`,
      suggestedProducts: [],
      followUps: [
        "Can I take Ashwagandha and Shilajit together?",
        "Why is milk recommended with Ashwagandha?",
        "Can Triphala be taken every day?",
      ],
    };
  }

  // 9. GENERAL / DOSHA INQUIRY / PHILOSOPHICAL
  const generalProds = [ashwagandha, chyawanprash, kumkumadi].filter(Boolean) as NonNullable<
    typeof ashwagandha
  >[];

  return {
    message: `🌿 **Namaste! Ayurvedic Wisdom from PranVeda**

Every human being is born with a unique combination of the three fundamental cosmic energies known as **Doshas**:
• **Vata (Air & Ether):** Governs movement, nervous system, and thoughts. When imbalanced: anxiety, insomnia, dry skin, constipation.
• **Pitta (Fire & Water):** Governs digestion, metabolism, and intellect. When imbalanced: acidity, skin inflammation, irritability.
• **Kapha (Earth & Water):** Governs physical structure, immunity, and lubrication. When imbalanced: sluggishness, weight gain, congestion.

Tell me more about what your body is currently experiencing:
1. Are you looking to improve **sleep, mental stress, or focus**?
2. Are you experiencing **digestive issues, acidity, or bloating**?
3. Or are you focusing on **hair strength, glowing skin, or daily stamina**?

I am here to guide your personal lifestyle rituals and explain how authentic herbs restore internal harmony.`,
    suggestedProducts: generalProds,
    followUps: [
      "How do I determine my primary Dosha?",
      "Recommend best herbs for daily stamina",
      "What are the benefits of pure Shilajit?",
    ],
  };
}

function getDoshaForProduct(slug: string): string {
  if (slug.includes("ashwagandha")) return "Vata & Pitta Calming";
  if (slug.includes("triphala")) return "Tridoshic (All Body Types)";
  if (slug.includes("chyawanprash")) return "Tridoshic & Ojas Building";
  if (slug.includes("kumkumadi")) return "Pitta & Vata Soothing";
  if (slug.includes("bhringraj")) return "Pitta Pacifying (Cooling)";
  if (slug.includes("tulsi")) return "Kapha & Vata Balancing";
  if (slug.includes("brahmi")) return "Medhya Rasayana (Mind Calm)";
  if (slug.includes("shilajit")) return "Vata & Kapha Energizer";
  return "Tridoshic Ayurvedic Herb";
}
