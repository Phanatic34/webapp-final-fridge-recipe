import OpenAI from "openai";

export const PREDEFINED_ALLERGENS = ["花生", "海鮮", "乳製品", "麩質", "蛋"] as const;
export type Allergen = (typeof PREDEFINED_ALLERGENS)[number];

export const KNOWN_INGREDIENT_ALLERGENS: Record<string, Allergen[]> = {
  // ── 蛋（原形）──────────────────────────────────────────────
  "雞蛋": ["蛋"], "鴨蛋": ["蛋"], "鵪鶉蛋": ["蛋"],
  "蛋白": ["蛋"], "蛋黃": ["蛋"], "皮蛋": ["蛋"],
  "鹹蛋": ["蛋"], "溏心蛋": ["蛋"], "水煮蛋": ["蛋"], "荷包蛋": ["蛋"],

  // 蛋（加工）
  "美乃滋": ["蛋"], "蛋黃醬": ["蛋"],
  "卡士達醬": ["蛋", "乳製品"], "卡士達": ["蛋", "乳製品"],
  "布丁": ["蛋", "乳製品"], "提拉米蘇": ["蛋", "乳製品"],
  "蛋塔": ["蛋", "乳製品"], "泡芙": ["蛋", "乳製品", "麩質"],
  "馬卡龍": ["蛋", "乳製品"],

  // ── 乳製品（原形）──────────────────────────────────────────
  "牛奶": ["乳製品"], "鮮奶": ["乳製品"], "鮮乳": ["乳製品"],
  "羊奶": ["乳製品"], "豆漿": [],

  // 乳製品（加工）
  "奶油": ["乳製品"], "無鹽奶油": ["乳製品"], "有鹽奶油": ["乳製品"],
  "鮮奶油": ["乳製品"], "動物性鮮奶油": ["乳製品"], "植物性鮮奶油": ["乳製品"],
  "起司": ["乳製品"], "起士": ["乳製品"],
  "帕瑪森起司": ["乳製品"], "莫扎瑞拉起司": ["乳製品"],
  "奶油起司": ["乳製品"], "馬斯卡彭起司": ["乳製品"], "馬斯卡彭": ["乳製品"],
  "乳酪": ["乳製品"], "優格": ["乳製品"], "煉乳": ["乳製品"],
  "奶粉": ["乳製品"], "白醬": ["乳製品", "麩質"], "焦糖奶酪": ["乳製品"],

  // ── 麩質（原形）────────────────────────────────────────────
  "小麥": ["麩質"], "大麥": ["麩質"], "黑麥": ["麩質"], "麵筋": ["麩質"],

  // 麩質（加工）
  "醬油": ["麩質"], "味噌": ["麩質"],
  "麵包粉": ["麩質"], "麵粉": ["麩質"],
  "低筋麵粉": ["麩質"], "高筋麵粉": ["麩質"], "中筋麵粉": ["麩質"],
  "烏龍麵": ["麩質"], "義大利麵": ["麩質"], "麵條": ["麩質"],
  "細麵": ["麩質"], "拉麵": ["麩質"], "冬陽麵": ["麩質"],
  "吐司": ["麩質", "乳製品"], "麵包": ["麩質"], "貝果": ["麩質"],
  "餃子皮": ["麩質"], "春捲皮": ["麩質"],
  "燕麥": ["麩質"], "烏醋": ["麩質"],

  // ── 花生（原形）────────────────────────────────────────────
  "花生": ["花生"],

  // 花生（加工）
  "花生醬": ["花生"], "花生粉": ["花生"], "花生油": ["花生"],
  "沙茶醬": ["花生", "海鮮"], "沙嗲醬": ["花生"],

  // ── 海鮮（原形）────────────────────────────────────────────
  "蝦": ["海鮮"], "蝦子": ["海鮮"], "草蝦": ["海鮮"], "白蝦": ["海鮮"],
  "明蝦": ["海鮮"], "龍蝦": ["海鮮"], "蝦仁": ["海鮮"],
  "蟹": ["海鮮"], "螃蟹": ["海鮮"], "花蟹": ["海鮮"],
  "帝王蟹": ["海鮮"], "蟹肉": ["海鮮"],
  "魚": ["海鮮"], "鮭魚": ["海鮮"], "鮪魚": ["海鮮"], "鯖魚": ["海鮮"],
  "鱈魚": ["海鮮"], "比目魚": ["海鮮"], "石斑魚": ["海鮮"],
  "吳郭魚": ["海鮮"], "秋刀魚": ["海鮮"], "虱目魚": ["海鮮"],
  "鯛魚": ["海鮮"], "土魠魚": ["海鮮"],
  "花枝": ["海鮮"], "魷魚": ["海鮮"], "章魚": ["海鮮"],
  "蛤蜊": ["海鮮"], "蚵仔": ["海鮮"], "牡蠣": ["海鮮"],
  "干貝": ["海鮮"], "文蛤": ["海鮮"], "蜆": ["海鮮"],

  // 海鮮（加工）
  "蠔油": ["海鮮"], "魚露": ["海鮮"], "蝦醬": ["海鮮"],
  "干貝醬": ["海鮮"], "柴魚片": ["海鮮"], "柴魚高湯": ["海鮮"],
  "昆布": ["海鮮"], "魚板": ["海鮮"], "蟹肉棒": ["海鮮"],
  "蝦米": ["海鮮"], "鯷魚": ["海鮮"], "烏魚子": ["海鮮"], "鰹魚": ["海鮮"],

  // ── English — Egg ───────────────────────────────────────────
  "egg": ["蛋"], "eggs": ["蛋"], "egg yolk": ["蛋"], "egg white": ["蛋"],
  "mayonnaise": ["蛋"], "mayo": ["蛋"],
  "custard": ["蛋", "乳製品"], "pudding": ["蛋", "乳製品"],
  "tiramisu": ["蛋", "乳製品"], "eclair": ["蛋", "乳製品", "麩質"],
  "macaron": ["蛋", "乳製品"],

  // ── English — Dairy ─────────────────────────────────────────
  "milk": ["乳製品"], "whole milk": ["乳製品"], "skim milk": ["乳製品"],
  "goat milk": ["乳製品"],
  "butter": ["乳製品"], "unsalted butter": ["乳製品"], "salted butter": ["乳製品"],
  "cream": ["乳製品"], "heavy cream": ["乳製品"], "whipping cream": ["乳製品"],
  "sour cream": ["乳製品"], "half and half": ["乳製品"],
  "cheese": ["乳製品"], "parmesan": ["乳製品"], "mozzarella": ["乳製品"],
  "cream cheese": ["乳製品"], "mascarpone": ["乳製品"],
  "cheddar": ["乳製品"], "brie": ["乳製品"], "gouda": ["乳製品"],
  "yogurt": ["乳製品"], "yoghurt": ["乳製品"],
  "condensed milk": ["乳製品"], "evaporated milk": ["乳製品"],
  "milk powder": ["乳製品"], "powdered milk": ["乳製品"],
  "whey": ["乳製品"], "bechamel": ["乳製品", "麩質"],

  // ── English — Gluten ────────────────────────────────────────
  "wheat": ["麩質"], "barley": ["麩質"], "rye": ["麩質"],
  "oat": ["麩質"], "oats": ["麩質"], "oatmeal": ["麩質"],
  "flour": ["麩質"], "all-purpose flour": ["麩質"],
  "cake flour": ["麩質"], "bread flour": ["麩質"], "wheat flour": ["麩質"],
  "breadcrumbs": ["麩質"], "bread crumbs": ["麩質"],
  "soy sauce": ["麩質"], "miso": ["麩質"],
  "pasta": ["麩質"], "noodles": ["麩質"], "udon": ["麩質"],
  "ramen": ["麩質"], "spaghetti": ["麩質"], "fettuccine": ["麩質"],
  "bread": ["麩質"], "toast": ["麩質", "乳製品"], "bagel": ["麩質"],
  "dumpling wrapper": ["麩質"], "spring roll wrapper": ["麩質"],

  // ── English — Peanut ────────────────────────────────────────
  "peanut": ["花生"], "peanuts": ["花生"],
  "peanut butter": ["花生"], "peanut powder": ["花生"], "peanut oil": ["花生"],
  "satay sauce": ["花生", "海鮮"], "satay": ["花生"],
  "groundnut": ["花生"], "groundnuts": ["花生"],

  // ── English — Seafood ───────────────────────────────────────
  "shrimp": ["海鮮"], "shrimps": ["海鮮"], "prawn": ["海鮮"], "prawns": ["海鮮"],
  "crab": ["海鮮"], "lobster": ["海鮮"],
  "fish": ["海鮮"], "salmon": ["海鮮"], "tuna": ["海鮮"],
  "cod": ["海鮮"], "mackerel": ["海鮮"], "sea bass": ["海鮮"],
  "tilapia": ["海鮮"], "sardine": ["海鮮"], "sardines": ["海鮮"],
  "squid": ["海鮮"], "octopus": ["海鮮"], "calamari": ["海鮮"],
  "oyster": ["海鮮"], "clam": ["海鮮"], "clams": ["海鮮"],
  "scallop": ["海鮮"], "scallops": ["海鮮"],
  "mussel": ["海鮮"], "mussels": ["海鮮"],
  "anchovy": ["海鮮"], "anchovies": ["海鮮"],
  "oyster sauce": ["海鮮"], "fish sauce": ["海鮮"], "shrimp paste": ["海鮮"],
  "dried shrimp": ["海鮮"], "fish cake": ["海鮮"], "surimi": ["海鮮"],
  "bonito flakes": ["海鮮"], "dashi": ["海鮮"], "kombu": ["海鮮"],
};

/**
 * Broad keywords used only for substring matching.
 * Ordered longest-first so more specific patterns win before shorter ones.
 * These cover generic terms that won't appear as exact ingredient names
 * (e.g. "海鮮" in "海鮮卷", "蛋" in "蛋炒飯").
 */
const SUBSTRING_KEYWORDS: Array<[string, Allergen[]]> = [
  // 蛋
  ["蛋黃醬", ["蛋"]],
  ["雞蛋", ["蛋"]], ["鴨蛋", ["蛋"]], ["鵪鶉蛋", ["蛋"]],
  ["蛋白", ["蛋"]], ["蛋黃", ["蛋"]],
  ["蛋", ["蛋"]],
  ["egg white", ["蛋"]], ["egg yolk", ["蛋"]], ["egg", ["蛋"]],

  // 乳製品
  ["鮮奶油", ["乳製品"]], ["奶油起司", ["乳製品"]], ["奶油", ["乳製品"]],
  ["鮮奶", ["乳製品"]], ["牛奶", ["乳製品"]], ["羊奶", ["乳製品"]],
  ["起司", ["乳製品"]], ["起士", ["乳製品"]], ["乳酪", ["乳製品"]],
  ["優格", ["乳製品"]], ["煉乳", ["乳製品"]], ["奶粉", ["乳製品"]],
  ["奶", ["乳製品"]],   // 奶茶、奶黃包 等
  ["cream cheese", ["乳製品"]], ["heavy cream", ["乳製品"]],
  ["whipping cream", ["乳製品"]], ["sour cream", ["乳製品"]],
  ["cheese", ["乳製品"]], ["butter", ["乳製品"]], ["cream", ["乳製品"]],
  ["milk", ["乳製品"]], ["dairy", ["乳製品"]], ["yogurt", ["乳製品"]],

  // 麩質
  ["低筋麵粉", ["麩質"]], ["高筋麵粉", ["麩質"]], ["中筋麵粉", ["麩質"]],
  ["義大利麵", ["麩質"]], ["烏龍麵", ["麩質"]],
  ["麵包粉", ["麩質"]], ["麵包", ["麩質"]], ["麵粉", ["麩質"]], ["麵條", ["麩質"]],
  ["麵", ["麩質"]],     // 拉麵、細麵、炒麵 等
  ["醬油", ["麩質"]], ["味噌", ["麩質"]],
  ["all-purpose flour", ["麩質"]], ["bread flour", ["麩質"]], ["cake flour", ["麩質"]],
  ["breadcrumbs", ["麩質"]], ["wheat flour", ["麩質"]],
  ["wheat", ["麩質"]], ["flour", ["麩質"]], ["gluten", ["麩質"]],
  ["pasta", ["麩質"]], ["noodle", ["麩質"]],
  ["barley", ["麩質"]], ["rye", ["麩質"]], ["oat", ["麩質"]],

  // 花生
  ["花生醬", ["花生"]], ["花生油", ["花生"]], ["花生粉", ["花生"]],
  ["花生", ["花生"]],
  ["peanut butter", ["花生"]], ["peanut oil", ["花生"]],
  ["peanut", ["花生"]], ["groundnut", ["花生"]],

  // 海鮮
  ["海鮮", ["海鮮"]],
  ["蝦仁", ["海鮮"]], ["草蝦", ["海鮮"]], ["白蝦", ["海鮮"]], ["龍蝦", ["海鮮"]],
  ["蝦", ["海鮮"]],
  ["帝王蟹", ["海鮮"]], ["螃蟹", ["海鮮"]], ["花蟹", ["海鮮"]],
  ["蟹", ["海鮮"]],
  ["鮭魚", ["海鮮"]], ["鮪魚", ["海鮮"]], ["鯖魚", ["海鮮"]], ["鱈魚", ["海鮮"]],
  ["比目魚", ["海鮮"]], ["石斑魚", ["海鮮"]], ["秋刀魚", ["海鮮"]],
  ["魷魚", ["海鮮"]], ["章魚", ["海鮮"]], ["花枝", ["海鮮"]],
  ["蛤蜊", ["海鮮"]], ["蚵仔", ["海鮮"]], ["牡蠣", ["海鮮"]], ["干貝", ["海鮮"]],
  ["柴魚", ["海鮮"]], ["魚露", ["海鮮"]], ["蠔油", ["海鮮"]], ["蝦醬", ["海鮮"]],
  ["魚", ["海鮮"]],   // 魚排、魚片、魚丸 等 (魚香茄子不會是食材名稱)
  ["shrimp", ["海鮮"]], ["prawn", ["海鮮"]], ["crab", ["海鮮"]], ["lobster", ["海鮮"]],
  ["salmon", ["海鮮"]], ["tuna", ["海鮮"]], ["cod", ["海鮮"]], ["squid", ["海鮮"]],
  ["oyster", ["海鮮"]], ["clam", ["海鮮"]], ["scallop", ["海鮮"]],
  ["anchovy", ["海鮮"]], ["seafood", ["海鮮"]],
  ["fish sauce", ["海鮮"]], ["oyster sauce", ["海鮮"]], ["fish", ["海鮮"]],
];

export function lookupAllergens(name: string): Allergen[] | null {
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  // 1. Exact match (case-insensitive) in known ingredient map
  for (const [k, v] of Object.entries(KNOWN_INGREDIENT_ALLERGENS)) {
    if (k.toLowerCase() === lower) return v;
  }

  // 2. Substring match using broad keyword patterns
  const found = new Set<Allergen>();
  for (const [keyword, allergens] of SUBSTRING_KEYWORDS) {
    if (lower.includes(keyword.toLowerCase())) {
      for (const a of allergens) found.add(a);
    }
  }
  if (found.size > 0) return [...found];

  return null;
}

let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) openaiClient = new OpenAI();
  return openaiClient;
}

export async function detectAllergensWithAI(name: string): Promise<Allergen[]> {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `你是食品過敏原辨識助手。判斷食材所含的過敏原，只從以下類別中選擇：${PREDEFINED_ALLERGENS.join("、")}。請直接回答 JSON 陣列，例如 ["蛋","乳製品"]。若不含任何過敏原則回答 []。不要有其他文字。`,
      },
      { role: "user", content: `食材：${name}` },
    ],
    max_tokens: 60,
    temperature: 0,
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "[]";
  try {
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (a): a is Allergen =>
          typeof a === "string" &&
          (PREDEFINED_ALLERGENS as readonly string[]).includes(a)
      );
    }
  } catch {}
  return [];
}

export async function autoDetectAllergens(
  name: string
): Promise<{ allergens: Allergen[]; source: "known" | "ai" | "error" }> {
  const known = lookupAllergens(name);
  if (known !== null) return { allergens: known, source: "known" };

  try {
    const allergens = await detectAllergensWithAI(name);
    return { allergens, source: "ai" };
  } catch (e) {
    console.error("[allergen AI error]", e);
    return { allergens: [], source: "error" };
  }
}
