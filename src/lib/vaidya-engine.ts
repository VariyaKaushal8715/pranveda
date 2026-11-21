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

export async function getVaidyaAdvice(
  userQuery: string,
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<VaidyaResponse> {
  const query = userQuery.trim();
  const queryLower = query.toLowerCase();

  // Load live active catalog with graceful fallback
  let products: any[] = [];
  try {
    products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
    });
  } catch (err) {
    console.warn("Could not load products from prisma for AI Vaidya, using fallback catalog:", err);
  }

  const FALLBACK_CATALOG: Record<string, any> = {
    ashwagandha: {
      id: "prod-ashwa",
      slug: "ksm-66-ashwagandha",
      name: "KSM-66 Ashwagandha Root",
      subtitle: "Restorative sleep, stress resilience & adrenal recharge",
      price: 799,
      image: "/images/ashwagandha.jpg",
      packSize: "60 Veg Capsules",
      doshaTag: "Vata Shaman (વાત શામક)",
    },
    triphala: {
      id: "prod-triphala",
      slug: "organic-triphala-churna",
      name: "Organic Triphala Churna",
      subtitle: "Nightly gut detox, gentle colon cleanse & Agni balance",
      price: 349,
      image: "/images/triphala.jpg",
      packSize: "200g Glass Jar",
      doshaTag: "Tridoshic Balance (ત્રિદોષ શામક)",
    },
    chyawanprash: {
      id: "prod-chyawanprash",
      slug: "royal-saffron-chyawanprash",
      name: "Royal Saffron Chyawanprash",
      subtitle: "52 Wildcrafted herbs, Kashmiri Saffron & Organic Amla",
      price: 949,
      image: "/images/chyawanprash.jpg",
      packSize: "500g Amber Jar",
      doshaTag: "Rasayana & Ojas (રસાયન અને ઓજસ)",
    },
    kumkumadi: {
      id: "prod-kumkumadi",
      slug: "kumkumadi-tailam",
      name: "Kumkumadi Miraculous Facial Oil",
      subtitle: "100% Pure saffron, sandalwood & goat milk beauty nectar",
      price: 1499,
      image: "/images/kumkumadi.jpg",
      packSize: "30ml Dropper Bottle",
      doshaTag: "Pitta Pacifying (પિત્ત શામક)",
    },
    bhringraj: {
      id: "prod-bhringraj",
      slug: "bhringraj-hair-oil",
      name: "Bhringraj & Amla Hair Therapy Oil",
      subtitle: "Intense root nourishment, scalp cooling & hair fall defense",
      price: 599,
      image: "/images/bhringraj.jpg",
      packSize: "200ml Glass Bottle",
      doshaTag: "Pitta & Kapha Care (વાળ સંભાળ)",
    },
    shilajit: {
      id: "prod-shilajit",
      slug: "pure-himalayan-shilajit",
      name: "Pure Himalayan Shilajit Resin",
      subtitle: "Purified gold-grade mineral pitch with 75%+ fulvic acid",
      price: 1299,
      image: "/images/shilajit.jpg",
      packSize: "20g Jar with Brass Spoon",
      doshaTag: "Dhatu Rasayana (ધાતુ રસાયન)",
    },
    tulsi: {
      id: "prod-tulsi",
      slug: "holy-tulsi-drops",
      name: "Holy Tulsi Drops (Panch Tulsi)",
      subtitle: "Concentrated 5-tulsi extract for respiratory immunity",
      price: 299,
      image: "/images/tulsi.jpg",
      packSize: "30ml Dropper Bottle",
      doshaTag: "Kapha & Vata (કફ શામક)",
    },
    brahmi: {
      id: "prod-brahmi",
      slug: "brahmi-clarity-capsules",
      name: "Brahmi Memory & Focus Capsules",
      subtitle: "Cognitive calm, neural vitality & sharpened memory",
      price: 699,
      image: "/images/brahmi.jpg",
      packSize: "60 Veg Capsules",
      doshaTag: "Medhya Rasayana (મેધ્ય રસાયન)",
    },
  };

  const getProduct = (slugSub: string) => {
    const found = products.find((p) => p.slug.includes(slugSub));
    if (!found) return FALLBACK_CATALOG[slugSub] || null;
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

  const catalog = {
    ashwagandha: getProduct("ashwagandha"),
    triphala: getProduct("triphala"),
    chyawanprash: getProduct("chyawanprash"),
    kumkumadi: getProduct("kumkumadi"),
    bhringraj: getProduct("bhringraj"),
    tulsi: getProduct("tulsi"),
    brahmi: getProduct("brahmi"),
    shilajit: getProduct("shilajit"),
  };

  // 1. Check if Google Gemini API Key is available for real-time generative clinical intelligence
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiApiKey) {
    try {
      const geminiResponse = await callGeminiVaidya(query, history, catalog, geminiApiKey);
      if (geminiResponse) {
        return geminiResponse;
      }
    } catch (err) {
      console.warn("Gemini AI Vaidya API call failed, falling back to clinical engine:", err);
    }
  }

  // 2. Fallback: Deep Multi-Lingual Clinical Engine (Gujarati, Hindi, English)
  return runClinicalHeuristicEngine(query, queryLower, history, catalog);
}

// ------------------------------------------------------------------------------------------------
// 1. Google Gemini Live LLM Clinical Provider
// ------------------------------------------------------------------------------------------------
async function callGeminiVaidya(
  query: string,
  history: { role: "user" | "assistant"; content: string }[],
  catalog: Record<string, ReturnType<typeof getDoshaForProduct> extends string ? any : any>,
  apiKey: string
): Promise<VaidyaResponse | null> {
  const systemInstruction = `You are Acharya Vaidya Charak, the wise, compassionate, and deeply knowledgeable Chief Ayurvedic Physician at PranVeda Apothecary.

CRITICAL BEHAVIOR RULES:
1. LANGUAGE ADAPTABILITY (MANDATORY):
   - You MUST reply in the EXACT SAME LANGUAGE and dialect the user is using.
   - If the user writes in Gujarati (e.g. "મને પેટમાં બળતરા થાય છે", "ઊંઘ નથી આવતી") or Gujlish ("mane pet ma gas thay che", "ungh nathi aavti"), YOU MUST RESPOND IN NATURAL, FLUENT, RESPECTFUL GUJARATI.
   - If the user writes in Hindi or Hinglish, respond in warm, natural Hindi.
   - If the user writes in English, respond in English.
2. EMPATHETIC CONSULTATION & DIRECT PRANVEDA PRODUCT REMEDY:
   - Truly listen to the patient's complaint. Acknowledge their suffering with warmth, respect, and clinical validation.
   - Explain the root cause according to classical Ayurveda: Vata (વાત), Pitta (પિત્ત), or Kapha (કફ), Agni (જઠરાગ્નિ), or Ama (ટોક્સિન્સ/આમ).
   - CRITICAL REQUIREMENT: THE DEFINITIVE REMEDY / SOLUTION MUST BE PRANVEDA'S OWN AUTHENTIC PRODUCT (NOT kitchen tricks or domestic home recipes).
   - Prescribe PranVeda's exact Ayurvedic formulation as the targeted medicinal cure for their condition.
   - Detail the dosage, timing, and anupana (how and when to take it, e.g. 1 capsule with warm milk at bedtime, 1 spoon with warm water, etc., and recommended 21-45 days course).
   - Ask 1 gentle diagnostic follow-up question to understand their symptom history or duration.
3. AVAILABLE PRANVEDA FORMULATIONS (OUR PRODUCTS):
   * KSM-66 Ashwagandha Root Capsules: Best for stress, anxiety, restlessness, insomnia, nervous exhaustion, Vata pacification.
   * Pure Himalayan Shilajit Resin (16,000ft): Best for fatigue, weakness, lack of stamina, low energy, cellular recovery, Ojas building.
   * Organic Triphala Churna: Best for digestion, acidity, bloating, constipation, sluggish gut, Mandagni, and toxic waste (Ama) detox.
   * Kumkumadi Miraculous Facial Oil: Best for dull skin, dark spots, blemishes, pigmentation, sunburn, Pitta skin balance.
   * Bhringraj & Amla Hair Therapy Oil: Best for hair fall, premature thinning, dandruff, scalp heat, root nourishment.
   * Royal Saffron Chyawanprash: Best for daily immunity, respiratory strength, seasonal cough/cold, family vitality.
   * Brahmi Memory & Focus Capsules: Best for mental focus, memory retention, concentration, brain calmness.
   * Holy Tulsi Drops (Panch Tulsi): Best for seasonal immunity, sore throat, respiratory clearing.
4. TONE: Warm, dignified, respectful, serene, and deeply healing. Use clean markdown formatting with bold headers and bullet points.`;

  // Format history for Gemini contents
  const contents = history.slice(-6).map((h) => ({
    role: h.role === "assistant" ? "model" : "user",
    parts: [{ text: h.content }],
  }));
  contents.push({
    role: "user",
    parts: [{ text: query }],
  });

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      temperature: 0.65,
      maxOutputTokens: 800,
    },
  };

  // Try gemini-2.0-flash first, fallback to gemini-1.5-flash
  const models = ["gemini-2.0-flash", "gemini-1.5-flash"];
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        // Detect which products were mentioned to attach product preview cards
        const textLower = text.toLowerCase();
        const suggested: any[] = [];
        if (textLower.includes("ashwagandha") && catalog.ashwagandha) suggested.push(catalog.ashwagandha);
        if (textLower.includes("triphala") && catalog.triphala) suggested.push(catalog.triphala);
        if (textLower.includes("shilajit") && catalog.shilajit) suggested.push(catalog.shilajit);
        if (textLower.includes("kumkumadi") && catalog.kumkumadi) suggested.push(catalog.kumkumadi);
        if (textLower.includes("bhringraj") && catalog.bhringraj) suggested.push(catalog.bhringraj);
        if (textLower.includes("chyawanprash") && catalog.chyawanprash) suggested.push(catalog.chyawanprash);
        if (textLower.includes("brahmi") && catalog.brahmi) suggested.push(catalog.brahmi);
        if (textLower.includes("tulsi") && catalog.tulsi) suggested.push(catalog.tulsi);

        // Deduplicate and limit to 2
        const finalProducts = Array.from(new Set(suggested)).slice(0, 2);

        // Generate dynamic follow-ups based on language
        const isGujarati = /[\u0A80-\u0AFF]/.test(text) || /chhe|nathi|mane|chem|aave/i.test(query);
        const followUps = isGujarati
          ? [
              "આ ઉપાય કેટલા દિવસ સુધી કરવો જોઈએ?",
              "શું આ દવા સાથે દૂધ લઈ શકાય?",
              "આહારમાં મારે શું પરેજી રાખવી જોઈએ?",
            ]
          : [
              "How long should I follow this routine?",
              "Can I take this formulation with warm milk?",
              "What diet should I follow for my dosha?",
            ];

        return {
          message: text,
          suggestedProducts: finalProducts,
          followUps,
        };
      }
    }
  }

  return null;
}

// ------------------------------------------------------------------------------------------------
// 2. High-Precision Multi-Lingual Clinical Engine
// ------------------------------------------------------------------------------------------------
function runClinicalHeuristicEngine(
  rawQuery: string,
  query: string,
  history: { role: "user" | "assistant"; content: string }[],
  catalog: Record<string, any>
): VaidyaResponse {
  // Detect language
  const hasGujaratiChars = /[\u0A80-\u0AFF]/.test(rawQuery);
  const isGujlish = /(mane|maru|mara|nathi|aavti|aave|pet|ungh|ung|vichar|chinta|mathu|su|kevi|rite|pan|kem|che|chhe|bahu|joye|kaink|puchvu|dava|upay|upchar|khabar|pachhi|ha|na|kharva|kharse|thay|thayche|karu|batavo|aapo)/i.test(
    query
  );
  const isGujarati = hasGujaratiChars || isGujlish;

  const hasHindiChars = /[\u0900-\u097F]/.test(rawQuery);
  const isHinglish = /(mujhe|mera|meri|nahi|aati|aata|dard|kya|kaise|kare|karna|hoga|bhi|hai|hain|dawa|ilaj|neend|pet|jalan)/i.test(
    query
  );
  const isHindi = hasHindiChars || isHinglish;

  // 1. GREETING / PLEASANTRY
  if (
    /^(hi|hello|hey|namaste|kem cho|kemcho|pranam|ram ram|halo|namaskar|kem|halo re)\b/i.test(query) &&
    query.split(" ").length <= 4
  ) {
    if (isGujarati) {
      return {
        message: `🌿 **નમસ્તે! હું તમારો પ્રાણવેદ (PranVeda) આયુર્વેદિક વૈદ્ય છું.**

આયુર્વેદ અનુસાર સાચો ઇલાજ ત્યારે જ થાય જ્યારે રોગના મૂળ દોષ — **વાત (Vata), પિત્ત (Pitta), કે કફ (Kapha)** નું સાચું નિદાન થાય.

હું તમારી સમસ્યાને ધ્યાનથી સાંભળીને, શાસ્ત્રોક્ત કારણ સમજાવીને તેના માટેનું અમારું **સૌથી સચોટ આયુર્વેદિક ઔષધ (PranVeda Formulation)** અને તેની સેવન વિધિ જણાવીશ.

તમને હાલમાં કઈ સમસ્યા સતાવી રહી છે?
• **રાત્રે ઊંઘ ન આવવી, સ્ટ્રેસ કે ચિંતા?**
• **પેટમાં ગેસ, એસિડિટી, બળતરા કે કબજિયાત?**
• **વાળ ખરવા, પાતળા થવા કે ખોડો?**
• **ચહેરા પર કાળા ડાઘ, ખીલ કે ગ્લોનો અભાવ?**
• **શરીરમાં કમજોરી, થાક કે સ્ટેમિનાની કમી?**

તમારી સમસ્યા મને જણાવો, હું તેનું શ્રેષ્ઠ આયુર્વેદિક સમાધાન આપીશ.`,
        suggestedProducts: [],
        followUps: [
          "મને રાત્રે ઊંઘ નથી આવતી અને મગજમાં વિચારો ચાલે છે",
          "પેટમાં ગેસ અને એસિડિટી બહુ રહે છે",
          "વાળ બહુ ખરે છે, કોઈ સાચો ઉપાય આપો",
          "દિવસભર થાક અને અશક્તિ લાગે છે",
        ],
      };
    }

    if (isHindi) {
      return {
        message: `🌿 **नमस्ते! मैं आपका प्राणवेद (PranVeda) मुख्य आयुर्वेदिक वैद्य हूँ।**

आयुर्वेद के अनुसार हर शारीरिक समस्या का मूल आपके त्रिदोष — **वात, पित्त और कफ** के असंतुलन में होता है। मैं आपकी समस्या को विस्तार से समझकर उसके स्थायी उपचार हेतु हमारी सर्वोत्तम **प्राणवेद औषधियां (PranVeda Formulations)** और सेवन विधि बताऊंगा।

कृपया बताएं आप किस स्वास्थ्य समस्या का समाधान चाहते हैं?
• **नींद न आना, तनाव या बेचैनी?**
• **गैस, एसिडिटी, कब्ज या पाचन की कमजोरी?**
• **बालों का अत्यधिक झड़ना या डैंड्रफ?**
• **चेहरे पर दाग-धब्बे, झाइयां या चमक की कमी?**
• **दिनभर थकान, कमजोरी या स्टेमिना की कमी?**`,
        suggestedProducts: [],
        followUps: [
          "मुझे रात को नींद नहीं आती और बेचैनी रहती है",
          "पेट में जलन और गैस की समस्या रहती है",
          "बाल बहुत झड़ रहे हैं, सही उपाय बताएं",
          "शरीर में कमजोरी और थकान रहती है",
        ],
      };
    }

    return {
      message: `🌿 **Namaste! I am your PranVeda Chief Ayurvedic Vaidya.**

In classical Ayurveda, true healing occurs when we identify and rebalance the aggravated Dosha (**Vata, Pitta, or Kapha**) causing your symptoms. 

I am here to carefully assess your health concern and prescribe our authentic, lab-tested **PranVeda Ayurvedic Formulations** tailored specifically for your body.

What health concern are you experiencing today?
• **Restless sleep, anxiety, or racing thoughts?**
• **Acidity, chronic gas, bloating, or irregular gut?**
• **Hair fall, thinning, or scalp inflammation?**
• **Dark spots, blemishes, or dull complexion?**
• **Low energy, chronic fatigue, or depleted stamina?**`,
      suggestedProducts: [],
      followUps: [
        "I suffer from disturbed sleep & evening stress",
        "How do I cure chronic acidity & indigestion?",
        "What is the Ayurvedic cure for hair fall?",
        "How can I boost my daily stamina and immunity?",
      ],
    };
  }

  // 2. SLEEP / STRESS / ANXIETY / OVERTHINKING (વાત પ્રકોપ - Vata Imbalance)
  if (
    query.match(
      /(sleep|ungh|ung|insomnia|stress|anxiety|tension|chinta|overthinking|restless|mathu|vichar|dhyan|thakyo|neend|b बेचैनी|રાત્રે)/i
    )
  ) {
    if (isGujarati) {
      return {
        message: `🌿 **આયુર્વેદિક નિદાન: વાત દોષ પ્રકોપ (Vata Aggravation)**

તમારી તકલીફ હું બરાબર સમજી ગયો. આયુર્વેદ મુજબ જ્યારે શરીરમાં **વાત દોષ (વાયુ અને આકાશ તત્વ)** વધી જાય છે, ત્યારે મગજની ચેતાતંત્ર (Nervous system) અતિશય ઉત્તેજિત રહે છે. પરિણામે પથારીમાં પડ્યા પછી પણ મનમાં સતત વિચારો ચાલ્યા કરે છે અને ઊંડી ઊંઘ નથી આવતી.

### 🌿 શ્રેષ્ઠ આયુર્વેદિક ઉપચાર: **પ્રાણવેદ KSM-66 અશ્વગંધા રૂટ કેપ્સ્યુલ્સ**
આ સમસ્યાના કાયમી અને મૂળમાંથી ઉપચાર માટે અમારું **KSM-66 અશ્વગંધા** સર્વોત્તમ શાસ્ત્રોક્ત ઔષધ છે.
• **કેમ અસરકારક છે:** આ કોઈ ઊંઘની કેમિકલ દવા નથી. એ ૧૦૦% ઓર્ગેનિક એડપ્ટોજેન છે, જે શરીરમાં રાત્રે વધેલા સ્ટ્રેસ હોર્મોન (કોર્ટિસોલ) ને કુદરતી રીતે ઘટાડીને મગજને શાંત કરે છે અને કોઈ પણ આદત પડ્યા વગર ગહેરી પ્રાકૃતિક ઊંઘ (Deep REM Sleep) પાછી લાવે છે.

### 🍵 સેવન વિધિ & નિયમો (How to Take):
• **ડોઝ:** દરરોજ રાત્રે સૂવાના ૪૫ મિનિટ પહેલાં ૧ કેપ્સ્યુલ લો.
• **અનુપાન (With What):** ૧ કપ હૂંફાળા દૂધ સાથે (અથવા હૂંફાળા પાણી સાથે).
• **કોર્સ:** ૨૧ થી ૪૫ દિવસનો નિયમિત કોર્સ કરવાથી વાત દોષ સંપૂર્ણ શાંત થઈ જાય છે અને મન સ્થિર બને છે.

**પ્રશ્ન:** શું તમને આ સમસ્યા કેટલા સમયથી છે, અને શું સાથે માથાનો દુખાવો કે અસ્વસ્થતા પણ રહે છે?`,
        suggestedProducts: catalog.ashwagandha ? [catalog.ashwagandha] : [],
        followUps: [
          "અશ્વગંધા રાત્રે દૂધ સાથે કેવી રીતે લેવી?",
          "આ ઉપાયનું પરિણામ કેટલા દિવસમાં દેખાશે?",
          "શું અશ્વગંધાની કોઈ આદત પડે ખરી?",
        ],
      };
    }

    if (isHindi) {
      return {
        message: `🌿 **आयुर्वेदिक निदान: वात दोष असंतुलन (Vata Aggravation)**

आपकी समस्या को मैंने ध्यान से समझा। आयुर्वेद के अनुसार जब शरीर में **वात दोष** बढ़ जाता है, तो मस्तिष्क और तंत्रिका तंत्र शांत नहीं हो पाते। इसी वजह से रात को करवटें बदलते रहना और विचारों का चक्र चलता रहता है।

### 🌿 सर्वोत्तम आयुर्वेदिक उपचार: **प्राणवेद KSM-66 अश्वगंधा रूट कैप्सूल्स**
इस समस्या के स्थायी और सुरक्षित समाधान हेतु हमारा **KSM-66 अश्वगंधा** सबसे प्रामाणिक औषधि है।
• **यह कैसे काम करता है:** यह 100% शुद्ध ऑर्गेनिक एडाप्टोजेन है, जो तनाव बढ़ाने वाले हार्मोन (कोर्टिसोल) को घटाता है और बिना किसी लत (Habit) के प्राकृतिक गहरी नींद बहाल करता है।

### 🍵 सेवन विधि (How to Take):
• **खुराक:** रोज रात को सोने से 45 मिनट पहले 1 कैप्सूल।
• **अनुपान:** 1 कप गुनगुने दूध या गुनगुने पानी के साथ।
• **अवधि:** 21 से 45 दिनों का नियमित कोर्स करने से वात शांत होकर मानसिक शांति मिलती है।

**मेरा सवाल:** क्या आपको यह समस्या काफी समय से है, या हाल ही में किसी तनाव की वजह से शुरू हुई है?`,
        suggestedProducts: catalog.ashwagandha ? [catalog.ashwagandha] : [],
        followUps: [
          "अश्वगंधा लेने का सही समय और तरीका क्या है?",
          "क्या इसकी आदत पड़ जाती है?",
        ],
      };
    }

    return {
      message: `🌿 **Ayurvedic Clinical Assessment: Aggravated Vata Dosha**

I understand your concern clearly. In classical Ayurveda, insomnia and racing nighttime thoughts are driven by an aggravated **Vata Dosha** (air & ether elements) hyper-stimulating the central nervous system.

### 🌿 Targeted Medicinal Treatment: **PranVeda KSM-66 Ashwagandha Root Capsules**
The definitive classical solution to pacify Vata and permanently restore nocturnal neuro-restoration is our **KSM-66 Ashwagandha**.
• **Mechanism of Action:** Unlike pharmaceutical sedatives, this gold-standard organic adaptogen down-regulates elevated evening cortisol, rebuilds adrenal resilience, and restores natural restorative deep REM sleep cycles with zero habit formation.

### 🍵 Prescribed Dosage & Anupana:
• **Dosage:** Take 1 veg capsule nightly, 45 minutes before bedtime.
• **Anupana (Vehicle):** With 1 cup of warm cow's milk (or warm water).
• **Protocol Duration:** Recommended 21 to 45-day cycle for lasting neurological tranquility.

**Diagnostic Follow-up:** How long have you experienced this restless sleep, and is it accompanied by daytime fatigue or digestive dryness?`,
      suggestedProducts: catalog.ashwagandha ? [catalog.ashwagandha] : [],
      followUps: [
        "How should I take Ashwagandha with warm milk?",
        "How quickly will I notice deeper sleep?",
        "Is KSM-66 Ashwagandha habit-forming?",
      ],
    };
  }

  // 3. DIGESTION / ACIDITY / GAS / CONSTIPATION (પિત્ત & મંદાગ્નિ - Pitta & Mandagni)
  if (
    query.match(
      /(digest|acidity|gas|kabj|kabjiyaat|jalan|burning|pet|stomach|bloat|sour|acid|gut|motion|bavasir|apcho|khata|dhavan)/i
    )
  ) {
    if (isGujarati) {
      return {
        message: `🔥 **આયુર્વેદિક નિદાન: મંદાગ્નિ અને પિત્ત/વાત અસંતુલન**

ચરક સંહિતા અનુસાર, પેટની પાચન અગ્નિ (**જઠરાગ્નિ**) મંદ પડવાથી ખોરાકનું યોગ્ય પાચન થતું નથી અને આંતરડામાં ઝેરી તત્વો (**આમ - Ama**) જમા થાય છે.
• છાતી-ગળામાં બળતરા એટલે **પિત્ત દોષ (Pitta)** વધવો.
• પેટ ફૂલવું, ગેસ થવો અને કબજિયાત એટલે **અપાન વાત (Apana Vata)** અટકી જવો.

### 🌿 સર્વોત્તમ આયુર્વેદિક ઉપચાર: **પ્રાણવેદ ઓર્ગેનિક ત્રિફળા ચૂર્ણ**
પેટ અને પાચનની તમામ તકલીફોના મૂળિયાં સાફ કરવા માટે અમારું **ઓર્ગેનિક ત્રિફળા ચૂર્ણ** રામબાણ ઔષધ છે.
• **કેમ અસરકારક છે:** હરડે, બહેડા અને આમળાનું પ્રમાણિત સમપ્રમાણ મિશ્રણ આંતરડાની અંદર જામેલા જૂના મળ અને ટોક્સિન્સ (આમ) ને હળવાશથી બહાર કાઢે છે, આંતરડાની કુદરતી ગતિશીલતા વધારે છે અને પિત્ત-એસિડિટીને મૂળમાંથી શાંત કરે છે.

### 🍵 સેવન વિધિ & નિયમો (How to Take):
• **ડોઝ:** દરરોજ રાત્રે સૂતા પહેલાં ૧ નાની ચમચી (૩ થી ૫ ગ્રામ) ચૂર્ણ.
• **અનુપાન (With What):** ૧ ગ્લાસ નવશેકા ગરમ પાણી સાથે.
• **કોર્સ:** ૩૦ દિવસ સુધી નિયમિત લેવાથી સવારે એક જ વારમાં પેટ સાફ આવશે અને ગેસ-એસિડિટી કાયમ માટે બંધ થશે.

**પ્રશ્ન:** શું તમને સવારે પેટ સાફ કરવામાં તકલીફ પડે છે, કે જમ્યા પછી તરત ભારેપણું અને ખાટા ઓડકાર આવે છે?`,
        suggestedProducts: catalog.triphala ? [catalog.triphala] : [],
        followUps: [
          "ત્રિફળા ચૂર્ણ રાત્રે ગરમ પાણી સાથે કેવી રીતે લેવું?",
          "શું ત્રિફળાની આદત પડી જાય ખરી?",
          "એસિડિટી મટાડવા કેટલા દિવસ ત્રિફળા લેવું પડે?",
        ],
      };
    }

    if (isHindi) {
      return {
        message: `🔥 **आयुर्वेदिक निदान: मंदाग्नि और पित्त दोष (Digestive Fire Imbalance)**

पेट में गैस, एसिडिटी और भारीपन का मुख्य कारण पाचन अग्नि (**जठराग्नि**) का कमजोर होना है, जिससे आंतों में अपचित विषैले तत्व (**'आम' - Ama**) जमा होने लगते हैं।

### 🌿 अचूक आयुर्वेदिक उपचार: **प्राणवेद ऑर्गेनिक त्रिफला चूर्ण**
पाचन तंत्र को मजबूत करने और आंतों की पूर्ण शुद्धि हेतु हमारा **ऑर्गेनिक त्रिफला चूर्ण** सबसे उत्तम औषधि है।
• **यह कैसे काम करता है:** हरड़, बहेड़ा और आंवला का यह शास्त्रीय योग आंतों की अंदरूनी परतों को पोषण देता है, जमे हुए टॉक्सिन्स को बाहर निकालता है और एसिडिटी को जड़ से शांत करता है।

### 🍵 सेवन विधि (How to Take):
• **खुराक:** रोज रात को सोने से पहले 1 चम्मच (3-5 ग्राम)।
• **अनुपान:** 1 गिलास गुनगुने पानी के साथ।
• **अवधि:** 30 दिन का नियमित कोर्स सुबह पेट को बिल्कुल साफ और हल्का बना देता है।

**मेरा सवाल:** क्या आपको एसिडिटी खट्टे डकार के साथ होती है, या पेट में भारीपन और कब्ज ज्यादा रहता है?`,
        suggestedProducts: catalog.triphala ? [catalog.triphala] : [],
        followUps: [
          "त्रिफला लेने का सही तरीका क्या है?",
          "क्या त्रिफला से एसिडिटी हमेशा के लिए खत्म हो जाती है?",
        ],
      };
    }

    return {
      message: `🔥 **Ayurvedic Clinical Assessment: Mandagni & Pitta/Ama Accumulation**

In classical Ayurveda, chronic indigestion, acid reflux, and bloating originate from impaired **Jatharagni** (digestive fire), allowing toxic metabolic waste (**Ama**) to accumulate in the GI tract.

### 🌿 Targeted Medicinal Treatment: **PranVeda Organic Triphala Churna**
The definitive Vedic solution for complete gastrointestinal rejuvenation is our **Organic Triphala Churna**.
• **Mechanism of Action:** Formulated with cold-processed Haritaki, Bibhitaki, and Amla, it gently detoxifies stagnant Ama from the intestinal villi, stimulates bile secretion, neutralizes excess gastric Pitta heat, and regulates bowel peristalsis without dependency.

### 🍵 Prescribed Dosage & Anupana:
• **Dosage:** 1 teaspoon (3–5g) taken 30 minutes before bedtime.
• **Anupana (Vehicle):** Dissolved in 1 cup of warm water.
• **Protocol Duration:** 30–45 days for complete intestinal restoration and acid elimination.

**Diagnostic Follow-up:** Do you primarily suffer from burning heartburn after meals, or chronic sluggish bowels and morning bloating?`,
      suggestedProducts: catalog.triphala ? [catalog.triphala] : [],
      followUps: [
        "How to take Triphala churna with warm water?",
        "Is Triphala safe for daily long-term use?",
        "Does Triphala permanently cure acid reflux?",
      ],
    };
  }

  // 4. HAIR FALL / SCALP / DANDRUFF (કેશ & અસ્થિ ધાતુ - Hair Root Therapy)
  if (
    query.match(
      /(hair|fall|bal|dandruff|scalp|kharta|khare|thinning|regrowth|safed|champi|bhringraj|amla|ખોડો|વાળ)/i
    )
  ) {
    if (isGujarati) {
      return {
        message: `💆 **આયુર્વેદિક નિદાન: ખોપરીમાં પિત્ત ગરમી અને અસ્થિ ધાતુ પોષણનો અભાવ**

આયુર્વેદ અનુસાર વાળ (**કેશ**) એ અસ્થિ ધાતુનો ઉપધાતુ છે. જ્યારે શરીરમાં માનસિક ચિંતા કે પિત્ત દોષની ગરમી વધે છે, ત્યારે એ ગરમી સીધી ખોપરી (Scalp) ના મૂળમાં જઈને વાળના મૂળ નિર્બળ બનાવી દે છે, જેથી વાળ ખરવા લાગે છે.

### 🌿 સર્વોત્તમ આયુર્વેદિક ઉપચાર: **પ્રાણવેદ ભૃંગરાજ અને આમળા હેર થેરાપી ઓઈલ**
વાળ ખરતા તાત્કાલિક રોકવા અને નવા વાળના મૂળ મજબૂત કરવા માટે અમારું **ભૃંગરાજ અને આમળા હેર ઓઈલ** શ્રેષ્ઠ શાસ્ત્રોક્ત ઉપાય છે.
• **કેમ અસરકારક છે:** શાસ્ત્રોમાં ભૃંગરાજને 'કેશરાજ' કહ્યો છે. પ્રાચીન ક્ષીરપાક વિધિથી ૧૮ કલાક સુધી ધીમી આંચે ઉકાળીને બનાવેલું આ તેલ ખોપરીની વધારાની ગરમી (Pitta) ને તરત ઠંડી પાડે છે અને વાળના મૂળિયાં સુધી જઈને રક્ત સંચાર વધારે છે.

### 💆 ઉપયોગ વિધિ (How to Apply):
• **રીત:** તેલને સહેજ હૂંફાળું કરીને આંગળીઓના ટેરવાથી વાળના મૂળમાં ૧૦ મિનિટ ગોળાકાર હળવી માલિશ કરો.
• **સમય:** અઠવાડિયામાં ૨ થી ૩ વાર રાત્રે લગાવીને રાખી શકાય અથવા સ્નાન કરવાના ૧ કલાક પહેલાં લગાવો.
• **પરિણામ:** ૧૫ થી ૨૧ દિવસમાં વાળનું અકાળે ખરવું નિયંત્રણમાં આવી જાય છે.

**પ્રશ્ન:** શું તમારા વાળ મૂળમાંથી ખરે છે કે વચ્ચેથી તૂટે છે? સાથે ખોડો કે ખંજવાળ પણ રહે છે?`,
        suggestedProducts: catalog.bhringraj ? [catalog.bhringraj] : [],
        followUps: [
          "ભૃંગરાજ તેલ અઠવાડિયામાં કેટલી વાર લગાવવું જોઈએ?",
          "વાળ ખરતા રોકવા માટે પરિણામ કેટલા દિવસમાં મળશે?",
        ],
      };
    }

    if (isHindi) {
      return {
        message: `💆 **आयुर्वेदिक निदान: अस्थि धातु पोषण और स्कैल्प में पित्त गर्मी**

बालों का अचानक झड़ना स्कैल्प की जड़ों में पित्त की अत्यधिक गर्मी और पोषण की कमी के कारण होता है।

### 🌿 अचूक आयुर्वेदिक उपचार: **प्राणवेद भृंगराज और आंवला हेयर थेरेपी ऑयल**
बालों का गिरना रोककर जड़ों को पुनर्जीवित करने हेतु हमारा **भृंगराज और आंवला हेयर ऑयल** सर्वोपरि शास्त्रीय उपचार है।
• **यह कैसे काम करता है:** 18 घंटे की क्षीरपाक विधि से सिद्ध यह तेल सिर की अतिरिक्त गर्मी को शांत करता है और बालों के रोमछिद्रों (Follicles) को गहरा पोषण देकर जड़ों को मजबूत करता है।

### 💆 प्रयोग विधि (How to Apply):
• **तरीका:** तेल को हल्का गुनगुना करके अंगुलियों के पोरों से 10 मिनट तक सिर की जड़ों में धीरे-धीरे मसाज करें।
• **समय:** सप्ताह में 2 से 3 बार रात को लगाकर सोएं या नहाने से 1 घंटा पहले लगाएं।

**मेरा सवाल:** क्या बालों के साथ आपको डैंड्रफ या स्कैल्प में खुजली की समस्या भी है?`,
        suggestedProducts: catalog.bhringraj ? [catalog.bhringraj] : [],
        followUps: [
          "भृंगराज तेल लगाने का सही तरीका क्या है?",
          "कितने समय में बाल झड़ना बंद होते हैं?",
        ],
      };
    }

    return {
      message: `💆 **Ayurvedic Clinical Assessment: Asthi Dhatu & Scalp Pitta Heat**

In classical Ayurveda, hair (*Kesha*) is the tissue byproduct of **Asthi Dhatu** (bone matrix) and is highly sensitive to excess cranial heat (**Pitta**). When stress or heat drives Pitta upward, hair follicles shrink, leading to acute shedding and thinning.

### 🌿 Targeted Medicinal Treatment: **PranVeda Bhringraj & Amla Hair Therapy Oil**
The definitive botanical remedy for root regeneration is our **Bhringraj & Amla Hair Oil**.
• **Mechanism of Action:** Hand-crafted using the authentic 18-hour *Kshirapaka* slow-decoction process with wild Bhringraj ("King of Hair") and cold-pressed Amla, it cools inflammatory Pitta heat in the scalp, reactivates dormant hair follicles, and reinforces root tensile strength.

### 💆 Prescribed Application Protocol:
• **Application:** Warm the oil slightly; gently massage into scalp roots using circular finger movements for 10 minutes.
• **Frequency:** Apply 2–3 times per week overnight, or 1 hour prior to bathing.
• **Results:** Noticeable reduction in shedding within 15–21 days of disciplined application.

**Diagnostic Follow-up:** Is the hair loss accompanied by dry dandruff, scalp redness, or brittle hair breakage?`,
      suggestedProducts: catalog.bhringraj ? [catalog.bhringraj] : [],
      followUps: [
        "How many times a week should I apply Bhringraj oil?",
        "Does Bhringraj help reverse early thinning?",
      ],
    };
  }

  // 5. SKIN GLOW / PIGMENTATION / ACNE (રક્ત ધાતુ & ભ્રાજક પિત્ત - Radiant Skin)
  if (
    query.match(
      /(skin|glow|chehra|face|pigmentation|dark spot|blemish|acne|khil|dull|radiance|kesar|saffron|chhero|કાળા ડાઘ|ખીલ|ત્વચા)/i
    )
  ) {
    if (isGujarati) {
      return {
        message: `✨ **આયુર્વેદિક નિદાન: રક્ત ધાતુ અને ભ્રાજક પિત્ત અસંતુલન**

આયુર્વેદ અનુસાર ચહેરાની ચમક એ તમારા **રક્ત ધાતુ (લોહી)** અને **ભ્રાજક પિત્ત** ના સંતુલન પર આધાર રાખે છે. કેમિકલ ક્રીમોથી માત્ર ઉપરછલ્લો દેખાવ સુધરે છે, જ્યારે અસલી આયુર્વેદિક તેલ ત્વચાના ૭ સ્તરો સુધી જઈને કોષોનું સમારકામ કરે છે.

### 🌿 અમૃતતુલ્ય ઉપચાર: **પ્રાણવેદ કુંકુમાદિ મિરેક્યુલસ ફેશિયલ ઓઇલ**
ચહેરા પરના ડાઘ, ખીલના નિશાન, ટેનિંગ દૂર કરવા અને સોના જેવો કુદરતી નિખાર લાવવા માટે અમારું **કુંકુમાદિ તેલમ** સર્વોચ્ચ ઔષધ છે.
• **કેમ અસરકારક છે:** અષ્ટાગ હૃદયમ્ પદ્ધતિથી ૧૦૦% શુદ્ધ કાશ્મીરી કેસર (સૅફ્રોન), લાલ ચંદન, મંજિષ્ઠા અને બકરીના દૂધ સાથે ૨૧ દુર્લભ જડીબુટ્ટીઓથી સિદ્ધ કરેલું આ તેલ ત્વચાના મેલાનિનને સંતુલિત કરે છે અને ચહેરાને તેજસ્વી બનાવે છે.

### ✨ ઉપયોગ વિધિ (How to Apply):
• **રીત:** રાત્રે ચહેરો તાજા પાણીથી ધોઈને સહેજ ભીની ત્વચા પર ૩ થી ૪ ટીપાં હથેળીમાં ઘસીને હળવા હાથે ચહેરા અને ગરદન પર દબાવો.
• **સમય:** દરરોજ રાત્રે સૂતા પહેલાં લગાવીને આખી રાત રહેવા દો.
• **કોર્સ:** માત્ર ૧૪ થી ૨૧ દિવસમાં ચહેરા પર કુદરતી ચમક (Golden Glow) સ્પષ્ટ દેખાવા લાગે છે.

**પ્રશ્ન:** તમારી ત્વચા સામાન્ય રીતે સૂકી (Dry) રહે છે કે ચીકણી (Oily)?`,
        suggestedProducts: catalog.kumkumadi ? [catalog.kumkumadi] : [],
        followUps: [
          "કુંકુમાદિ ઓઇલ કેટલા ટીપાં વાપરવું જોઈએ?",
          "શું ઓઇલી સ્કિન પર કુંકુમાદિ તેલ લગાવી શકાય?",
        ],
      };
    }

    if (isHindi) {
      return {
        message: `✨ **आयुर्वेदिक निदान: रक्त धातु और भ्राजक पित्त की शुद्धि**

चेहरे पर दाग-धब्बे, झाइयां और बेजान त्वचा रक्त में पित्त की अधिकता का परिणाम होती हैं।

### 🌿 अमृतोपम आयुर्वेदिक उपचार: **प्राणवेद कुंकुमादि मिरैकुलस फेशियल ऑयल**
त्वचा के दाग-धब्बे हटाकर प्राकृतिक स्वर्णिम कांति पाने हेतु हमारा **कुंकुमादि तैलम** सर्वश्रेष्ठ औषधि है।
• **यह कैसे काम करता है:** असली कश्मीरी केसर, लाल चंदन और 21 दुर्लभ औषधियों से निर्मित यह तेल त्वचा की गहराई में जाकर मेलेनिन को संतुलित करता है और बिना किसी केमिकल के प्राकृतिक चमक देता है।

### ✨ प्रयोग विधि (How to Apply):
• **तरीका:** रात को चेहरा धोकर हल्की नम त्वचा पर 3-4 बूंदें धीरे-धीरे चेहरे और गर्दन पर लगाएं।
• **समय:** रोज रात को सोने से पहले।
• **परिणाम:** 14 से 21 दिनों में त्वचा पर स्पष्ट निखार और दाग-धब्बे हल्के होने लगते हैं।

**मेरा सवाल:** आपकी त्वचा तैलीय (Oily) है या रूखी (Dry)?`,
        suggestedProducts: catalog.kumkumadi ? [catalog.kumkumadi] : [],
        followUps: [
          "कुंकुमादि तेल लगाने का सही समय क्या है?",
          "क्या इसे ऑयली स्किन पर लगा सकते हैं?",
        ],
      };
    }

    return {
      message: `✨ **Ayurvedic Assessment: Rakta Dhatu & Bhrajaka Pitta Radiance**

In Ayurveda, skin radiance is determined by the purity of **Rakta Dhatu** (blood plasma) and balanced **Bhrajaka Pitta** in the dermal layers. Synthetic creams only coat the exterior, whereas pure classical tailams permeate the 7 cellular layers of the epidermis.

### 🌿 Targeted Medicinal Treatment: **PranVeda Kumkumadi Miraculous Facial Oil**
The crowned elixir for pigment correction and luminous glow is our **Kumkumadi Tailam**.
• **Mechanism of Action:** Formulated according to the classical *Ashtanga Hridaya* treatise with certified Grade-1 Kashmiri Saffron, Red Sandalwood, and 21 wild botanicals infused in pure goat's milk, it dissolves hyperpigmentation, restores microcirculation, and delivers an authentic golden glow.

### ✨ Prescribed Application Protocol:
• **Application:** Cleanse face thoroughly with lukewarm water. While skin is slightly damp, press 3–4 drops into face and neck using upward strokes.
• **Timing:** Apply nightly before bedtime and leave on overnight.
• **Protocol Duration:** Visible skin tone evenness and radiance within 14–21 days.

**Diagnostic Follow-up:** Is your facial skin naturally dry, combination, or prone to active oiliness and cystic breakouts?`,
      suggestedProducts: catalog.kumkumadi ? [catalog.kumkumadi] : [],
      followUps: [
        "How many drops of Kumkumadi oil should I use?",
        "Can I use Kumkumadi oil on acne-prone skin?",
      ],
    };
  }

  // 6. ENERGY / WEAKNESS / STAMINA / VITALITY (ઓજસ ક્ષય - Vital Energy)
  if (
    query.match(
      /(energy|stamina|weakness|fatigue|shakti|power|exhaust|tired|thakav|shilajit|vitality|ojas|gym|workout|કમજોરી|થાક|અશક્તિ)/i
    )
  ) {
    if (isGujarati) {
      return {
        message: `⚡ **આયુર્વેદિક નિદાન: ઓજસ ક્ષય અને સપ્ત ધાતુ પોષણનો અભાવ**

આયુર્વેદમાં **ઓજસ (Ojas)** એ શરીરની તમામ સાત ધાતુઓનો પરમ સાર છે. જ્યારે દોડધામ, સ્ટ્રેસ કે માનસિક થાકથી ઓજસ ઓછું થાય છે, ત્યારે આખો દિવસ સુસ્તી, કમજોરી અને સ્ટેમિનાનો અભાવ લાગે છે.

### 🌿 પરમ રસાયણ ઉપચાર: **પ્રાણવેદ પ્યોર હિમાલયન શિલાજીત રેઝિન (16,000ft)**
શરીરની નબળાઈને જડમૂળથી દૂર કરવા અને અખૂટ શક્તિ-સ્ટેમિના પાછો મેળવવા માટે અમારું **ગોલ્ડ-ગ્રેડ હિમાલયન શિલાજીત** સૌથી શક્તિશાળી ઉપાય છે.
• **કેમ અસરકારક છે:** ૧૬,૦૦૦ ફૂટ હિમાલયના શિખરો પરથી મેળવેલું શુદ્ધ શિલાજીત ૭૫%+ ફુલ્વિક એસિડ અને ૮૪+ આયનિક મિનરલ્સ ધરાવે છે. એ સીધું સેલ્યુલર માઇટોકોન્ડ્રિયામાં જઈને કુદરતી ઊર્જા (ATP) બનાવે છે અને શરીરની અશક્તિ દૂર કરે છે.

### 🍵 સેવન વિધિ & નિયમો (How to Take):
• **ડોઝ:** મગના દાણા જેટલું (૨૫૦-૩૦૦ મિ.ગ્રા.) સાથે આપેલી પિત્તળની ચમચીથી લો.
• **અનુપાન (With What):** સવારે નરણા કોઠે (Empty Stomach) ૧ કપ હૂંફાળા દૂધ અથવા ગરમ પાણીમાં ઓગાળીને પીવો.
• **કોર્સ:** ૬૦ થી ૯૦ દિવસનો કોર્સ કરવાથી શરીરમાં ભરપૂર તાકાત અને સદાબહાર સ્ફૂર્તિ રહે છે.

**પ્રશ્ન:** શું તમને સવારે ઊઠતાં જ થાક લાગે છે, કે દિવસ દરમિયાન કામ કરતાં એનર્જી ઘટી જાય છે?`,
        suggestedProducts: catalog.shilajit ? [catalog.shilajit] : [],
        followUps: [
          "શિલાજીત લેવાની સાચી રીત અને સમય કયો છે?",
          "શિલાજીત કેટલા મહિના સુધી ચાલુ રાખી શકાય?",
          "શું શિલાજીત દૂધ સાથે જ લેવું જરૂરી છે?",
        ],
      };
    }

    if (isHindi) {
      return {
        message: `⚡ **आयुर्वेदिक निदान: ओजस क्षय और धातु दुर्बलता**

शारीरिक व मानसिक थकान का मुख्य कारण शरीर में **ओजस (प्राकृतिक जीवनी शक्ति)** की कमी होना है।

### 🌿 परम रसायन उपचार: **प्राणवेद प्योर हिमालयन शिलाजीत रेजिन (16,000ft)**
कमजोरी को जड़ से खत्म कर फौलादी स्टेमिना और ऊर्जा पाने हेतु हमारा **गोल्ड-ग्रेड शिलाजीत रेजिन** अद्वितीय औषधि है।
• **यह कैसे काम करता है:** 16,000 फीट हिमालय की चोटियों से निकाला गया यह शिलाजीत 75%+ फुल्विक एसिड और 84+ खनिजों से भरपूर है, जो कोशिकाओं में सीधी ऊर्जा (ATP) का संचार करता है।

### 🍵 सेवन विधि (How to Take):
• **खुराक:** मटर के दाने जितना (250-300mg) पीतल की चम्मच से।
• **अनुपान:** सुबह खाली पेट 1 कप गुनगुने दूध या गुनगुने पानी में घोलकर पिएं।
• **अवधि:** 60 से 90 दिनों का नियमित सेवन शरीर को पूर्ण शक्तिशाली और ऊर्जावान बना देता है।

**मेरा सवाल:** क्या आपको सुबह उठते ही थकान महसूस होती है, या दिनभर काम के बाद ऊर्जा कम हो जाती है?`,
        suggestedProducts: catalog.shilajit ? [catalog.shilajit] : [],
        followUps: [
          "शिलाजीत लेने का सही समय और तरीका क्या है?",
          "शिलाजीत का असर कितने दिनों में दिखता है?",
        ],
      };
    }

    return {
      message: `⚡ **Ayurvedic Assessment: Ojas Depletion & Cellular Exhaustion**

In classical Ayurveda, enduring physical stamina and mental vigor stem from **Ojas** (the supreme essence of all seven bodily dhatus). When Ojas is depleted by chronic work stress and oxidative load, profound cellular fatigue sets in.

### 🌿 Targeted Medicinal Treatment: **PranVeda Pure Himalayan Shilajit Resin (16,000ft)**
The premier Ayurvedic Rasayana for cellular rejuvenation and peak physical stamina is our **Purified Himalayan Shilajit Resin**.
• **Mechanism of Action:** Ethically sourced at 16,000ft altitude and lab-purified with gold standards, it delivers >75% Fulvic Acid and 84+ ionic trace minerals directly into cellular mitochondria to boost natural ATP energy production and combat debility.

### 🍵 Prescribed Dosage & Anupana:
• **Dosage:** A pea-sized portion (250–300mg) measured with the provided brass spoon.
• **Anupana (Vehicle):** Dissolved in 1 cup of lukewarm milk or water in the morning on an empty stomach.
• **Protocol Duration:** 60–90 days for peak physical endurance, cellular recovery, and vitality.

**Diagnostic Follow-up:** Do you feel lethargic upon waking in the morning, or does your energy crash midway through the afternoon?`,
      suggestedProducts: catalog.shilajit ? [catalog.shilajit] : [],
      followUps: [
        "How to consume Shilajit correctly with warm water or milk?",
        "When is the best time of day to take Shilajit?",
        "For how many months can I safely take Shilajit?",
      ],
    };
  }

  // 7. SPECIFIC USAGE / DOSAGE / HOW TO TAKE (કેવી રીતે લેવું / રીત)
  if (
    query.match(
      /(how to take|dosage|kevi rite|rite levu|doodh sathe|pani sathe|dose|side effect|kaise le|kab le|nuksan)/i
    )
  ) {
    if (isGujarati) {
      return {
        message: `🌿 **પ્રાણવેદ ઔષધિ સેવન વિધિ & અનુપાન ગાઈડ:**

આયુર્વેદમાં ઔષધિનું સંપૂર્ણ પરિણામ મેળવવા માટે તેના **અનુપાન (જેની સાથે લેવાય છે)** નું સૌથી મોટું મહત્વ છે:

| પ્રાણવેદ ઔષધિ | સેવનનો શ્રેષ્ઠ સમય | સાચું અનુપાન |
| :--- | :--- | :--- |
| **KSM-66 અશ્વગંધા** | રાત્રે સૂવાના ૪૫ મિનિટ પહેલાં | ૧ કપ હૂંફાળું દૂધ (અથવા પાણી) |
| **ઓર્ગેનિક ત્રિફળા ચૂર્ણ** | રાત્રે સૂતા પહેલાં | ૧ ગ્લાસ નવશેકું ગરમ પાણી |
| **પ્યોર હિમાલયન શિલાજીત** | સવારે નરણા કોઠે (Empty Stomach) | હૂંફાળું દૂધ અથવા ગરમ પાણી |
| **કુંકુમાદિ ફેશિયલ ઓઇલ** | રાત્રે સૂતા પહેલાં | સહેજ ભીની ત્વચા પર ૩–૪ ટીપાં |
| **ભૃંગરાજ હેર ઓઇલ** | અઠવાડિયામાં ૨-૩ વાર રાત્રે | હૂંફાળું કરીને મૂળમાં ૧૦ મિનિટ માલિશ |
| **રોયલ કેસર ચ્યવનપ્રાશ** | સવારે નરણા કોઠે | ૧ ચમચી હૂંફાળા દૂધ સાથે |

તમારે આમાંથી કઈ ઔષધિ શરૂ કરવી છે?`,
        suggestedProducts: [],
        followUps: [
          "અશ્વગંધા શું પાણી સાથે લઈ શકાય?",
          "શિલાજીત કેટલા મહિના સુધી ચાલુ રાખી શકાય?",
          "ત્રિફળા ચૂર્ણ રોજ લેવાય?",
        ],
      };
    }

    return {
      message: `🌿 **PranVeda Anupana & Dosage Protocol Guide:**

In classical Ayurveda, the vehicle (*Anupana*) with which you take an herb carries the botanical phytochemicals deep into the target tissue (*Dhatus*):

| Formulation | Best Time | Prescribed Anupana |
| :--- | :--- | :--- |
| **KSM-66 Ashwagandha** | 45m before sleep | 1 cup warm milk (or warm water) |
| **Organic Triphala Churna** | Night before bed | 1 cup lukewarm water |
| **Himalayan Shilajit Resin** | Morning on empty stomach | Warm milk or warm water |
| **Kumkumadi Facial Oil** | Night before sleep | 3–4 drops on clean, damp skin |
| **Bhringraj Hair Oil** | 2–3 times a week | Warm oil, 10m gentle root massage |
| **Royal Chyawanprash** | Morning empty stomach | 1 teaspoon with warm milk |

Which specific formulation would you like dosage guidance on?`,
      suggestedProducts: [],
      followUps: [
        "Can I take Ashwagandha with warm water instead of milk?",
        "For how many months can I continue Shilajit?",
        "Can Triphala be taken every day?",
      ],
    };
  }

  // 8. GENERAL / DEFAULT AYURVEDIC GUIDANCE
  if (isGujarati) {
    return {
      message: `🌿 **નમસ્તે! હું તમારી સમસ્યા સમજવા માટે સંપૂર્ણ તૈયાર છું.**

આયુર્વેદમાં દરેક સમસ્યાના કાયમી ઉકેલ માટે તેના મૂળ દોષ (વાત, પિત્ત, કફ) ને સમજવો જરૂરી છે.

તમને નીચેનામાંથી કઈ સમસ્યાનો આયુર્વેદિક ઉપચાર જોઈએ છે?
1. **ઊંઘ ન આવવી, માનસિક તણાવ કે ચિંતા?** (ઉપાય: પ્રાણવેદ KSM-66 અશ્વગંધા)
2. **ગેસ, એસિડિટી, અપચો કે પેટ સાફ ન થવું?** (ઉપાય: પ્રાણવેદ ઓર્ગેનિક ત્રિફળા ચૂર્ણ)
3. **વાળ ખરવા, પાતળા થવા કે માથાની ગરમી?** (ઉપાય: પ્રાણવેદ ભૃંગરાજ & આમળા હેર ઓઈલ)
4. **ચહેરા પર ડાઘ, ખીલ કે ગ્લોનો અભાવ?** (ઉપાય: પ્રાણવેદ કુંકુમાદિ ફેશિયલ ઓઇલ)
5. **શરીરમાં થાક, નબળાઈ કે સ્ટેમિનાની કમી?** (ઉપાય: પ્રાણવેદ હિમાલયન શિલાજીત રેઝિન)

તમારા લક્ષણો મને જણાવો, હું તમને યોગ્ય ઔષધ અને સેવન વિધિ જણાવીશ.`,
      suggestedProducts: [],
      followUps: [
        "મને ઊંઘ નથી આવતી અને સ્ટ્રેસ રહે છે",
        "પેટમાં ગેસ અને એસિડિટી બહુ રહે છે",
        "વાળ બહુ ખરે છે, સાચો ઉપાય આપો",
        "શરીરમાં થાક અને અશક્તિ લાગે છે",
      ],
    };
  }

  return {
    message: `🌿 **Namaste! I am here to guide your Ayurvedic healing journey.**

In classical Ayurveda, true healing occurs by balancing the body's internal biological energies (**Vata, Pitta, and Kapha**) with pure botanical formulations.

Which specific concern would you like targeted Ayurvedic treatment for?
1. **Insomnia, evening stress, or anxiety?** (Remedy: PranVeda KSM-66 Ashwagandha)
2. **Acidity, digestive fire issues, or gut stagnation?** (Remedy: PranVeda Organic Triphala Churna)
3. **Hair shedding, scalp heat, or thinning?** (Remedy: PranVeda Bhringraj & Amla Hair Oil)
4. **Facial dullness, blemishes, or dark spots?** (Remedy: PranVeda Kumkumadi Facial Oil)
5. **Chronic fatigue, physical weakness, or low stamina?** (Remedy: PranVeda Himalayan Shilajit Resin)

Please share your symptoms, and I will prescribe the precise formulation and dosage.`,
    suggestedProducts: [],
    followUps: [
      "I struggle with evening stress and sleep",
      "I have daily bloating and acid reflux",
      "How can I stop seasonal hair fall?",
      "What is the best herb for all-day stamina?",
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
