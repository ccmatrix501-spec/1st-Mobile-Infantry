import { Globe2 } from "lucide-react";

const SITE_ORIGIN = "https://www.1stmid.com";

const LANGUAGES = [
  ["en", "English (Original)"],
  ["af", "Afrikaans"],
  ["sq", "Albanian"],
  ["am", "Amharic"],
  ["ar", "Arabic"],
  ["hy", "Armenian"],
  ["as", "Assamese"],
  ["ay", "Aymara"],
  ["az", "Azerbaijani"],
  ["bm", "Bambara"],
  ["eu", "Basque"],
  ["be", "Belarusian"],
  ["bn", "Bengali"],
  ["bho", "Bhojpuri"],
  ["bs", "Bosnian"],
  ["bg", "Bulgarian"],
  ["ca", "Catalan"],
  ["ceb", "Cebuano"],
  ["ny", "Chichewa"],
  ["zh-CN", "Chinese (Simplified)"],
  ["zh-TW", "Chinese (Traditional)"],
  ["co", "Corsican"],
  ["hr", "Croatian"],
  ["cs", "Czech"],
  ["da", "Danish"],
  ["dv", "Dhivehi"],
  ["doi", "Dogri"],
  ["nl", "Dutch"],
  ["eo", "Esperanto"],
  ["et", "Estonian"],
  ["ee", "Ewe"],
  ["tl", "Filipino"],
  ["fi", "Finnish"],
  ["fr", "French"],
  ["fy", "Frisian"],
  ["gl", "Galician"],
  ["ka", "Georgian"],
  ["de", "German"],
  ["el", "Greek"],
  ["gn", "Guarani"],
  ["gu", "Gujarati"],
  ["ht", "Haitian Creole"],
  ["ha", "Hausa"],
  ["haw", "Hawaiian"],
  ["iw", "Hebrew"],
  ["hi", "Hindi"],
  ["hmn", "Hmong"],
  ["hu", "Hungarian"],
  ["is", "Icelandic"],
  ["ig", "Igbo"],
  ["ilo", "Ilocano"],
  ["id", "Indonesian"],
  ["ga", "Irish"],
  ["it", "Italian"],
  ["ja", "Japanese"],
  ["jw", "Javanese"],
  ["kn", "Kannada"],
  ["kk", "Kazakh"],
  ["km", "Khmer"],
  ["rw", "Kinyarwanda"],
  ["gom", "Konkani"],
  ["ko", "Korean"],
  ["kri", "Krio"],
  ["ku", "Kurdish (Kurmanji)"],
  ["ckb", "Kurdish (Sorani)"],
  ["ky", "Kyrgyz"],
  ["lo", "Lao"],
  ["la", "Latin"],
  ["lv", "Latvian"],
  ["ln", "Lingala"],
  ["lt", "Lithuanian"],
  ["lg", "Luganda"],
  ["lb", "Luxembourgish"],
  ["mk", "Macedonian"],
  ["mai", "Maithili"],
  ["mg", "Malagasy"],
  ["ms", "Malay"],
  ["ml", "Malayalam"],
  ["mt", "Maltese"],
  ["mi", "Maori"],
  ["mr", "Marathi"],
  ["mni-Mtei", "Meiteilon (Manipuri)"],
  ["lus", "Mizo"],
  ["mn", "Mongolian"],
  ["my", "Myanmar (Burmese)"],
  ["ne", "Nepali"],
  ["no", "Norwegian"],
  ["or", "Odia (Oriya)"],
  ["om", "Oromo"],
  ["ps", "Pashto"],
  ["fa", "Persian"],
  ["pl", "Polish"],
  ["pt", "Portuguese"],
  ["pa", "Punjabi"],
  ["qu", "Quechua"],
  ["ro", "Romanian"],
  ["ru", "Russian"],
  ["sm", "Samoan"],
  ["sa", "Sanskrit"],
  ["gd", "Scots Gaelic"],
  ["nso", "Sepedi"],
  ["sr", "Serbian"],
  ["st", "Sesotho"],
  ["sn", "Shona"],
  ["sd", "Sindhi"],
  ["si", "Sinhala"],
  ["sk", "Slovak"],
  ["sl", "Slovenian"],
  ["so", "Somali"],
  ["es", "Spanish"],
  ["su", "Sundanese"],
  ["sw", "Swahili"],
  ["sv", "Swedish"],
  ["tg", "Tajik"],
  ["ta", "Tamil"],
  ["tt", "Tatar"],
  ["te", "Telugu"],
  ["th", "Thai"],
  ["ti", "Tigrinya"],
  ["ts", "Tsonga"],
  ["tr", "Turkish"],
  ["tk", "Turkmen"],
  ["ak", "Twi"],
  ["uk", "Ukrainian"],
  ["ur", "Urdu"],
  ["ug", "Uyghur"],
  ["uz", "Uzbek"],
  ["vi", "Vietnamese"],
  ["cy", "Welsh"],
  ["xh", "Xhosa"],
  ["yi", "Yiddish"],
  ["yo", "Yoruba"],
  ["zu", "Zulu"],
] as const;

function originalPageUrl(): string {
  if (typeof window === "undefined") return SITE_ORIGIN;
  return `${SITE_ORIGIN}${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function LanguageSelector({ mobile = false }: { mobile?: boolean }) {
  function changeLanguage(code: string) {
    if (typeof window === "undefined") return;

    const original = originalPageUrl();
    if (code === "en") {
      window.location.href = original;
      return;
    }

    const translated = `https://translate.google.com/translate?sl=en&tl=${encodeURIComponent(code)}&u=${encodeURIComponent(original)}`;
    window.location.href = translated;
  }

  return (
    <label
      className={
        mobile
          ? "notranslate flex min-h-11 w-full items-center gap-3 rounded-md border border-border bg-black/30 px-3"
          : "notranslate flex h-9 items-center gap-2 rounded-md border border-border bg-black/35 px-2"
      }
      translate="no"
    >
      <Globe2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      <span className={mobile ? "stencil text-[10px] tracking-[0.12em] text-primary" : "sr-only"}>
        Language
      </span>
      <select
        aria-label="Translate website"
        defaultValue="en"
        onChange={(event) => changeLanguage(event.target.value)}
        className={
          mobile
            ? "min-w-0 flex-1 bg-transparent py-2 text-sm text-fg outline-none"
            : "w-32 bg-transparent text-xs text-fg outline-none"
        }
      >
        {LANGUAGES.map(([code, name]) => (
          <option key={code} value={code} className="bg-black text-white">
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
