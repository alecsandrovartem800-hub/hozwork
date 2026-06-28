import { Router, Request, Response } from 'express';
import { getSupabase } from '../supabase';

const router = Router();

interface FlavorItem {
  id: number;
  name: string;
  category: string;
  description: string;
  brand: { name: string };
}

const DESCRIPTIONS = [
  "Восхитительное сбалансированное сочетание. Сладкая основа раскрывается яркими фруктовыми оттенками, а мягкий освежающий акцент оставляет приятное послевкусие.",
  "Идеальный вечерний микс с глубоким ароматом. Ягодные тона гармонично сплетаются с легкой кислинкой цитруса, создавая насыщенный и плотный дым.",
  "Освежающий тропический коктейль. Экзотические нотки подчеркивают натуральный вкус премиального табака, а сливочный холодок делает затяжку невероятно мягкой.",
  "Насыщенный десертный микс для ценителей. Нежные кондитерские нотки отлично контрастируют с пряными специями и оставляют долгое сладкое послевкусие.",
  "Классический бодрящий микс. Кисло-сладкий цитрусовый дуэт сбалансирован ледяной мятой, создавая бодрящий эффект с первой затяжки."
];

// GET /api/ai/mix — Generate smart AI mix recommendation
router.get('/mix', async (_req: Request, res: Response) => {
  try {
    const db = getSupabase();

    // 1. Fetch available flavors in stock
    const { data: flavorsData, error } = await db
      .from('tobacco_flavors')
      .select(`
        id, name, category, description,
        brand:tobacco_brands(name)
      `)
      .gt('stock_grams', 10)
      .eq('is_visible', true);

    if (error) throw error;
    if (!flavorsData || flavorsData.length === 0) {
      return res.status(404).json({ error: 'Нет доступных вкусов табака в наличии' });
    }

    const flavors = flavorsData as unknown as FlavorItem[];

    // 2. Select 2-3 random flavors, preferably from different categories
    const mixCount = Math.random() > 0.5 ? 3 : 2;
    const selectedFlavors: FlavorItem[] = [];
    const usedCategories = new Set<string>();

    // Shuffle and pick
    const shuffled = [...flavors].sort(() => Math.random() - 0.5);

    for (const f of shuffled) {
      if (selectedFlavors.length >= mixCount) break;
      
      // Try to get different categories for rich taste, or just add if not enough variety
      if (!usedCategories.has(f.category) || selectedFlavors.length === 0) {
        selectedFlavors.push(f);
        usedCategories.add(f.category);
      }
    }

    // Fallback if strict categories logic failed to find enough items
    if (selectedFlavors.length < mixCount && shuffled.length > selectedFlavors.length) {
      for (const f of shuffled) {
        if (selectedFlavors.length >= mixCount) break;
        if (!selectedFlavors.find(sf => sf.id === f.id)) {
          selectedFlavors.push(f);
        }
      }
    }

    // 3. Distribute grams (total should be ~25g - 30g)
    let gramsList = [15, 10, 5];
    if (selectedFlavors.length === 2) {
      gramsList = [18, 12];
    }

    const mixItems = selectedFlavors.map((f, i) => ({
      flavor_id: f.id,
      name: f.name,
      brand: f.brand?.name || 'Unknown',
      grams: gramsList[i] || 10,
      category: f.category
    }));

    // 4. Construct AI description
    const randomDesc = DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];
    const flavorsString = mixItems.map(m => `«${m.brand} ${m.name}» (${m.grams}г)`).join(', ');
    const aiDescription = `ИИ-миксолог рекомендует: ${randomDesc} В миксе используются: ${flavorsString}.`;

    // 5. Generate a fancy name
    const adjectives = ["Дымный", "Космический", "Тропический", "Ледяной", "Цитрусовый", "Золотой", "Мягкий"];
    const nouns = ["Взрыв", "Закат", "Бриз", "Секрет", "Шторм", "Бархат", "Каприз"];
    const mixName = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;

    res.json({
      name: mixName,
      description: aiDescription,
      items: mixItems
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
