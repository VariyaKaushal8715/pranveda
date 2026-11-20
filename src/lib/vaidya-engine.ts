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
2. EMPATHETIC CONSULTATION FIRST, NO AGGRESSIVE SALES:
   - Truly listen to the patient's complaint. Acknowledge their suffering with warmth and validation.
   - Explain the root cause according to classical Ayurveda: Vata (વાત), Pitta (પિત્ત), or Kapha (કફ), Agni (જઠરાગ્નિ), or Ama (ટોક્સિન્સ/આમ).
   - Provide 2–3 actionable home remedies from the Indian kitchen (Ahara) and lifestyle rituals (Dinacharya), such as warm water, ginger, cumin, nutmeg, foot massage (Padabhyanga), or sleep hygiene.
   - Ask 1 gentle diagnostic follow-up question to understand their routine, diet, or symptom duration.
3. AUTHENTIC FORMULATIONS:
   - Only recommend PranVeda formulations when genuinely appropriate to treat the diagnosed dosha.
   - Available PranVeda Formulations:
     * KSM-66 Ashwagandha Root Capsules (Stress, anxiety, restorative sleep, Vata calming)
     * Pure Himalayan Shilajit Resin (Cellular vitality, stamina, recovery, Ojas building)
     * Organic Triphala Churna (Digestion, constipation, overnight gut detox, gas, Mandagni)
     * Kumkumadi Miraculous Facial Oil (Skin glow, blemishes, dark spots, Pitta soothing)
     * Bhringraj & Amla Hair Oil (Hair fall, scalp heat, root nourishment, Kshirapaka)
     * Royal Saffron Chyawanprash (Daily immunity, lung strength, whole-family vitality)
     * Brahmi & Shankhpushpi Mind Elixir (Mental focus, brain calm, tranquility, memory)
     * Panch Tulsi Ark Drops (Seasonal immunity, throat soothing, antioxidant drops)
   - When suggesting a product, explain HOW and WHEN to take it (e.g., with warm milk, before bedtime, on empty stomach).
4. TONE: Warm, dignified, respectful, serene, and deeply healing. Use clean markdown formatting with bullet points.`;

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

આયુર્વેદમાં દરેક વ્યક્તિનું સ્વાસ્થ્ય એના ત્રણ દોષો — **વાત (Vata), પિત્ત (Pitta), અને કફ (Kapha)** ના સંતુલન પર નિર્ભર કરે છે. 

હું કોઈ સામાન્ય રોબોટ નથી જે સીધી પ્રોડક્ટ્સ વેચવા બેસે. હું તમારા લક્ષણોને મૂળમાંથી સમજીને સાચો ઉપાય આપવા માંગુ છું.

તમને હાલમાં કઈ તકલીફ થઈ રહી છે?
• **ઊંઘ ન આવવી, સ્ટ્રેસ કે ચિંતા?**
• **ગેસ, એસિડિટી, અપચો કે પેટ સાફ ન થવું?**
• **વાળ ખરવા કે માથામાં ગરમી?**
• **ચહેરા પર ડાઘ, ખીલ કે ગ્લોનો અભાવ?**
• **શરીરમાં થાક, અશક્તિ કે નબળાઈ?**

તમારી સમસ્યા મને ખુલીને જણાવો, હું તમને ઘરગથ્થુ આહાર, નિયમો અને વૈદિક માર્ગદર્શન આપીશ.`,
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
        message: `🌿 **नमस्ते! मैं आपका प्राणवेद (PranVeda) आयुर्वेदिक वैद्य हूँ।**

आयुर्वेद के अनुसार सच्चा स्वास्थ्य आपके त्रिदोष — **वात, पित्त और कफ** के संतुलन से आता है। मैं आपकी समस्या को सुनकर उसकी जड़ को समझने और सही खान-पान व घरेलू उपचार बताने के लिए यहाँ हूँ।

कृपया खुलकर बताएं कि आपको क्या स्वास्थ्य समस्या हो रही है? (जैसे: नींद न आना, तनाव, गैस-एसिडिटी, बालों का झड़ना, या कमजोरी?)`,
        suggestedProducts: [],
        followUps: [
          "मुझे रात को नींद नहीं आती और बेचैनी रहती है",
          "पेट में जलन और गैस की समस्या रहती है",
          "बाल बहुत झड़ रहे हैं, सही उपाय बताएं",
        ],
      };
    }

    return {
      message: `🌿 **Namaste! I am your PranVeda Ayurvedic Vaidya.**

In classical Ayurveda, true healing begins by understanding the root cause of your Dosha imbalance (**Vata, Pitta, and Kapha**) and your daily routine (*Dinacharya*).

I am not here to simply push products. I am here to listen to your health challenges and offer authentic dietary rituals, kitchen remedies, and herbal wisdom.

Tell me openly:
• What specific health concern are you experiencing right now?
• (e.g. disturbed sleep, high stress, acidity, indigestion, hair loss, skin dullness, or fatigue)

How may I guide your holistic healing journey today?`,
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

તમારી વાત હું બરાબર સમજી ગયો. આયુર્વેદ મુજબ જ્યારે શરીરમાં **વાત દોષ (વાયુ અને આકાશ તત્વ)** વધી જાય છે, ત્યારે મગજની ચેતાતંત્ર (Nervous system) શાંત થઈ શકતી નથી. પરિણામે પથારીમાં પડ્યા પછી પણ મનમાં સતત વિચારો ચાલ્યા કરે છે અને ઊંડી ઊંઘ નથી આવતી.

### 🍵 ઘરગથ્થુ ઉપાય & આહાર નિયમો (Home Remedies):
1. **પાદાભ્યાંગ (પગના તળિયે તેલ માલિશ):** રાત્રે સૂતા પહેલાં ૫ મિનિટ તમારા બંને પગના તળિયે હૂંફાળા તલના તેલ અથવા કોપરેલથી હળવી માલિશ કરો. આનાથી વાત દોષ તરત જ જમીન પર બેસી જાય છે અને મગજ શાંત થાય છે.
2. **જાયફળ વાળું દૂધ:** રાત્રે સૂવાના ૩૦ મિનિટ પહેલાં એક કપ હૂંફાળા દૂધમાં એક ચપટી જાયફળ પાઉડર અને થોડી હળદર નાખીને પીવો. આ પ્રાકૃતિક ઊંઘ લાવવા માટે રામબાણ છે.
3. **મોબાઈલ સ્ક્રીન બંધ કરો:** સૂવાના ૪૫ મિનિટ પહેલાં ફોન કે ટીવી જોવાનું બંધ કરો, કારણ કે બ્લુ લાઈટ મગજને ઉત્તેજિત રાખે છે.

### 🌿 આયુર્વેદિક જડીબુટ્ટી માર્ગદર્શન:
જો તમારી ઊંઘની સમસ્યા જૂની હોય, તો **KSM-66 અશ્વગંધા** અને **બ્રાહ્મી** તમારી ચેતાતંત્રને પુનર્જીવિત કરે છે. અશ્વગંધા રાત્રે કોર્ટિસોલ (સ્ટ્રેસ હોર્મોન) ઘટાડે છે અને કુદરતી ડીપ REM સ્લીપ પાછી લાવે છે (કોઈપણ આદત પડ્યા વગર).

**પ્રશ્ન:** શું તમને આ સમસ્યા કેટલા સમયથી છે, અને શું સાથે માથાનો દુખાવો કે પેટમાં કબજિયાત પણ રહે છે?`,
        suggestedProducts: catalog.ashwagandha ? [catalog.ashwagandha] : [],
        followUps: [
          "અશ્વગંધા રાત્રે દૂધ સાથે કેવી રીતે લેવી?",
          "આ ઉપાયનું પરિણામ કેટલા દિવસમાં દેખાશે?",
          "વાત દોષ ઘટાડવા માટે શું ન ખાવું જોઈએ?",
        ],
      };
    }

    if (isHindi) {
      return {
        message: `🌿 **आयुर्वेदिक निदान: वात दोष असंतुलन (Vata Aggravation)**

आपकी समस्या को मैंने ध्यान से समझा। आयुर्वेद के अनुसार जब शरीर में **वात दोष** बढ़ जाता है, तो मस्तिष्क और तंत्रिका तंत्र शांत नहीं हो पाते। इसी वजह से रात को करवटें बदलते रहना और विचारों का चक्र चलता रहता है।

### 🍵 घरेलू उपचार और दिनचर्या:
1. **पादाभ्यंग (पैरों की मालिश):** रात को सोने से पहले 5 मिनट तलवों पर गुनगुने तिल के तेल से मालिश करें।
2. **जायफल वाला दूध:** सोने से पहले एक कप गुनगुने दूध में चुटकी भर जायफल पाउडर डालकर पिएं।
3. **KSM-66 अश्वगंधा:** यह तनाव के हार्मोन को शांत कर प्राकृतिक गहरी नींद लाने में सर्वोत्तम है।

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

I hear you clearly. In Ayurveda, sleeplessness and racing nighttime thoughts are driven by an aggravated **Vata Dosha** (the air element governing nervous transmission). When Vata runs too dry and active, the mind cannot transition into restorative delta/REM sleep.

### 🍵 Daily Ahara & Lifestyle Rituals:
1. **Padabhyanga (Foot Massage):** Warm a few drops of sesame oil and massage the soles of your feet for 3–5 minutes before getting into bed.
2. **Nutmeg Golden Milk:** Drink a small cup of lukewarm milk infused with a pinch of freshly grated nutmeg (*Jaiphal*) 30 minutes before sleep.
3. **Screen Disconnect:** Discontinue mobile and laptop use at least 45 minutes before bedtime.

### 🌿 Supportive Formulation:
• **KSM-66 Ashwagandha Root Capsules:** Clinically standardized adaptogen that naturally lowers evening cortisol and restores deep sleep architecture without habit-forming grogginess.

**Diagnostic Follow-up:** How long have you experienced this, and do you also experience dry skin or sluggish morning digestion?`,
      suggestedProducts: catalog.ashwagandha ? [catalog.ashwagandha] : [],
      followUps: [
        "How should I take Ashwagandha with warm milk?",
        "How quickly will I notice deeper sleep?",
        "What foods trigger Vata imbalance?",
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

ચરક સંહિતા અનુસાર, મોટાભાગના રોગોનું મૂળ પેટની પાચન અગ્નિ (**જઠરાગ્નિ**) નબળી પડવામાં છે. 
- જો છાતી કે ગળામાં બળતરા થતી હોય, તો એ **પિત્ત દોષ (Pitta)** વધવાનું લક્ષણ છે.
- જો પેટ ફૂલી જતું હોય, ગેસ થતો હોય કે સવારે પેટ સાફ ન આવતું હોય, તો એ આંતરડામાં **વાત દોષ (Apana Vata)** અટકાઈ જવાનું લક્ષણ છે, જેનાથી શરીરમાં ઝેરી તત્વો (**આમ - Ama**) જમા થાય છે.

### 🍵 ઘરગથ્થુ ઉપચાર & આહાર નિયમો:
1. **જમતી વખતે ઠંડુ પાણી બંધ:** જમતી વખતે કે જમ્યા પછી તરત ફ્રિજનું ઠંડુ પાણી ક્યારેય ન પીવું. એ તમારી પાચક અગ્નિને ઓલવી નાખે છે. ફક્ત નવશેકું (હૂંફાળું) પાણી જ ઘૂંટડે-ઘૂંટડે પીવો.
2. **સૂંઠ / આદું અને સિંધવ મીઠું:** બપોરે જમવાના ૧૦ મિનિટ પહેલાં તાજા આદુનો નાનો ટુકડો થોડા સિંધવ મીઠા સાથે ચાવીને ખાઓ, જેથી કુદરતી પાચક રસો છૂટા પડે.
3. **વરિયાળી અને જીરાનું પાણી:** જમ્યા પછી અડધી ચમચી વરિયાળી અને જીરું ચાવીને ખાવ અથવા એનું હુંફાળું પાણી પીવો.

### 🌿 વૈદિક ઔષધિ માર્ગદર્શન:
આંતરડામાં જમા થયેલા વર્ષો જૂના આમ (ટોક્સિન્સ) ને સાફ કરવા માટે **ઓર્ગેનિક ત્રિફળા ચૂર્ણ (હરડે, બહેડા, આમળા)** શ્રેષ્ઠ છે. એ કોઈ પેટ પાતળું કરવાની આદત પાડનારી દવા નથી, પણ આંતરડાના સ્નાયુઓને પોષણ આપીને સવારે કુદરતી રીતે પેટ સાફ કરે છે.

**પ્રશ્ન:** શું તમને સવારે પેટ એક જ વારમાં સાફ આવે છે, કે દિવસમાં વારંવાર જવું પડે છે?`,
        suggestedProducts: catalog.triphala ? [catalog.triphala] : [],
        followUps: [
          "ત્રિફળા ચૂર્ણ રાત્રે ગરમ પાણી સાથે કેવી રીતે લેવું?",
          "શું ત્રિફળાની આદત પડી જાય ખરી?",
          "એસિડિટી મટાડવા ખોરાકમાં શું પરેજી રાખવી?",
        ],
      };
    }

    if (isHindi) {
      return {
        message: `🔥 **आयुर्वेदिक निदान: मंदाग्नि और पित्त दोष (Digestive Fire Imbalance)**

पेट में गैस, एसिडिटी और भारीपन का मुख्य कारण पाचन अग्नि का कमजोर होना है, जिससे शरीर में **'आम' (Toxins)** बनने लगता है।

### 🍵 सरल घरेलू उपाय:
1. **गुनगुना पानी पिएं:** भोजन के साथ या तुरंत बाद ठंडा पानी कभी न पिएं। सिर्फ घूंट-घूंट गुनगुना पानी पिएं।
2. **सौंफ और जीरा:** दोपहर और रात के भोजन के बाद सौंफ चबाएं।
3. **ऑर्गेनिक त्रिफला चूर्ण:** रात को सोने से पहले आधा चम्मच त्रिफला गुनगुने पानी से लें। यह आंतों की स्वाभाविक सफाई करता है।

**मेरा सवाल:** क्या आपको एसिडिटी खट्टे डकार के साथ होती है, या पेट में भारीपन और कब्ज ज्यादा रहता है?`,
        suggestedProducts: catalog.triphala ? [catalog.triphala] : [],
        followUps: [
          "त्रिफला लेने का सही तरीका क्या है?",
          "एसिडिटी में क्या नहीं खाना चाहिए?",
        ],
      };
    }

    return {
      message: `🔥 **Ayurvedic Clinical Assessment: Mandagni & Pitta/Ama Accumulation**

In classical Ayurveda, optimal vitality begins with **Jatharagni (the digestive metabolic fire)**. 
• Burning sensation/heartburn = Excess **Pitta** (acidic heat).
• Bloating and irregular motion = Sluggish **Apana Vata** trapping undigested toxic waste (**Ama**).

### 🍵 Healing Habits & Kitchen Remedies:
1. **Sip Warm Water (Ushnodaka):** Avoid ice-cold drinks around meals, as they quench the digestive fire.
2. **Ginger with Rock Salt:** Chew a sliver of fresh ginger with sendha namak 10 minutes before lunch to awaken digestive enzymes naturally.
3. **Avoid Late Dinners:** Finish meals before 8:00 PM to give the colon resting hours.

### 🌿 Targeted Formulation:
• **Organic Triphala Churna:** The venerable tridoshic formulation of Amla, Haritaki, and Bibhitaki that cleanses the intestinal tract gently overnight without creating dependency.

**Diagnostic Follow-up:** Do you primarily experience acid reflux after meals, or chronic sluggish bowels in the morning?`,
      suggestedProducts: catalog.triphala ? [catalog.triphala] : [],
      followUps: [
        "How to take Triphala churna with warm water?",
        "Is Triphala safe for daily long-term use?",
        "What foods trigger Pitta acid accumulation?",
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
        message: `💆 **આયુર્વેદિક નિદાન: અસ્થિ ધાતુ પોષણ અને ખોપરીમાં પિત્ત ગરમી**

આયુર્વેદ અનુસાર વાળ (**કેશ**) એ આપણા શરીરના **અસ્થિ ધાતુ (હાડકાંના પોષણ)** નો ઉપધાતુ છે. જ્યારે માનસિક ચિંતા કે શરીરમાં ગરમી (**પિત્ત દોષ**) વધે છે, ત્યારે એ ગરમી સીધી ખોપરી (Scalp) તરફ ચડે છે. પરિણામે વાળના મૂળ નિર્બળ બનીને ખરવા લાગે છે.

### 🌿 સાચી માલિશ પદ્ધતિ & ઘરગથ્થુ ઉપાય:
1. **૧૦ મિનિટ હૂંફાળી ચંપી:** તેલને સીધું ગરમ કરવાને બદલે વાટકીને ગરમ પાણીમાં મૂકીને હૂંફાળું કરો. આંગળીઓના ટેરવાથી વાળના મૂળમાં હળવા હાથે ગોળાકાર માલિશ કરો. આનાથી ખોપરીનું તાપમાન ઠંડુ પડે છે.
2. **આહાર નિયમ:** દરરોજ સવારે પલાળેલી ૪–૫ બદામ, થોડા કાળા તલ અને આંબળાનો રસ લેવાથી વાળના મૂળને કુદરતી કેલ્શિયમ અને આયર્ન મળે છે.
3. **કેમિકલ શેમ્પૂ ટાળો:** સલ્ફેટ અને પેરાબીન વાળા સાબુ/શેમ્પૂથી વાળના મૂળ સુકાઈ જાય છે, એના બદલે હળવા આયુર્વેદિક ક્લીન્ઝર વાપરો.

### 🌿 શ્રેષ્ઠ આયુર્વેદિક ઔષધ:
આપણા શાસ્ત્રોમાં ભૃંગરાજને **"કેશરાજ"** (વાળનો રાજા) કહેવાયો છે. આપણું **ભૃંગરાજ અને આમળા હેર ઓઈલ** પ્રાચીન ક્ષીરપાક વિધિથી ૧૮ કલાક સુધી ધીમી આંચે ઉકાળીને બનાવેલું છે, જે વાળનું ખરવું ઘટાડીને મૂળને મજબૂત કરે છે.

**પ્રશ્ન:** શું તમારા વાળ મૂળમાંથી ખરે છે કે વચ્ચેથી તૂટે છે? અને શું માથામાં ખોડો કે ખંજવાળ પણ છે?`,
        suggestedProducts: catalog.bhringraj ? [catalog.bhringraj] : [],
        followUps: [
          "ભૃંગરાજ તેલ અઠવાડિયામાં કેટલી વાર લગાવવું જોઈએ?",
          "વાળ ખરતા રોકવા માટે રોજિંદા આહારમાં શું ફેરફાર કરવો?",
        ],
      };
    }

    if (isHindi) {
      return {
        message: `💆 **आयुर्वेदिक निदान: अस्थि धातु पोषण और पित्त का बढ़ना**

बालों का झड़ना अक्सर स्कैल्प में बढ़ी हुई पित्त की गर्मी और पोषण की कमी के कारण होता है।

### 🌿 सही देखभाल और उपाय:
1. **गुनगुने तेल से मालिश:** भृंगराज और आंवला तेल को हल्का गुनगुना करके 10 मिनट तक सिर की जड़ों में धीरे-धीरे मसाज करें।
2. **आंवला और तिल:** भोजन में आंवला और तिल शामिल करें।
3. **तनाव कम करें:** ज्यादा सोचने और देर रात जागने से बाल ज्यादा झड़ते हैं।

**मेरा सवाल:** क्या बालों के साथ आपको डैंड्रफ की समस्या भी है?`,
        suggestedProducts: catalog.bhringraj ? [catalog.bhringraj] : [],
        followUps: [
          "भृंगराज तेल लगाने का सही तरीका क्या है?",
          "कितने समय में बाल झड़ना बंद होते हैं?",
        ],
      };
    }

    return {
      message: `💆 **Ayurvedic Clinical Assessment: Asthi Dhatu & Scalp Pitta Heat**

In Ayurveda, hair (*Kesha*) is the tissue byproduct of **Asthi Dhatu** (bone matrix) and is exceptionally vulnerable to excessive bodily heat (**Pitta**). When mental stress or spicy food drives heat upward, hair follicles shrink and shed prematurely.

### 🌿 Scalp Rituals & Nutrition:
1. **The 10-Minute Warm Champi:** Warm cold-pressed oil in a water bath. Massage gently into scalp roots using circular finger movements to soothe the cranial nervous system.
2. **Nutritional Reinforcement:** Consume soaked almonds, Amla juice, and curry leaves daily for bone tissue minerals.
3. **Avoid Harsh Detergents:** Synthetic sulfates strip natural sebum, exacerbating root inflammation.

### 🌿 Recommended Formulation:
• **Bhringraj & Amla Hair Oil:** Slow-simmered for 18 hours using the authentic *Kshirapaka* technique to deeply nourish roots and arrest seasonal shedding.

**Diagnostic Follow-up:** Is the shedding accompanied by dry flaking, itching, or excess hair breakage?`,
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
        message: `✨ **આયુર્વેદિક નિદાન: રક્ત ધાતુ અને ભ્રાજક પિત્ત સંતુલન**

આયુર્વેદમાં ચહેરો એ તમારા **રક્ત ધાતુ (લોહીની શુદ્ધતા)** અને **ભ્રાજક પિત્ત** નો સીધો અરીસો છે. ઉપરથી મોંઘા કેમિકલ ક્રીમ લગાવવાથી ચામડી સુધરતી નથી, અંદરનું લોહી શુદ્ધ થાય અને ત્વચાના ઊંડા કોષોને સાચું તેલ મળે ત્યારે જ કુદરતી ચમક આવે છે.

### 🌸 દૈનિક રૂપ નિખાર નિયમો:
1. **ભીની ત્વચા પર તેલ લગાવો:** ક્યારેય સુકા ચહેરા પર તેલ ન ઘસવું. ચહેરો નવશેકા પાણીથી ધોઈને સહેજ ભીનો હોય ત્યારે જ ૩–૪ ટીપાં હથેળીમાં ઘસીને હળવેથી ચહેરા અને ગરદન પર દબાવો.
2. **રાત્રિ કાળી ઊંઘ:** રાત્રે ૧૦ થી ૨ દરમિયાન ત્વચાના કોષો પુનર્જીવિત થાય છે. આ સમયે ઊંઘવું સૌથી ઉત્તમ બ્યુટી ટ્રીટમેન્ટ છે.
3. **તળેલો અને વાસી ખોરાક ટાળો:** વધારે પડતું તળેલું અને આથેલું ખાવાથી લોહીમાં ગરમી વધે છે જે ચહેરા પર ખીલ કે ડાઘના રૂપમાં બહાર આવે છે.

### 🌿 કુંકુમાદિ તેલમ (કાશ્મીરી કેસર અમૃત):
અષ્ટાગ હૃદયમ્ ગ્રંથ અનુસાર તૈયાર થયેલું આપણું **કુંકુમાદિ મિરેક્યુલસ ફેશિયલ ઓઇલ** અસલી કાશ્મીરી કેસર, લાલ ચંદન અને ૨૧ જડીબુટ્ટીઓથી બનેલું છે. એ રાત્રે ચહેરાના કાળા ડાઘ અને ટેનિંગને હળવા કરીને સવારે ગોલ્ડન ગ્લો આપે છે.

**પ્રશ્ન:** તમારી સ્કિન સામાન્ય રીતે ડ્રાય (સૂકી) રહે છે કે ઓઇલી (ચીકણી)?`,
        suggestedProducts: catalog.kumkumadi ? [catalog.kumkumadi] : [],
        followUps: [
          "કુંકુમાદિ ઓઇલ કેટલા ટીપાં વાપરવું જોઈએ?",
          "શું ઓઇલી સ્કિન પર કુંકુમાદિ તેલ લગાવી શકાય?",
        ],
      };
    }

    return {
      message: `✨ **Ayurvedic Assessment: Rakta Dhatu & Bhrajaka Pitta Radiance**

In Ayurveda, skin health mirrors your **Rakta Dhatu (blood tissue)** and the balanced function of **Bhrajaka Pitta**. Chemical creams merely coat the surface, whereas classical botanicals penetrate the deep subcutaneous layers.

### 🌸 Daily Luminous Rituals:
1. **Damp Skin Application:** Wash with lukewarm water and leave skin slightly damp. Press 3–4 drops into face and neck nightly.
2. **Internal Blood Cleansing:** Drink plenty of warm water, and avoid deep-fried foods that overheat the blood.

### 🌿 Signature Formulation:
• **Kumkumadi Miraculous Facial Oil:** Handcrafted with Grade-1 Kashmiri Saffron and 21 Himalayan herbs to reduce dark spots and restore natural morning radiance.`,
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
        message: `⚡ **આયુર્વેદિક નિદાન: ઓજસ અને ધાતુ પોષણ (Vital Stamina)**

આયુર્વેદમાં **ઓજસ (Ojas)** એ શરીરની તમામ સાત ધાતુઓનો ઉત્તમ અર્ક છે. જ્યારે દોડધામ, સ્ટ્રેસ કે પૂરતા પોષણના અભાવે ઓજસ ઘટે છે, ત્યારે આખો દિવસ થાક, આળસ અને સ્ટેમિનાનો અભાવ અનુભવાય છે.

### 🍵 શક્તિવર્ધક નિયમો અને આહાર:
1. **સવારનું કુદરતી રસાયણ:** સવારે નરણા કોઠે હૂંફાળા દૂધ અથવા પાણી સાથે મગના દાણા જેટલું અસલી હિમાલયન શિલાજીત લેવાથી સેલ્યુલર એનર્જી (ATP) વધે છે.
2. **સાત્વિક ઊર્જા આહાર:** ખજૂર, અંજીર, ગીર ગાયનું શુદ્ધ ઘી અને સીઝનલ ફળો નાસ્તામાં સામેલ કરો.
3. **વધારાની કોફી ટાળો:** વધુ પડતી કોફી અંદરથી ચેતાઓ સુકવી નાખે છે; એના બદલે રસાયણ આહાર પસંદ કરો.

### 🌿 શ્રેષ્ઠ આયુર્વેદિક ઔષધ:
• **પ્યોર હિમાલયન શિલાજીત રેઝિન (૧૬,૦૦૦ ફૂટ):** >૭૫% ફુલ્વિક એસિડ અને ૮૪+ મિનરલ્સ સાથે કુદરતી સ્ટેમિના અને શરીરની નબળાઈ દૂર કરે છે.
• **રોયલ કેસર ચ્યવનપ્રાશ:** રોગપ્રતિકારક શક્તિ અને ફેફસાંની તાકાત વધારે છે.

**પ્રશ્ન:** શું તમને સવારે ઊઠતાં જ થાક લાગે છે, કે બપોર પછી એનર્જી ઘટી જાય છે?`,
        suggestedProducts: catalog.shilajit ? [catalog.shilajit] : [],
        followUps: [
          "શિલાજીત લેવાની સાચી રીત અને સમય કયો છે?",
          "ચ્યવનપ્રાશ કઈ ઋતુમાં લઈ શકાય?",
        ],
      };
    }

    return {
      message: `⚡ **Ayurvedic Assessment: Ojas & Dhatu Nourishment**

In Ayurveda, **Ojas** is the supreme biological essence of vitality. When depleted by continuous stress and erratic nutrition, cellular fatigue and diminished stamina result.

### 🍵 Ojas-Restoring Rituals:
1. **Natural Mineral Rasayana:** Take a pea-sized portion of purified Himalayan Shilajit in lukewarm milk or water in the morning.
2. **Whole Food Fuel:** Incorporate dates, almonds, and pure A2 cow ghee into your routine.

### 🌿 Recommended Formulation:
• **Pure Himalayan Shilajit Resin:** Sourced at 16,000ft altitude with >75% Fulvic Acid and 84+ ionic trace minerals for sustained cellular ATP energy.`,
      suggestedProducts: catalog.shilajit ? [catalog.shilajit] : [],
      followUps: [
        "How to consume Shilajit correctly with warm water or milk?",
        "When is the best time of day to take Shilajit?",
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
        message: `🌿 **આયુર્વેદિક સેવન વિધિ (How to Take):**

આયુર્વેદમાં કોઈપણ ઔષધિ જેટલી મહત્વની છે, એટલું જ મહત્વ એના **અનુપાન (જેની સાથે લેવાય છે — જેમ કે હૂંફાળું દૂધ, મધ કે પાણી)** નું છે.

• **અશ્વગંધા:** રાત્રે જમ્યાના ૪૫ મિનિટ પછી ૧ કેપ્સ્યુલ હૂંફાળા દૂધ સાથે લેવી શ્રેષ્ઠ છે.
• **શિલાજીત:** સવારે નરણા કોઠે (Empty Stomach) મગના દાણા જેટલું (૨૫૦-૩૦૦ મિ.ગ્રા.) હૂંફાળા દૂધ કે પાણીમાં ઓગાળીને પીવું.
• **ત્રિફળા ચૂર્ણ:** રાત્રે સૂતા પહેલાં ૧ નાની ચમચી નવશેકા ગરમ પાણી સાથે પીવું.
• **કુંકુમાદિ તેલ:** રાત્રે ચહેરો ધોઈને સહેજ ભીની ચામડી પર ૩–૪ ટીપાં હળવા હાથે લગાવીને સૂઈ જવું.

શું તમારે આમાંથી કોઈ ચોક્કસ ઔષધિ વિશે વધુ વિગતવાર જાણવું છે?`,
        suggestedProducts: [],
        followUps: [
          "અશ્વગંધા શું પાણી સાથે લઈ શકાય?",
          "શિલાજીત કેટલા મહિના સુધી ચાલુ રાખી શકાય?",
          "ત્રિફળા ચૂર્ણ રોજ લેવાય?",
        ],
      };
    }

    return {
      message: `🌿 **Ayurvedic Anupana & Dosage Protocol:**

In classical Ayurveda, the vehicle (*Anupana*) with which an herb is ingested determines its cellular bioavailability.

• **Ashwagandha:** 1 capsule 45 minutes after dinner with warm milk.
• **Shilajit Resin:** A pea-sized portion (250–300mg) dissolved in lukewarm milk or water in the morning on an empty stomach.
• **Triphala Churna:** 1 teaspoon in lukewarm water 30 minutes before sleep.
• **Kumkumadi Oil:** 3–4 drops gently pressed into damp skin before sleep.

Which specific formulation would you like dosage instructions for?`,
      suggestedProducts: [],
      followUps: [
        "Can I take Ashwagandha with warm water instead of milk?",
        "For how many months can I continue Shilajit?",
      ],
    };
  }

  // 8. GENERAL / DEFAULT AYURVEDIC GUIDANCE
  if (isGujarati) {
    return {
      message: `🌿 **નમસ્તે! હું તમારી વાત સાંભળી રહ્યો છું.**

આયુર્વેદમાં કોઈપણ બીમારી કે શારીરિક અસંતુલનને સમજવા માટે મૂળ લક્ષણો જાણવા જરૂરી છે.

તમને નીચેનામાંથી શેના વિશે સલાહ જોઈએ છે?
1. **ઊંઘ, માનસિક તણાવ કે ચિંતા?**
2. **ગેસ, એસિડિટી, અપચો કે પેટની તકલીફ?**
3. **વાળ ખરવા કે માથાની ગરમી?**
4. **ચહેરાનો ગ્લો, ડાઘ કે ખીલ?**
5. **શરીરમાં થાક, નબળાઈ કે સ્ટેમિનાનો અભાવ?**

તમારી સમસ્યા મને થોડી વધુ વિગતમાં જણાવો (જેમ કે કેટલા સમયથી થાય છે, તમારી ખાણી-પીણી કેવી છે), જેથી હું તમને સાચો અને અસરકારક આયુર્વેદિક ઉપાય આપી શકું.`,
      suggestedProducts: [],
      followUps: [
        "મને ઊંઘ નથી આવતી અને સ્ટ્રેસ રહે છે",
        "પેટમાં ગેસ અને એસિડિટી બહુ રહે છે",
        "વાળ બહુ ખરે છે, ઉપાય જણાવો",
        "શરીરમાં થાક અને અશક્તિ લાગે છે",
      ],
    };
  }

  return {
    message: `🌿 **Namaste! I am listening carefully to your health journey.**

In classical Ayurveda, the human body is governed by the three biological energies (**Vata, Pitta, and Kapha**). When any of these fall out of balance due to diet or stress, symptoms manifest.

Please share a little more context with me:
1. Is your concern focused on **sleep, mental stress, or restlessness**?
2. Are you experiencing **digestive fire (Agni) issues, acidity, or bloating**?
3. Or are you focusing on **hair health, skin radiance, or physical energy**?

Tell me your specific symptoms, and I will recommend personalized lifestyle rituals and authentic herbal wisdom.`,
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
