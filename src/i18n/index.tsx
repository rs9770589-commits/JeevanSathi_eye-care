import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "hi" | "pa";

export const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
];

// English text is the key; hi/pa maps translate it. Missing keys fall back to English.
const translations: Record<Exclude<Lang, "en">, Record<string, string>> = {
  hi: {
    "Register for a free check": "मुफ़्त जांच के लिए रजिस्टर करें",
    "See how it works": "यह कैसे काम करता है",
    "Caring for your mouth, close to your home.":
      "आपके मुंह की देखभाल, आपके घर के पास।",
    "JeevanScan helps families in villages get their mouth checked early — without travelling far. A health worker takes a few photos, and a qualified doctor looks at them carefully.":
      "JeevanScan गांवों के परिवारों को जल्दी मुंह की जांच कराने में मदद करता है — दूर तक यात्रा किए बिना। एक स्वास्थ्य कार्यकर्ता कुछ तस्वीरें लेता है, और योग्य डॉक्टर उन्हें ध्यान से देखते हैं।",
    "Your details are kept private": "आपकी जानकारी गोपनीय रहती है",
    "Help in Hindi and local languages": "हिन्दी और स्थानीय भाषाओं में सहायता",
    "Four simple steps": "चार आसान कदम",
    "You are never alone — a real person helps you at every step.":
      "आप कभी अकेले नहीं हैं — हर कदम पर एक असली इंसान आपकी मदद करता है।",
    "Register": "रजिस्टर",
    "Take mouth photos": "मुंह की तस्वीरें लें",
    "Doctor reviews": "डॉक्टर समीक्षा करते हैं",
    "We call you": "हम आपको संपर्क करते हैं",
    "Give your name, age and phone number. A health worker can do it for you.":
      "अपना नाम, उम्र और फ़ोन नंबर दें। स्वास्थ्य कार्यकर्ता यह आपके लिए कर सकता है।",
    "Follow our simple picture guide, or let the health worker take them.":
      "हमारी आसान तस्वीर गाइड देखें, या स्वास्थ्य कार्यकर्ता से तस्वीरें लें।",
    "A qualified doctor looks at your photos, and the result is shown in your portal.":
      "एक योग्य डॉक्टर आपकी तस्वीरें देखता है, और नतीजा आपके पोर्टल में दिखता है।",
    "The photo guide": "तस्वीर गाइड",
    "Photo 1 · Inside the cheek": "तस्वीर 1 · गाल के अंदर",
    "Photo 2 · The tongue": "तस्वीर 2 · जीभ",
    "Photo 3 · Roof of the mouth": "तस्वीर 3 · मुंह की छत",
    "Sign in": "साइन इन",
    "Sign out": "साइन आउट",
    "Create account": "खाता बनाएं",
    "Email": "ईमेल",
    "Password": "पासवर्ड",
    "Full name": "पूरा नाम",
    "Phone number": "फ़ोन नंबर",
    "Patient portal": "मरीज़ पोर्टल",
    "Health worker portal": "स्वास्थ्य कार्यकर्ता पोर्टल",
    "Doctor portal": "डॉक्टर पोर्टल",
    "Admin portal": "एडमिन पोर्टल",
    "Register patient": "मरीज़ रजिस्टर करें",
    "Upload photos": "तस्वीरें अपलोड करें",
    "Pending doctor review": "डॉक्टर की समीक्षा बाकी है",
    "Awaiting photos": "तस्वीरें बाकी हैं",
    "Review complete": "समीक्षा पूरी",
    "Referred": "रेफर किया गया",
    "Save": "सेव करें",
    "Cancel": "रद्द करें",
    "Age": "उम्र",
    "Gender": "लिंग",
    "Village": "गांव",
    "Consent": "सहमति",
    "Male": "पुरुष",
    "Female": "महिला",
    "Other": "अन्य",
    "Screening history": "जांच इतिहास",
    "My profile": "मेरी प्रोफ़ाइल",
    "Referral and appointments": "रेफरल और अपॉइंटमेंट",
    "Photo quality check": "तस्वीर गुणवत्ता जांच",
    "Take photo": "तस्वीर लें",
    "Choose file": "फ़ाइल चुनें",
    "Working offline — saved on this device, will sync when you are online":
      "ऑफ़लाइन — इस डिवाइस पर सेव हुआ, ऑनलाइन आने पर भेजा जाएगा",
    "Synced": "सिंक हो गया",
  },
  pa: {
    "Register for a free check": "ਮੁਫ਼ਤ ਜਾਂਚ ਲਈ ਰਜਿਸਟਰ ਕਰੋ",
    "See how it works": "ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ",
    "Caring for your mouth, close to your home.": "ਤੁਹਾਡੇ ਮੂੰਹ ਦੀ ਦੇਖਭਾਲ, ਤੁਹਾਡੇ ਘਰ ਨੇੜੇ।",
    "JeevanScan helps families in villages get their mouth checked early — without travelling far. A health worker takes a few photos, and a qualified doctor looks at them carefully.":
      "JeevanScan ਪਿੰਡਾਂ ਦੇ ਪਰਿਵਾਰਾਂ ਦੀ ਜਲਦੀ ਮੂੰਹ ਦੀ ਜਾਂਚ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ — ਦੂਰ ਜਾਣ ਤੋਂ ਬਿਨਾਂ। ਇੱਕ ਸਿਹਤ ਵਰਕਰ ਕੁਝ ਤਸਵੀਰਾਂ ਲੈਂਦਾ ਹੈ, ਅਤੇ ਯੋਗ ਡਾਕਟਰ ਉਹਨਾਂ ਨੂੰ ਧਿਆਨ ਨਾਲ ਵੇਖਦੇ ਹਨ।",
    "Your details are kept private": "ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਗੁਪਤ ਰੱਖੀ ਜਾਂਦੀ ਹੈ",
    "Help in Hindi and local languages": "ਹਿੰਦੀ ਅਤੇ ਸਥਾਨਕ ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ ਮਦਦ",
    "Four simple steps": "ਚਾਰ ਸੌਖੇ ਕਦਮ",
    "You are never alone — a real person helps you at every step.":
      "ਤੁਸੀਂ ਕਦੇ ਇਕੱਲੇ ਨਹੀਂ — ਹਰ ਕਦਮ 'ਤੇ ਇੱਕ ਅਸਲੀ ਵਿਅਕਤੀ ਤੁਹਾਡੀ ਮਦਦ ਕਰਦਾ ਹੈ।",
    "Register": "ਰਜਿਸਟਰ",
    "Take mouth photos": "ਮੂੰਹ ਦੀਆਂ ਤਸਵੀਰਾਂ ਲਵੋ",
    "Doctor reviews": "ਡਾਕਟਰ ਸਮੀਖਿਆ ਕਰਦੇ ਹਨ",
    "We call you": "ਅਸੀਂ ਤੁਹਾਨੂੰ ਸੰਪਰਕ ਕਰਦੇ ਹਾਂ",
    "Give your name, age and phone number. A health worker can do it for you.":
      "ਆਪਣਾ ਨਾਮ, ਉਮਰ ਅਤੇ ਫ਼ੋਨ ਨੰਬਰ ਦਿਓ। ਸਿਹਤ ਵਰਕਰ ਇਹ ਤੁਹਾਡੇ ਲਈ ਕਰ ਸਕਦਾ ਹੈ।",
    "Follow our simple picture guide, or let the health worker take them.":
      "ਸਾਡੀ ਸੌਖੀ ਤਸਵੀਰ ਗਾਈਡ ਵੇਖੋ, ਜਾਂ ਸਿਹਤ ਵਰਕਰ ਤੋਂ ਤਸਵੀਰਾਂ ਲਵਾਓ।",
    "A qualified doctor looks at your photos, and the result is shown in your portal.":
      "ਇੱਕ ਯੋਗ ਡਾਕਟਰ ਤੁਹਾਡੀਆਂ ਤਸਵੀਰਾਂ ਵੇਖਦਾ ਹੈ, ਅਤੇ ਨਤੀਜਾ ਤੁਹਾਡੇ ਪੋਰਟਲ ਵਿੱਚ ਦਿਖਦਾ ਹੈ।",
    "The photo guide": "ਤਸਵੀਰ ਗਾਈਡ",
    "Photo 1 · Inside the cheek": "ਤਸਵੀਰ 1 · ਗੁੱਟੇ ਦੇ ਅੰਦਰ",
    "Photo 2 · The tongue": "ਤਸਵੀਰ 2 · ਜੀਭ",
    "Photo 3 · Roof of the mouth": "ਤਸਵੀਰ 3 · ਮੂੰਹ ਦੀ ਛੱਤ",
    "Sign in": "ਸਾਈਨ ਇਨ",
    "Sign out": "ਸਾਈਨ ਆਉਟ",
    "Create account": "ਖਾਤਾ ਬਣਾਓ",
    "Email": "ਈਮੇਲ",
    "Password": "ਪਾਸਵਰਡ",
    "Full name": "ਪੂਰਾ ਨਾਮ",
    "Phone number": "ਫ਼ੋਨ ਨੰਬਰ",
    "Patient portal": "ਮਰੀਜ਼ ਪੋਰਟਲ",
    "Health worker portal": "ਸਿਹਤ ਵਰਕਰ ਪੋਰਟਲ",
    "Doctor portal": "ਡਾਕਟਰ ਪੋਰਟਲ",
    "Admin portal": "ਐਡਮਿਨ ਪੋਰਟਲ",
    "Register patient": "ਮਰੀਜ਼ ਰਜਿਸਟਰ ਕਰੋ",
    "Upload photos": "ਤਸਵੀਰਾਂ ਅੱਪਲੋਡ ਕਰੋ",
    "Pending doctor review": "ਡਾਕਟਰ ਦੀ ਸਮੀਖਿਆ ਬਾਕੀ",
    "Awaiting photos": "ਤਸਵੀਰਾਂ ਬਾਕੀ",
    "Review complete": "ਸਮੀਖਿਆ ਪੂਰੀ",
    "Referred": "ਰੈਫਰ ਕੀਤਾ",
    "Save": "ਸੇਵ ਕਰੋ",
    "Cancel": "ਰੱਦ ਕਰੋ",
    "Age": "ਉਮਰ",
    "Gender": "ਲਿੰਗ",
    "Village": "ਪਿੰਡ",
    "Consent": "ਸਹਿਮਤੀ",
    "Male": "ਮਰਦ",
    "Female": "ਔਰਤ",
    "Other": "ਹੋਰ",
    "Screening history": "ਜਾਂਚ ਇਤਿਹਾਸ",
    "My profile": "ਮੇਰੀ ਪ੍ਰੋਫ਼ਾਈਲ",
    "Referral and appointments": "ਰੈਫਰਲ ਅਤੇ ਅਪੌਇੰਟਮੈਂਟ",
    "Photo quality check": "ਤਸਵੀਰ ਗੁਣਵੱਤਾ ਜਾਂਚ",
    "Take photo": "ਤਸਵੀਰ ਲਓ",
    "Choose file": "ਫ਼ਾਈਲ ਚੁਣੋ",
    "Working offline — saved on this device, will sync when you are online":
      "ਆਫ਼ਲਾਈਨ — ਇਸ ਡਿਵਾਈਸ 'ਤੇ ਸੇਵ ਹੋਇਆ, ਆਨਲਾਈਨ ਆਉਣ 'ਤੇ ਭੇਜਿਆ ਜਾਵੇਗਾ",
    "Synced": "ਸਿੰਕ ਹੋ ਗਿਆ",
  },
};

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LangContextValue | null>(null);

const STORAGE_KEY = "jeevan-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && saved in LANGUAGES.map((l) => l.code).join()) return;
    if (saved === "en" || saved === "hi" || saved === "pa") setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: string) => {
      if (lang === "en") return key;
      return translations[lang][key] ?? key;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}
