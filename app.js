/**
 * FoodCheck - Aplicación de Estimaciones Nutricionales
 * Versión moderna con ES6+, LLaVA (Cloudflare Workers AI) y OpenFoodFacts
 */

// ========================================
// Constantes y Configuración
// ========================================
const CONFIG = {
    // Cloudflare Worker Proxy (TU PROPIO WORKER)
    // El worker está configurado en: https://foodcheck-api.devs-fed.workers.dev
    WORKER_API_URL: 'https://foodcheck-api.devs-fed.workers.dev',

    // OpenFoodFacts API
    API_BASE_URL: 'https://world.openfoodfacts.org/cgi/search.pl',
    API_PRODUCT_URL: 'https://world.openfoodfacts.org/api/v2/product',

    // Configuración
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10 MB
    ALLOWED_FORMATS: ['image/jpeg', 'image/png', 'image/heic'],

    STORAGE_KEYS: {
        CONDITIONS: 'foodcheck_conditions',
        FOODS: 'foodcheck_foods',
        DAILY_LOG: 'foodcheck_daily_log',
        CURRENT_DATE: 'foodcheck_current_date'
    },

    NUTRITION_GOALS: {
        protein: { default: 50, diabetes: 45, renal: 40, hipertension: 55, colesterol: 50 },
        carbs: { default: 250, diabetes: 200, renal: 220, hipertension: 260, colesterol: 240 },
        fats: { default: 70, diabetes: 65, renal: 60, hipertension: 65, colesterol: 55 },
        sodium: { default: 2300, diabetes: 2300, renal: 1500, hipertension: 1500, colesterol: 2000 },
        sugars: { default: 50, diabetes: 25, renal: 45, hipertension: 50, colesterol: 45 },
        fiber: { default: 25, diabetes: 30, renal: 20, hipertension: 28, colesterol: 30 },
        saturatedFats: { default: 20, diabetes: 15, renal: 12, hipertension: 15, colesterol: 13 }
    },

    // Base de datos nutricional extendida
    FOOD_DATABASE: {
        // Frutas
        'plátano': { name: 'Plátano', category: 'fruta', nutrition: { protein: 1.1, carbs: 23, fats: 0.3, sugars: 12, fiber: 2.6, sodium: 1, saturatedFats: 0.1 }, portion: 120 },
        'banana': { name: 'Plátano', category: 'fruta', nutrition: { protein: 1.1, carbs: 23, fats: 0.3, sugars: 12, fiber: 2.6, sodium: 1, saturatedFats: 0.1 }, portion: 120 },
        'manzana': { name: 'Manzana', category: 'fruta', nutrition: { protein: 0.3, carbs: 14, fats: 0.2, sugars: 10, fiber: 2.4, sodium: 1, saturatedFats: 0.03 }, portion: 180 },
        'apple': { name: 'Manzana', category: 'fruta', nutrition: { protein: 0.3, carbs: 14, fats: 0.2, sugars: 10, fiber: 2.4, sodium: 1, saturatedFats: 0.03 }, portion: 180 },
        'naranja': { name: 'Naranja', category: 'fruta', nutrition: { protein: 0.9, carbs: 12, fats: 0.1, sugars: 9, fiber: 2.4, sodium: 0, saturatedFats: 0.02 }, portion: 150 },
        'orange': { name: 'Naranja', category: 'fruta', nutrition: { protein: 0.9, carbs: 12, fats: 0.1, sugars: 9, fiber: 2.4, sodium: 0, saturatedFats: 0.02 }, portion: 150 },
        'uva': { name: 'Uvas', category: 'fruta', nutrition: { protein: 0.6, carbs: 17, fats: 0.2, sugars: 15, fiber: 0.8, sodium: 2, saturatedFats: 0.05 }, portion: 100 },
        'fresa': { name: 'Fresas', category: 'fruta', nutrition: { protein: 0.7, carbs: 8, fats: 0.3, sugars: 4.9, fiber: 2, sodium: 1, saturatedFats: 0.02 }, portion: 150 },
        'strawberry': { name: 'Fresas', category: 'fruta', nutrition: { protein: 0.7, carbs: 8, fats: 0.3, sugars: 4.9, fiber: 2, sodium: 1, saturatedFats: 0.02 }, portion: 150 },
        'sandía': { name: 'Sandía', category: 'fruta', nutrition: { protein: 0.6, carbs: 8, fats: 0.2, sugars: 6, fiber: 0.4, sodium: 1, saturatedFats: 0.02 }, portion: 300 },
        'melón': { name: 'Melón', category: 'fruta', nutrition: { protein: 0.5, carbs: 8, fats: 0.1, sugars: 6, fiber: 0.8, sodium: 10, saturatedFats: 0.02 }, portion: 200 },
        'pera': { name: 'Pera', category: 'fruta', nutrition: { protein: 0.4, carbs: 15, fats: 0.1, sugars: 10, fiber: 3.1, sodium: 1, saturatedFats: 0.02 }, portion: 180 },
        'mango': { name: 'Mango', category: 'fruta', nutrition: { protein: 0.8, carbs: 15, fats: 0.4, sugars: 14, fiber: 1.6, sodium: 1, saturatedFats: 0.1 }, portion: 200 },
        'piña': { name: 'Piña', category: 'fruta', nutrition: { protein: 0.5, carbs: 13, fats: 0.1, sugars: 10, fiber: 1.4, sodium: 1, saturatedFats: 0.01 }, portion: 200 },
        'kiwi': { name: 'Kiwi', category: 'fruta', nutrition: { protein: 1.1, carbs: 15, fats: 0.5, sugars: 9, fiber: 3, sodium: 3, saturatedFats: 0.07 }, portion: 100 },
        'cereza': { name: 'Cerezas', category: 'fruta', nutrition: { protein: 1, carbs: 16, fats: 0.2, sugars: 12, fiber: 2.1, sodium: 0, saturatedFats: 0.03 }, portion: 100 },
        'limón': { name: 'Limón', category: 'fruta', nutrition: { protein: 1.1, carbs: 9, fats: 0.3, sugars: 2.5, fiber: 2.8, sodium: 2, saturatedFats: 0.04 }, portion: 50 },
        'lemon': { name: 'Limón', category: 'fruta', nutrition: { protein: 1.1, carbs: 9, fats: 0.3, sugars: 2.5, fiber: 2.8, sodium: 2, saturatedFats: 0.04 }, portion: 50 },

        // Verduras y vegetales
        'brócoli': { name: 'Brócoli', category: 'verdura', nutrition: { protein: 2.8, carbs: 7, fats: 0.4, sugars: 1.7, fiber: 2.6, sodium: 33, saturatedFats: 0.04 }, portion: 150 },
        'broccoli': { name: 'Brócoli', category: 'verdura', nutrition: { protein: 2.8, carbs: 7, fats: 0.4, sugars: 1.7, fiber: 2.6, sodium: 33, saturatedFats: 0.04 }, portion: 150 },
        'zanahoria': { name: 'Zanahoria', category: 'verdura', nutrition: { protein: 0.9, carbs: 10, fats: 0.2, sugars: 4.7, fiber: 2.8, sodium: 69, saturatedFats: 0.03 }, portion: 100 },
        'carrot': { name: 'Zanahoria', category: 'verdura', nutrition: { protein: 0.9, carbs: 10, fats: 0.2, sugars: 4.7, fiber: 2.8, sodium: 69, saturatedFats: 0.03 }, portion: 100 },
        'lechuga': { name: 'Lechuga', category: 'verdura', nutrition: { protein: 1.4, carbs: 3, fats: 0.2, sugars: 0.8, fiber: 1.3, sodium: 28, saturatedFats: 0.03 }, portion: 100 },
        'lettuce': { name: 'Lechuga', category: 'verdura', nutrition: { protein: 1.4, carbs: 3, fats: 0.2, sugars: 0.8, fiber: 1.3, sodium: 28, saturatedFats: 0.03 }, portion: 100 },
        'tomate': { name: 'Tomate', category: 'verdura', nutrition: { protein: 0.9, carbs: 3.9, fats: 0.2, sugars: 2.6, fiber: 1.2, sodium: 5, saturatedFats: 0.03 }, portion: 150 },
        'tomato': { name: 'Tomate', category: 'verdura', nutrition: { protein: 0.9, carbs: 3.9, fats: 0.2, sugars: 2.6, fiber: 1.2, sodium: 5, saturatedFats: 0.03 }, portion: 150 },
        'patata': { name: 'Patata', category: 'verdura', nutrition: { protein: 2, carbs: 17, fats: 0.1, sugars: 0.8, fiber: 2.2, sodium: 6, saturatedFats: 0.03 }, portion: 200 },
        'potato': { name: 'Patata', category: 'verdura', nutrition: { protein: 2, carbs: 17, fats: 0.1, sugars: 0.8, fiber: 2.2, sodium: 6, saturatedFats: 0.03 }, portion: 200 },
        'papa': { name: 'Patata', category: 'verdura', nutrition: { protein: 2, carbs: 17, fats: 0.1, sugars: 0.8, fiber: 2.2, sodium: 6, saturatedFats: 0.03 }, portion: 200 },
        'cebolla': { name: 'Cebolla', category: 'verdura', nutrition: { protein: 1.1, carbs: 9, fats: 0.1, sugars: 4.2, fiber: 1.7, sodium: 4, saturatedFats: 0.03 }, portion: 100 },
        'onion': { name: 'Cebolla', category: 'verdura', nutrition: { protein: 1.1, carbs: 9, fats: 0.1, sugars: 4.2, fiber: 1.7, sodium: 4, saturatedFats: 0.03 }, portion: 100 },
        'pimiento': { name: 'Pimiento', category: 'verdura', nutrition: { protein: 1, carbs: 6, fats: 0.3, sugars: 4.2, fiber: 2.1, sodium: 4, saturatedFats: 0.03 }, portion: 150 },
        'pepper': { name: 'Pimiento', category: 'verdura', nutrition: { protein: 1, carbs: 6, fats: 0.3, sugars: 4.2, fiber: 2.1, sodium: 4, saturatedFats: 0.03 }, portion: 150 },
        'espinaca': { name: 'Espinacas', category: 'verdura', nutrition: { protein: 2.9, carbs: 3.6, fats: 0.4, sugars: 0.4, fiber: 2.2, sodium: 79, saturatedFats: 0.06 }, portion: 100 },
        'spinach': { name: 'Espinacas', category: 'verdura', nutrition: { protein: 2.9, carbs: 3.6, fats: 0.4, sugars: 0.4, fiber: 2.2, sodium: 79, saturatedFats: 0.06 }, portion: 100 },
        'coliflor': { name: 'Coliflor', category: 'verdura', nutrition: { protein: 1.9, carbs: 5, fats: 0.3, sugars: 1.9, fiber: 2, sodium: 30, saturatedFats: 0.1 }, portion: 150 },
        'cauliflower': { name: 'Coliflor', category: 'verdura', nutrition: { protein: 1.9, carbs: 5, fats: 0.3, sugars: 1.9, fiber: 2, sodium: 30, saturatedFats: 0.1 }, portion: 150 },
        'pepino': { name: 'Pepino', category: 'verdura', nutrition: { protein: 0.7, carbs: 3.6, fats: 0.1, sugars: 1.7, fiber: 0.5, sodium: 2, saturatedFats: 0.03 }, portion: 200 },
        'cucumber': { name: 'Pepino', category: 'verdura', nutrition: { protein: 0.7, carbs: 3.6, fats: 0.1, sugars: 1.7, fiber: 0.5, sodium: 2, saturatedFats: 0.03 }, portion: 200 },
        'apio': { name: 'Apio', category: 'verdura', nutrition: { protein: 0.7, carbs: 3, fats: 0.2, sugars: 1.3, fiber: 1.6, sodium: 80, saturatedFats: 0.04 }, portion: 100 },
        'celery': { name: 'Apio', category: 'verdura', nutrition: { protein: 0.7, carbs: 3, fats: 0.2, sugars: 1.3, fiber: 1.6, sodium: 80, saturatedFats: 0.04 }, portion: 100 },
        'calabacín': { name: 'Calabacín', category: 'verdura', nutrition: { protein: 1.2, carbs: 3.1, fats: 0.3, sugars: 2.5, fiber: 1, sodium: 8, saturatedFats: 0.08 }, portion: 150 },
        'zucchini': { name: 'Calabacín', category: 'verdura', nutrition: { protein: 1.2, carbs: 3.1, fats: 0.3, sugars: 2.5, fiber: 1, sodium: 8, saturatedFats: 0.08 }, portion: 150 },
        'berenjena': { name: 'Berenjena', category: 'verdura', nutrition: { protein: 1, carbs: 6, fats: 0.2, sugars: 3.5, fiber: 3, sodium: 2, saturatedFats: 0.04 }, portion: 150 },
        'eggplant': { name: 'Berenjena', category: 'verdura', nutrition: { protein: 1, carbs: 6, fats: 0.2, sugars: 3.5, fiber: 3, sodium: 2, saturatedFats: 0.04 }, portion: 150 },
        'remolacha': { name: 'Remolacha', category: 'verdura', nutrition: { protein: 1.6, carbs: 10, fats: 0.2, sugars: 7, fiber: 2.8, sodium: 78, saturatedFats: 0.03 }, portion: 100 },
        'beet': { name: 'Remolacha', category: 'verdura', nutrition: { protein: 1.6, carbs: 10, fats: 0.2, sugars: 7, fiber: 2.8, sodium: 78, saturatedFats: 0.03 }, portion: 100 },

        // Carnes y proteínas
        'pollo': { name: 'Pollo', category: 'carne', nutrition: { protein: 27, carbs: 0, fats: 6, sugars: 0, fiber: 0, sodium: 82, saturatedFats: 1.7 }, portion: 150 },
        'chicken': { name: 'Pollo', category: 'carne', nutrition: { protein: 27, carbs: 0, fats: 6, sugars: 0, fiber: 0, sodium: 82, saturatedFats: 1.7 }, portion: 150 },
        'res': { name: 'Carne de res', category: 'carne', nutrition: { protein: 26, carbs: 0, fats: 15, sugars: 0, fiber: 0, sodium: 72, saturatedFats: 6.5 }, portion: 150 },
        'beef': { name: 'Carne de res', category: 'carne', nutrition: { protein: 26, carbs: 0, fats: 15, sugars: 0, fiber: 0, sodium: 72, saturatedFats: 6.5 }, portion: 150 },
        'cerdo': { name: 'Carne de cerdo', category: 'carne', nutrition: { protein: 25, carbs: 0, fats: 20, sugars: 0, fiber: 0, sodium: 62, saturatedFats: 7 }, portion: 150 },
        'pork': { name: 'Carne de cerdo', category: 'carne', nutrition: { protein: 25, carbs: 0, fats: 20, sugars: 0, fiber: 0, sodium: 62, saturatedFats: 7 }, portion: 150 },
        'hamburguesa': { name: 'Hamburguesa', category: 'carne', nutrition: { protein: 20, carbs: 25, fats: 18, sugars: 5, fiber: 1, sodium: 400, saturatedFats: 7 }, unidad: 150 },
        'hamburger': { name: 'Hamburguesa', category: 'carne', nutrition: { protein: 20, carbs: 25, fats: 18, sugars: 5, fiber: 1, sodium: 400, saturatedFats: 7 }, portion: 150 },
        'bacon': { name: 'Tocino', category: 'carne', nutrition: { protein: 3, carbs: 0.1, fats: 3.3, sugars: 0, fiber: 0, sodium: 137, saturatedFats: 1.1 }, portion: 10 },
        'tocino': { name: 'Tocino', category: 'carne', nutrition: { protein: 3, carbs: 0.1, fats: 3.3, sugars: 0, fiber: 0, sodium: 137, saturatedFats: 1.1 }, portion: 10 },
        'salchicha': { name: 'Salchicha', category: 'carne', nutrition: { protein: 10, carbs: 2, fats: 22, sugars: 1, fiber: 0, sodium: 800, saturatedFats: 8 }, portion: 80 },
        'sausage': { name: 'Salchicha', category: 'carne', nutrition: { protein: 10, carbs: 2, fats: 22, sugars: 1, fiber: 0, sodium: 800, saturatedFats: 8 }, portion: 80 },
        'hot dog': { name: 'Hot dog', category: 'carne', nutrition: { protein: 10, carbs: 24, fats: 22, sugars: 3, fiber: 0.5, sodium: 800, saturatedFats: 8 }, portion: 100 },
        'pescado': { name: 'Pescado', category: 'carne', nutrition: { protein: 22, carbs: 0, fats: 4, sugars: 0, fiber: 0, sodium: 60, saturatedFats: 1 }, portion: 150 },
        'fish': { name: 'Pescado', category: 'carne', nutrition: { protein: 22, carbs: 0, fats: 4, sugars: 0, fiber: 0, sodium: 60, saturatedFats: 1 }, portion: 150 },
        'salmón': { name: 'Salmón', category: 'carne', nutrition: { protein: 25, carbs: 0, fats: 13, sugars: 0, fiber: 0, sodium: 59, saturatedFats: 3 }, portion: 150 },
        'salmon': { name: 'Salmón', category: 'carne', nutrition: { protein: 25, carbs: 0, fats: 13, sugars: 0, fiber: 0, sodium: 59, saturatedFats: 3 }, portion: 150 },
        'atún': { name: 'Atún', category: 'carne', nutrition: { protein: 26, carbs: 0, fats: 1, sugars: 0, fiber: 0, sodium: 320, saturatedFats: 0.2 }, portion: 100 },
        'tuna': { name: 'Atún', category: 'carne', nutrition: { protein: 26, carbs: 0, fats: 1, sugars: 0, fiber: 0, sodium: 320, saturatedFats: 0.2 }, portion: 100 },
        'huevo': { name: 'Huevo', category: 'proteína', nutrition: { protein: 6, carbs: 0.6, fats: 5, sugars: 0.6, fiber: 0, sodium: 62, saturatedFats: 1.6 }, portion: 50 },
        'egg': { name: 'Huevo', category: 'proteína', nutrition: { protein: 6, carbs: 0.6, fats: 5, sugars: 0.6, fiber: 0, sodium: 62, saturatedFats: 1.6 }, portion: 50 },
        'huevos': { name: 'Huevos', category: 'proteína', nutrition: { protein: 6, carbs: 0.6, fats: 5, sugars: 0.6, fiber: 0, sodium: 62, saturatedFats: 1.6 }, portion: 50 },

        // Lácteos
        'leche': { name: 'Leche', category: 'lácteo', nutrition: { protein: 3.4, carbs: 5, fats: 1, sugars: 5, fiber: 0, sodium: 44, saturatedFats: 0.6 }, portion: 250 },
        'milk': { name: 'Leche', category: 'lácteo', nutrition: { protein: 3.4, carbs: 5, fats: 1, sugars: 5, fiber: 0, sodium: 44, saturatedFats: 0.6 }, portion: 250 },
        'queso': { name: 'Queso', category: 'lácteo', nutrition: { protein: 25, carbs: 1.3, fats: 33, sugars: 0.5, fiber: 0, sodium: 621, saturatedFats: 21 }, portion: 100 },
        'cheese': { name: 'Queso', category: 'lácteo', nutrition: { protein: 25, carbs: 1.3, fats: 33, sugars: 0.5, fiber: 0, sodium: 621, saturatedFats: 21 }, portion: 100 },
        'yogur': { name: 'Yogur', category: 'lácteo', nutrition: { protein: 5, carbs: 7, fats: 1.5, sugars: 7, fiber: 0, sodium: 36, saturatedFats: 0.9 }, portion: 125 },
        'yogurt': { name: 'Yogur', category: 'lácteo', nutrition: { protein: 5, carbs: 7, fats: 1.5, sugars: 7, fiber: 0, sodium: 36, saturatedFats: 0.9 }, portion: 125 },
        'mantequilla': { name: 'Mantequilla', category: 'lácteo', nutrition: { protein: 0.9, carbs: 0.1, fats: 81, sugars: 0.1, fiber: 0, sodium: 11, saturatedFats: 51 }, portion: 15 },
        'butter': { name: 'Mantequilla', category: 'lácteo', nutrition: { protein: 0.9, carbs: 0.1, fats: 81, sugars: 0.1, fiber: 0, sodium: 11, saturatedFats: 51 }, portion: 15 },
        'nata': { name: 'Nata', category: 'lácteo', nutrition: { protein: 2.8, carbs: 2.8, fats: 35, sugars: 2.8, fiber: 0, sodium: 30, saturatedFats: 23 }, portion: 50 },
        'cream': { name: 'Nata', category: 'lácteo', nutrition: { protein: 2.8, carbs: 2.8, fats: 35, sugars: 2.8, fiber: 0, sodium: 30, saturatedFats: 23 }, portion: 50 },

        // Cereales y panes
        'pan': { name: 'Pan', category: 'cereal', nutrition: { protein: 9, carbs: 49, fats: 3.2, sugars: 5, fiber: 2.7, sodium: 491, saturatedFats: 0.7 }, portion: 80 },
        'bread': { name: 'Pan', category: 'cereal', nutrition: { protein: 9, carbs: 49, fats: 3.2, sugars: 5, fiber: 2.7, sodium: 491, saturatedFats: 0.7 }, portion: 80 },
        'arroz': { name: 'Arroz', category: 'cereal', nutrition: { protein: 2.7, carbs: 28, fats: 0.3, sugars: 0.1, fiber: 0.4, sodium: 1, saturatedFats: 0.1 }, portion: 150 },
        'rice': { name: 'Arroz', category: 'cereal', nutrition: { protein: 2.7, carbs: 28, fats: 0.3, sugars: 0.1, fiber: 0.4, sodium: 1, saturatedFats: 0.1 }, portion: 150 },
        'pasta': { name: 'Pasta', category: 'cereal', nutrition: { protein: 5, carbs: 31, fats: 1.1, sugars: 0.6, fiber: 1.8, sodium: 1, saturatedFats: 0.2 }, portion: 150 },
        'spaghetti': { name: 'Pasta', category: 'cereal', nutrition: { protein: 5, carbs: 31, fats: 1.1, sugars: 0.6, fiber: 1.8, sodium: 1, saturatedFats: 0.2 }, portion: 150 },
        'fideos': { name: 'Fideos', category: 'cereal', nutrition: { protein: 5, carbs: 31, fats: 1.1, sugars: 0.6, fiber: 1.8, sodium: 1, saturatedFats: 0.2 }, portion: 150 },
        'avena': { name: 'Avena', category: 'cereal', nutrition: { protein: 5, carbs: 27, fats: 2.5, sugars: 0.5, fiber: 4, sodium: 3, saturatedFats: 0.5 }, portion: 40 },
        'oatmeal': { name: 'Avena', category: 'cereal', nutrition: { protein: 5, carbs: 27, fats: 2.5, sugars: 0.5, fiber: 4, sodium: 3, saturatedFats: 0.5 }, portion: 40 },
        'tortilla': { name: 'Tortilla', category: 'cereal', nutrition: { protein: 2.5, carbs: 15, fats: 2.5, sugars: 0.5, fiber: 2, sodium: 300, saturatedFats: 0.5 }, portion: 50 },
        'tortilla': { name: 'Tortilla', category: 'cereal', nutrition: { protein: 2.5, carbs: 15, fats: 2.5, sugars: 0.5, fiber: 2, sodium: 300, saturatedFats: 0.5 }, portion: 50 },
        'croissant': { name: 'Croissant', category: 'cereal', nutrition: { protein: 4.7, carbs: 26, fats: 12, sugars: 8, fiber: 1.3, sodium: 200, saturatedFats: 6 }, portion: 70 },

        // Platos preparados
        'sándwich': { name: 'Sándwich', category: 'plato', nutrition: { protein: 15, carbs: 35, fats: 18, sugars: 5, fiber: 2, sodium: 400, saturatedFats: 5 }, portion: 150 },
        'sandwich': { name: 'Sándwich', category: 'plato', nutrition: { protein: 15, carbs: 35, fats: 18, sugars: 5, fiber: 2, sodium: 400, saturatedFats: 5 }, portion: 150 },
        'pizza': { name: 'Pizza', category: 'plato', nutrition: { protein: 11, carbs: 33, fats: 10, sugars: 4, fiber: 2.3, sodium: 600, saturatedFats: 4 }, portion: 200 },
        'hamburguesa con queso': { name: 'Hamburguesa con queso', category: 'plato', nutrition: { protein: 25, carbs: 30, fats: 25, sugars: 8, fiber: 1.5, sodium: 800, saturatedFats: 12 }, portion: 200 },
        'cheeseburger': { name: 'Hamburguesa con queso', category: 'plato', nutrition: { protein: 25, carbs: 30, fats: 25, sugars: 8, fiber: 1.5, sodium: 800, saturatedFats: 12 }, portion: 200 },
        'taco': { name: 'Taco', category: 'plato', nutrition: { protein: 8, carbs: 20, fats: 10, sugars: 1, fiber: 3, sodium: 350, saturatedFats: 4 }, portion: 100 },
        'burrito': { name: 'Burrito', category: 'plato', nutrition: { protein: 15, carbs: 40, fats: 12, sugars: 2, fiber: 5, sodium: 600, saturatedFats: 5 }, portion: 250 },
        'ensalada': { name: 'Ensalada', category: 'plato', nutrition: { protein: 3, carbs: 8, fats: 5, sugars: 3, fiber: 3, sodium: 100, saturatedFats: 0.8 }, portion: 200 },
        'salad': { name: 'Ensalada', category: 'plato', nutrition: { protein: 3, carbs: 8, fats: 5, sugars: 3, fiber: 3, sodium: 100, saturatedFats: 0.8 }, portion: 200 },
        'sopa': { name: 'Sopa', category: 'plato', nutrition: { protein: 3, carbs: 10, fats: 2, sugars: 2, fiber: 1, sodium: 400, saturatedFats: 0.5 }, portion: 250 },
        'soup': { name: 'Sopa', category: 'plato', nutrition: { protein: 3, carbs: 10, fats: 2, sugars: 2, fiber: 1, sodium: 400, saturatedFats: 0.5 }, portion: 250 },
        'paella': { name: 'Paella', category: 'plato', nutrition: { protein: 12, carbs: 35, fats: 8, sugars: 1, fiber: 1, sodium: 500, saturatedFats: 1.5 }, portion: 300 },
        'paella': { name: 'Paella', category: 'plato', nutrition: { protein: 12, carbs: 35, fats: 8, sugars: 1, fiber: 1, sodium: 500, saturatedFats: 1.5 }, portion: 300 },
        ' Curry': { name: 'Curry', category: 'plato', nutrition: { protein: 10, carbs: 20, fats: 15, sugars: 4, fiber: 3, sodium: 400, saturatedFats: 4 }, portion: 250 },
        'curry': { name: 'Curry', category: 'plato', nutrition: { protein: 10, carbs: 20, fats: 15, sugars: 4, fiber: 3, sodium: 400, saturatedFats: 4 }, portion: 250 },
        'stir fry': { name: 'Salteado', category: 'plato', nutrition: { protein: 8, carbs: 15, fats: 12, sugars: 3, fiber: 2, sodium: 350, saturatedFats: 2 }, portion: 200 },
        'estofado': { name: 'Estofado', category: 'plato', nutrition: { protein: 15, carbs: 20, fats: 10, sugars: 3, fiber: 3, sodium: 450, saturatedFats: 3 }, portion: 300 },
        'stew': { name: 'Estofado', category: 'plato', nutrition: { protein: 15, carbs: 20, fats: 10, sugars: 3, fiber: 3, sodium: 450, saturatedFats: 3 }, portion: 300 },

        // Postres y dulces
        'galleta': { name: 'Galleta', category: 'postre', nutrition: { protein: 2, carbs: 25, fats: 10, sugars: 15, fiber: 0.5, sodium: 100, saturatedFats: 4 }, portion: 30 },
        'cookie': { name: 'Galleta', category: 'postre', nutrition: { protein: 2, carbs: 25, fats: 10, sugars: 15, fiber: 0.5, sodium: 100, saturatedFats: 4 }, portion: 30 },
        'galletas': { name: 'Galletas', category: 'postre', nutrition: { protein: 2, carbs: 25, fats: 10, sugars: 15, fiber: 0.5, sodium: 100, saturatedFats: 4 }, portion: 30 },
        'donut': { name: 'Donut', category: 'postre', nutrition: { protein: 5, carbs: 51, fats: 25, sugars: 25, fiber: 1.5, sodium: 200, saturatedFats: 8 }, portion: 60 },
        'dona': { name: 'Donut', category: 'postre', nutrition: { protein: 5, carbs: 51, fats: 25, sugars: 25, fiber: 1.5, sodium: 200, saturatedFats: 8 }, portion: 60 },
        'pastel': { name: 'Pastel', category: 'postre', nutrition: { protein: 5, carbs: 58, fats: 22, sugars: 40, fiber: 0.5, sodium: 250, saturatedFats: 7 }, portion: 80 },
        'cake': { name: 'Pastel', category: 'postre', nutrition: { protein: 5, carbs: 58, fats: 22, sugars: 40, fiber: 0.5, sodium: 250, saturatedFats: 7 }, portion: 80 },
        'helado': { name: 'Helado', category: 'postre', nutrition: { protein: 3.5, carbs: 24, fats: 11, sugars: 21, fiber: 0.5, sodium: 80, saturatedFats: 7 }, portion: 100 },
        'ice cream': { name: 'Helado', category: 'postre', nutrition: { protein: 3.5, carbs: 24, fats: 11, sugars: 21, fiber: 0.5, sodium: 80, saturatedFats: 7 }, portion: 100 },
        'chocolate': { name: 'Chocolate', category: 'postre', nutrition: { protein: 5, carbs: 17, fats: 15, sugars: 14, fiber: 3, sodium: 20, saturatedFats: 9 }, portion: 30 },
        'brownie': { name: 'Brownie', category: 'postre', nutrition: { protein: 4, carbs: 36, fats: 15, sugars: 25, fiber: 1, sodium: 100, saturatedFats: 5 }, portion: 60 },
        'flan': { name: 'Flan', category: 'postre', nutrition: { protein: 4, carbs: 30, fats: 6, sugars: 25, fiber: 0, sodium: 80, saturatedFats: 3 }, portion: 120 },

        // Bebidas
        'café': { name: 'Café', category: 'bebida', nutrition: { protein: 0.3, carbs: 0, fats: 0, sugars: 0, fiber: 0, sodium: 5, saturatedFats: 0 }, portion: 240 },
        'coffee': { name: 'Café', category: 'bebida', nutrition: { protein: 0.3, carbs: 0, fats: 0, sugars: 0, fiber: 0, sodium: 5, saturatedFats: 0 }, portion: 240 },
        'té': { name: 'Té', category: 'bebida', nutrition: { protein: 0, carbs: 0, fats: 0, sugars: 0, fiber: 0, sodium: 3, saturatedFats: 0 }, portion: 240 },
        'tea': { name: 'Té', category: 'bebida', nutrition: { protein: 0, carbs: 0, fats: 0, sugars: 0, fiber: 0, sodium: 3, saturatedFats: 0 }, portion: 240 },
        'zumo': { name: 'Zumo/Jugo', category: 'bebida', nutrition: { protein: 0.5, carbs: 25, fats: 0, sugars: 22, fiber: 0.2, sodium: 10, saturatedFats: 0 }, portion: 250 },
        'juice': { name: 'Zumo/Jugo', category: 'bebida', nutrition: { protein: 0.5, carbs: 25, fats: 0, sugars: 22, fiber: 0.2, sodium: 10, saturatedFats: 0 }, portion: 250 },
        'refresco': { name: 'Refresco', category: 'bebida', nutrition: { protein: 0, carbs: 39, fats: 0, sugars: 39, fiber: 0, sodium: 20, saturatedFats: 0 }, portion: 330 },
        'soda': { name: 'Refresco', category: 'bebida', nutrition: { protein: 0, carbs: 39, fats: 0, sugars: 39, fiber: 0, sodium: 20, saturatedFats: 0 }, portion: 330 },
        'cola': { name: 'Refresco de cola', category: 'bebida', nutrition: { protein: 0, carbs: 39, fats: 0, sugars: 39, fiber: 0, sodium: 20, saturatedFats: 0 }, portion: 330 },
        'vino': { name: 'Vino', category: 'bebida', nutrition: { protein: 0, carbs: 4, fats: 0, sugars: 4, fiber: 0, sodium: 5, saturatedFats: 0 }, portion: 150 },
        'wine': { name: 'Vino', category: 'bebida', nutrition: { protein: 0, carbs: 4, fats: 0, sugars: 4, fiber: 0, sodium: 5, saturatedFats: 0 }, portion: 150 },
        'cerveza': { name: 'Cerveza', category: 'bebida', nutrition: { protein: 1.5, carbs: 13, fats: 0, sugars: 1, fiber: 0, sodium: 15, saturatedFats: 0 }, portion: 330 },
        'beer': { name: 'Cerveza', category: 'bebida', nutrition: { protein: 1.5, carbs: 13, fats: 0, sugars: 1, fiber: 0, sodium: 15, saturatedFats: 0 }, portion: 330 },
        'agua': { name: 'Agua', category: 'bebida', nutrition: { protein: 0, carbs: 0, fats: 0, sugars: 0, fiber: 0, sodium: 0, saturatedFats: 0 }, portion: 250 },
        'water': { name: 'Agua', category: 'bebida', nutrition: { protein: 0, carbs: 0, fats: 0, sugars: 0, fiber: 0, sodium: 0, saturatedFats: 0 }, portion: 250 },

        // Otros alimentos comunes
        'aceite': { name: 'Aceite', category: 'grasa', nutrition: { protein: 0, carbs: 0, fats: 100, sugars: 0, fiber: 0, sodium: 0, saturatedFats: 14 }, portion: 15 },
        'oil': { name: 'Aceite', category: 'grasa', nutrition: { protein: 0, carbs: 0, fats: 100, sugars: 0, fiber: 0, sodium: 0, saturatedFats: 14 }, portion: 15 },
        'aceite de oliva': { name: 'Aceite de oliva', category: 'grasa', nutrition: { protein: 0, carbs: 0, fats: 100, sugars: 0, fiber: 0, sodium: 2, saturatedFats: 14 }, portion: 15 },
        'olive oil': { name: 'Aceite de oliva', category: 'grasa', nutrition: { protein: 0, carbs: 0, fats: 100, sugars: 0, fiber: 0, sodium: 2, saturatedFats: 14 }, portion: 15 },
        'azúcar': { name: 'Azúcar', category: 'edulcorante', nutrition: { protein: 0, carbs: 100, fats: 0, sugars: 100, fiber: 0, sodium: 0, saturatedFats: 0 }, portion: 10 },
        'sugar': { name: 'Azúcar', category: 'edulcorante', nutrition: { protein: 0, carbs: 100, fats: 0, sugars: 100, fiber: 0, sodium: 0, saturatedFats: 0 }, portion: 10 },
        'miel': { name: 'Miel', category: 'edulcorante', nutrition: { protein: 0.3, carbs: 82, fats: 0, sugars: 82, fiber: 0.2, sodium: 4, saturatedFats: 0 }, portion: 20 },
        'honey': { name: 'Miel', category: 'edulcorante', nutrition: { protein: 0.3, carbs: 82, fats: 0, sugars: 82, fiber: 0.2, sodium: 4, saturatedFats: 0 }, portion: 20 },
        'frutos secos': { name: 'Frutos secos', category: 'fruta seca', nutrition: { protein: 7, carbs: 7, fats: 15, sugars: 2, fiber: 3, sodium: 2, saturatedFats: 1.2 }, portion: 30 },
        'nuts': { name: 'Frutos secos', category: 'fruta seca', nutrition: { protein: 7, carbs: 7, fats: 15, sugars: 2, fiber: 3, sodium: 2, saturatedFats: 1.2 }, portion: 30 },
        'almendras': { name: 'Almendras', category: 'fruta seca', nutrition: { protein: 6, carbs: 6, fats: 14, sugars: 1.3, fiber: 3.5, sodium: 0, saturatedFats: 1 }, portion: 30 },
        'almonds': { name: 'Almendras', category: 'fruta seca', nutrition: { protein: 6, carbs: 6, fats: 14, sugars: 1.3, fiber: 3.5, sodium: 0, saturatedFats: 1 }, portion: 30 },
        'cacahuete': { name: 'Cacahuetes', category: 'fruta seca', nutrition: { protein: 7, carbs: 4, fats: 14, sugars: 2, fiber: 2.4, sodium: 5, saturatedFats: 2 }, portion: 30 },
        'peanuts': { name: 'Cacahuetes', category: 'fruta seca', nutrition: { protein: 7, carbs: 4, fats: 14, sugars: 2, fiber: 2.4, sodium: 5, saturatedFats: 2 }, portion: 30 },
        'legumbres': { name: 'Legumbres', category: 'legumbre', nutrition: { protein: 9, carbs: 20, fats: 0.5, sugars: 1, fiber: 8, sodium: 5, saturatedFats: 0.1 }, portion: 150 },
        'lentejas': { name: 'Lentejas', category: 'legumbre', nutrition: { protein: 9, carbs: 20, fats: 0.5, sugars: 1, fiber: 8, sodium: 5, saturatedFats: 0.1 }, portion: 150 },
        'garbanzos': { name: 'Garbanzos', category: 'legumbre', nutrition: { protein: 9, carbs: 27, fats: 2.5, sugars: 4, fiber: 8, sodium: 5, saturatedFats: 0.3 }, portion: 150 },
        'chickpeas': { name: 'Garbanzos', category: 'legumbre', nutrition: { protein: 9, carbs: 27, fats: 2.5, sugars: 4, fiber: 8, sodium: 5, saturatedFats: 0.3 }, portion: 150 },
        'frijoles': { name: 'Frijoles', category: 'legumbre', nutrition: { protein: 9, carbs: 24, fats: 0.5, sugars: 0.3, fiber: 9, sodium: 1, saturatedFats: 0.1 }, portion: 150 },
        'beans': { name: 'Frijoles', category: 'legumbre', nutrition: { protein: 9, carbs: 24, fats: 0.5, sugars: 0.3, fiber: 9, sodium: 1, saturatedFats: 0.1 }, portion: 150 },
        'soja': { name: 'Soja', category: 'legumbre', nutrition: { protein: 11, carbs: 10, fats: 6, sugars: 3, fiber: 3, sodium: 5, saturatedFats: 0.7 }, portion: 100 },
        'tofu': { name: 'Tofu', category: 'legumbre', nutrition: { protein: 8, carbs: 2, fats: 4.5, sugars: 0.5, fiber: 0.5, sodium: 7, saturatedFats: 0.7 }, portion: 100 },

        // Comida rápida y snack
        'papas fritas': { name: 'Papas fritas', category: 'snack', nutrition: { protein: 3, carbs: 53, fats: 34, sugars: 0.3, fiber: 4, sodium: 400, saturatedFats: 3 }, portion: 100 },
        'fries': { name: 'Papas fritas', category: 'snack', nutrition: { protein: 3, carbs: 53, fats: 34, sugars: 0.3, fiber: 4, sodium: 400, saturatedFats: 3 }, portion: 100 },
        'patatas fritas': { name: 'Papas fritas', category: 'snack', nutrition: { protein: 3, carbs: 53, fats: 34, sugars: 0.3, fiber: 4, sodium: 400, saturatedFats: 3 }, portion: 100 },
        'nachos': { name: 'Nachos', category: 'snack', nutrition: { protein: 3, carbs: 25, fats: 10, sugars: 1, fiber: 2, sodium: 300, saturatedFats: 2 }, portion: 100 },
        'palomitas': { name: 'Palomitas', category: 'snack', nutrition: { protein: 3, carbs: 19, fats: 1, sugars: 0.2, fiber: 3.5, sodium: 300, saturatedFats: 0.2 }, portion: 30 },
        'popcorn': { name: 'Palomitas', category: 'snack', nutrition: { protein: 3, carbs: 19, fats: 1, sugars: 0.2, fiber: 3.5, sodium: 300, saturatedFats: 0.2 }, portion: 30 },
        'chips': { name: 'Chips', category: 'snack', nutrition: { protein: 2, carbs: 53, fats: 34, sugars: 0.3, fiber: 1, sodium: 400, saturatedFats: 3 }, portion: 30 },
        'crackers': { name: 'Crackers', category: 'snack', nutrition: { protein: 2, carbs: 20, fats: 5, sugars: 2, fiber: 0.8, sodium: 150, saturatedFats: 1 }, portion: 30 },
        'pretzel': { name: 'Pretzel', category: 'snack', nutrition: { protein: 3, carbs: 23, fats: 1, sugars: 0.5, fiber: 0.8, sodium: 400, saturatedFats: 0.2 }, portion: 30 },

        // Comida internacional
        'sushi': { name: 'Sushi', category: 'plato', nutrition: { protein: 6, carbs: 20, fats: 2, sugars: 3, fiber: 0.5, sodium: 300, saturatedFats: 0.5 }, portion: 100 },
        'ramen': { name: 'Ramen', category: 'plato', nutrition: { protein: 8, carbs: 40, fats: 10, sugars: 2, fiber: 1, sodium: 1200, saturatedFats: 4 }, portion: 500 },
        'kebab': { name: 'Kebab', category: 'plato', nutrition: { protein: 20, carbs: 25, fats: 15, sugars: 3, fiber: 1, sodium: 500, saturatedFats: 5 }, portion: 250 },
        'gyros': { name: 'Gyros', category: 'plato', nutrition: { protein: 18, carbs: 25, fats: 15, sugars: 3, fiber: 1, sodium: 600, saturatedFats: 6 }, portion: 200 },
        'falafel': { name: 'Falafel', category: 'plato', nutrition: { protein: 5, carbs: 18, fats: 10, sugars: 1, fiber: 3, sodium: 400, saturatedFats: 1 }, portion: 100 },
        'hummus': { name: 'Hummus', category: 'plato', nutrition: { protein: 3, carbs: 6, fats: 8, sugars: 0.5, fiber: 3, sodium: 100, saturatedFats: 1 }, portion: 50 },
        'shawarma': { name: 'Shawarma', category: 'plato', nutrition: { protein: 20, carbs: 15, fats: 12, sugars: 2, fiber: 1, sodium: 450, saturatedFats: 4 }, portion: 200 },

        // Desayuno
        'cereal': { name: 'Cereal', category: 'desayuno', nutrition: { protein: 3, carbs: 24, fats: 1, sugars: 12, fiber: 2, sodium: 100, saturatedFats: 0.2 }, portion: 30 },
        'cereales': { name: 'Cereal', category: 'desayuno', nutrition: { protein: 3, carbs: 24, fats: 1, sugars: 12, fiber: 2, sodium: 100, saturatedFats: 0.2 }, portion: 30 },
        'waffles': { name: 'Waffles', category: 'desayuno', nutrition: { protein: 4, carbs: 25, fats: 8, sugars: 5, fiber: 0.8, sodium: 200, saturatedFats: 2 }, portion: 70 },
        'gofres': { name: 'Gofres', category: 'desayuno', nutrition: { protein: 4, carbs: 25, fats: 8, sugars: 5, fiber: 0.8, sodium: 200, saturatedFats: 2 }, portion: 70 },
        'panqueques': { name: 'Panqueques', category: 'desayuno', nutrition: { protein: 4, carbs: 20, fats: 5, sugars: 5, fiber: 0.5, sodium: 150, saturatedFats: 1.5 }, portion: 80 },
        'pancakes': { name: 'Panqueques', category: 'desayuno', nutrition: { protein: 4, carbs: 20, fats: 5, sugars: 5, fiber: 0.5, sodium: 150, saturatedFats: 1.5 }, portion: 80 },
        'batido': { name: 'Batido', category: 'desayuno', nutrition: { protein: 5, carbs: 30, fats: 3, sugars: 25, fiber: 1, sodium: 80, saturatedFats: 1.5 }, portion: 350 },
        'smoothie': { name: 'Batido', category: 'desayuno', nutrition: { protein: 5, carbs: 30, fats: 3, sugars: 25, fiber: 1, sodium: 80, saturatedFats: 1.5 }, portion: 350 }
    }
};

// ========================================
// Utilidades y Helpers
// ========================================
const Utils = {
    formatDate(date) {
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        return date.toLocaleDateString('es-ES', options);
    },

    formatTime(date) {
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    },

    getCurrentDateString() {
        return new Date().toISOString().split('T')[0];
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    capitalize(str) {
        if (!str) return '';
        return str.replace(/\b\w/g, char => char.toUpperCase());
    },

    cleanSearchText(text) {
        return text.toLowerCase().trim().replace(/\s+/g, ' ');
    },

    calculateNutrition(baseValues, quantity, unit) {
        const multiplier = unit === 'piece' ? 1 : (unit === 'cup' ? 200 : quantity / 100);

        return {
            protein: Math.round((baseValues.protein || 0) * multiplier * 10) / 10,
            carbs: Math.round((baseValues.carbs || 0) * multiplier * 10) / 10,
            fats: Math.round((baseValues.fats || 0) * multiplier * 10) / 10,
            sugars: Math.round((baseValues.sugars || 0) * multiplier * 10) / 10,
            fiber: Math.round((baseValues.fiber || 0) * multiplier * 10) / 10,
            sodium: Math.round((baseValues.sodium || 0) * multiplier),
            saturatedFats: Math.round((baseValues.saturatedFats || 0) * multiplier * 10) / 10
        };
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Convierte imagen a base64
     */
    imageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }
};

// ========================================
// Clase de Almacenamiento Local
// ========================================
class StorageManager {
    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error reading ${key}:`, error);
            return defaultValue;
        }
    }

    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error writing ${key}:`, error);
            return false;
        }
    }

    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing ${key}:`, error);
            return false;
        }
    }
}

// ========================================
// Clase de API de OpenFoodFacts
// ========================================
class OpenFoodFactsAPI {
    static async searchProducts(query, limit = 10) {
        const params = new URLSearchParams({
            search_terms: query,
            search_simple: 1,
            action: 'process',
            json: 1,
            page_size: limit,
            fields: 'product_name,brands,nutriments,code,image_url'
        });

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}?${params}`);
            if (!response.ok) throw new Error('Error en la búsqueda');

            const data = await response.json();
            return data.products || [];
        } catch (error) {
            console.error('Error buscando productos:', error);
            throw error;
        }
    }

    static async getProductByBarcode(barcode) {
        try {
            const response = await fetch(`${CONFIG.API_PRODUCT_URL}/${barcode}.json`);
            if (!response.ok) throw new Error('Producto no encontrado');

            const data = await response.json();
            return data.product;
        } catch (error) {
            console.error('Error obteniendo producto:', error);
            throw error;
        }
    }

    static extractNutritionData(product) {
        const nutriments = product.nutriments || {};

        return {
            name: product.product_name || 'Producto desconocido',
            brand: product.brands || '',
            image: product.image_url || null,
            nutrition: {
                protein: nutriments['proteins'] || nutriments['protein_100g'] || 0,
                carbs: nutriments['carbohydrates'] || nutriments['carbohydrates_100g'] || 0,
                fats: nutriments['fat'] || nutriments['fat_100g'] || 0,
                sugars: nutriments['sugars'] || nutriments['sugars_100g'] || 0,
                fiber: nutriments['fiber'] || nutriments['fiber_100g'] || 0,
                sodium: nutriments['sodium'] || nutriments['sodium_100g'] * 1000 || 0,
                saturatedFats: nutriments['saturated-fat'] || nutriments['saturated-fat_100g'] || 0
            }
        };
    }
}

// ========================================
// Cloudflare Workers AI (LLaVA)
// Via Proxy Worker - Sin necesidad de API Token del usuario
// ========================================
class CloudflareAI {
    constructor() {
        this.apiEndpoint = CONFIG.WORKER_API_URL;
    }

    async analyzeImage(imageBase64, mimeType = 'image/jpeg') {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: imageBase64,
                    mimeType: mimeType
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error en el servidor');
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Error en el análisis');
            }

            // Si ya viene el array de foods parseado
            if (data.foods && Array.isArray(data.foods)) {
                return data.foods.map(food => ({
                    name: food.name || food.nombre || food.alimento,
                    quantity: parseFloat(food.quantity) || food.cantidad || 100,
                    unit: this.normalizeUnit(food.unit || food.unidad || 'g')
                }));
            }

            // Si viene texto raw, parsearlo
            if (data.raw) {
                return this.parseLLavaResponse(data.raw);
            }

            return [];
        } catch (error) {
            console.error('Error en Cloudflare AI:', error);
            throw error;
        }
    }

    parseLLavaResponse(response) {
        try {
            // Intentar extraer JSON de la respuesta
            const jsonMatch = response.match(/\[[\s\S]*\]/);

            if (jsonMatch) {
                const foods = JSON.parse(jsonMatch[0]);
                return foods.map(food => ({
                    name: food.name || food.nombre || food.alimento || food.food,
                    quantity: parseFloat(food.quantity) || food.cantidad || 100,
                    unit: this.normalizeUnit(food.unit || food.unidad || 'g')
                }));
            }

            // Si no se encuentra JSON, intentar formato alternativo
            const lines = response.split('\n').filter(line => line.trim());
            const foods = [];

            for (const line of lines) {
                // Buscar patrones como "1. nombre - 100g" o "nombre: 100g"
                const quantityMatch = line.match(/(\d+)\s*(g|ml|piezas?|pieces?|cups?|tazas?)/i);
                const nameMatch = line.replace(/^[\d\.\-\*\•]+\s*/, '').replace(/[:\-–—]\s*\d.*$/i, '').trim();

                if (nameMatch && nameMatch.length > 2) {
                    foods.push({
                        name: nameMatch,
                        quantity: quantityMatch ? parseFloat(quantityMatch[1]) : 100,
                        unit: this.normalizeUnit(quantityMatch ? quantityMatch[2] : 'g')
                    });
                }
            }

            return foods;
        } catch (error) {
            console.error('Error parseando respuesta LLaVA:', error);
            return [];
        }
    }

    normalizeUnit(unit) {
        const unitMap = {
            'g': 'g',
            'gramos': 'g',
            'grams': 'g',
            'ml': 'ml',
            'mililitros': 'ml',
            'piece': 'piece',
            'piezas': 'piece',
            'pieces': 'piece',
            'pza': 'piece',
            'cups': 'cup',
            'tazas': 'cup'
        };
        return unitMap[unit?.toLowerCase()] || 'g';
    }
}

// ========================================
// Clase de Gestor de Perfil
// ========================================
class ProfileManager {
    constructor() {
        this.conditions = this.loadConditions();
    }

    loadConditions() {
        return StorageManager.get(CONFIG.STORAGE_KEYS.CONDITIONS, {
            diabetes: false,
            renal: false,
            hipertension: false,
            colesterol: false
        });
    }

    saveConditions(conditions) {
        this.conditions = conditions;
        StorageManager.set(CONFIG.STORAGE_KEYS.CONDITIONS, conditions);
    }

    getActiveConditions() {
        return Object.entries(this.conditions)
            .filter(([_, value]) => value)
            .map(([key]) => key);
    }

    hasCondition(condition) {
        return this.conditions[condition] === true;
    }

    getNutritionGoals() {
        const activeConditions = this.getActiveConditions();
        const goals = { ...CONFIG.NUTRITION_GOALS };

        const result = {
            protein: goals.protein.default,
            carbs: goals.carbs.default,
            fats: goals.fats.default,
            sodium: goals.sodium.default,
            sugars: goals.sugars.default,
            fiber: goals.fiber.default,
            saturatedFats: goals.saturatedFats.default
        };

        activeConditions.forEach(condition => {
            if (goals.protein[condition]) result.protein = goals.protein[condition];
            if (goals.carbs[condition]) result.carbs = goals.carbs[condition];
            if (goals.fats[condition]) result.fats = goals.fats[condition];
            if (goals.sodium[condition]) result.sodium = goals.sodium[condition];
            if (goals.sugars[condition]) result.sugars = goals.sugars[condition];
            if (goals.fiber[condition]) result.fiber = goals.fiber[condition];
            if (goals.saturatedFats[condition]) result.saturatedFats = goals.saturatedFats[condition];
        });

        return result;
    }
}

// ========================================
// Clase de NutriData - Base de datos nutricional
// ========================================
class NutriData {
    static findFood(foodName) {
        const searchTerm = Utils.cleanSearchText(foodName).toLowerCase();

        // Búsqueda exacta
        if (CONFIG.FOOD_DATABASE[searchTerm]) {
            return { ...CONFIG.FOOD_DATABASE[searchTerm] };
        }

        // Búsqueda por coincidencia parcial
        const keys = Object.keys(CONFIG.FOOD_DATABASE);
        for (const key of keys) {
            if (searchTerm.includes(key) || key.includes(searchTerm)) {
                return { ...CONFIG.FOOD_DATABASE[key] };
            }
        }

        // Búsqueda flexible por palabras
        const words = searchTerm.split(' ');
        for (const word of words) {
            if (word.length < 3) continue;
            for (const key of keys) {
                if (key.includes(word) && !key.includes(' ')) {
                    return { ...CONFIG.FOOD_DATABASE[key] };
                }
            }
        }

        // Valores por defecto para alimentos desconocidos
        return null;
    }

    static createDefaultFood(name) {
        return {
            name: Utils.capitalize(name),
            category: 'desconocido',
            nutrition: { protein: 5, carbs: 20, fats: 5, sugars: 5, fiber: 2, sodium: 50, saturatedFats: 2 },
            portion: 100
        };
    }
}

// ========================================
// Clase de Gestor de Alimentos (Visualización y UI)
// ========================================
class FoodManager {
    constructor() {
        this.foods = [];
    }

    addFood(food) {
        this.foods.push({
            id: Utils.generateId(),
            ...food,
            source: food.source || 'manual'
        });
    }

    removeFood(id) {
        this.foods = this.foods.filter(f => f.id !== id);
    }

    updateFood(id, updates) {
        const index = this.foods.findIndex(f => f.id === id);
        if (index !== -1) {
            this.foods[index] = { ...this.foods[index], ...updates };
        }
    }

    clear() {
        this.foods = [];
    }

    calculateTotals() {
        const totals = {
            protein: 0, carbs: 0, fats: 0,
            sugars: 0, fiber: 0, sodium: 0, saturatedFats: 0
        };

        this.foods.forEach(food => {
            const nutrition = Utils.calculateNutrition(
                food.nutrition,
                food.quantity,
                food.unit || 'g'
            );

            totals.protein += nutrition.protein;
            totals.carbs += nutrition.carbs;
            totals.fats += nutrition.fats;
            totals.sugars += nutrition.sugars;
            totals.fiber += nutrition.fiber;
            totals.sodium += nutrition.sodium;
            totals.saturatedFats += nutrition.saturatedFats;
        });

        return totals;
    }

    getTotalsWithOil(oilMl) {
        const totals = this.calculateTotals();

        if (oilMl > 0) {
            const oilNutrition = {
                protein: 0,
                carbs: 0,
                fats: oilMl * 0.92,
                sugars: 0,
                fiber: 0,
                sodium: 0,
                saturatedFats: oilMl * 0.14
            };

            totals.protein += oilNutrition.protein;
            totals.carbs += oilNutrition.carbs;
            totals.fats += oilNutrition.fats;
            totals.sugars += oilNutrition.sugars;
            totals.fiber += oilNutrition.fiber;
            totals.sodium += oilNutrition.sodium;
            totals.saturatedFats += oilNutrition.saturatedFats;
        }

        return {
            protein: Math.round(totals.protein * 10) / 10,
            carbs: Math.round(totals.carbs * 10) / 10,
            fats: Math.round(totals.fats * 10) / 10,
            sugars: Math.round(totals.sugars * 10) / 10,
            fiber: Math.round(totals.fiber * 10) / 10,
            sodium: Math.round(totals.sodium),
            saturatedFats: Math.round(totals.saturatedFats * 10) / 10
        };
    }
}

// ========================================
// Clase de Registro Diario
// ========================================
class DailyLogManager {
    constructor() {
        this.meals = this.loadTodayMeals();
    }

    getCurrentDateKey() {
        return Utils.getCurrentDateString();
    }

    loadTodayMeals() {
        const todayKey = this.getCurrentDateKey();
        const storedKey = StorageManager.get(CONFIG.STORAGE_KEYS.CURRENT_DATE);
        const storedLog = StorageManager.get(CONFIG.STORAGE_KEYS.DAILY_LOG, []);

        if (storedKey !== todayKey) {
            StorageManager.set(CONFIG.STORAGE_KEYS.CURRENT_DATE, todayKey);
            StorageManager.set(CONFIG.STORAGE_KEYS.DAILY_LOG, []);
            return [];
        }

        return storedLog;
    }

    addMeal(meal) {
        const mealEntry = {
            id: Utils.generateId(),
            date: Utils.getCurrentDateString(),
            time: Utils.formatTime(new Date()),
            ...meal
        };

        this.meals.push(mealEntry);
        StorageManager.set(CONFIG.STORAGE_KEYS.DAILY_LOG, this.meals);
        return mealEntry;
    }

    resetDay() {
        this.meals = [];
        StorageManager.set(CONFIG.STORAGE_KEYS.DAILY_LOG, []);
    }

    calculateDailyTotals() {
        const totals = {
            protein: 0, carbs: 0, fats: 0,
            meals: this.meals.length
        };

        this.meals.forEach(meal => {
            totals.protein += meal.totals.protein;
            totals.carbs += meal.totals.carbs;
            totals.fats += meal.totals.fats;
        });

        return totals;
    }
}

// ========================================
// Clase de Asistente Dietista
// ========================================
class DietitianAssistant {
    constructor(profileManager) {
        this.profileManager = profileManager;
    }

    generateSuggestions(totals) {
        const conditions = this.profileManager.getActiveConditions();
        const goals = this.profileManager.getNutritionGoals();
        const suggestions = [];

        // Análisis de macronutrientes
        const proteinRatio = totals.protein / goals.protein;
        const carbsRatio = totals.carbs / goals.carbs;
        const fatsRatio = totals.fats / goals.fats;

        // Sugerencias basadas en condiciones específicas
        if (conditions.includes('diabetes')) {
            if (carbsRatio > 0.8) {
                suggestions.push({
                    type: 'warning',
                    icon: '⚠️',
                    text: 'Alto contenido de carbohidratos. Considera reducir porciones de arroz, pasta o pan.'
                });
            }
            if (totals.sugars > 20) {
                suggestions.push({
                    type: 'warning',
                    icon: '⚠️',
                    text: 'Azúcares elevados. Evita postres azucarados y bebidas con azúcar.'
                });
            }
            if (totals.fiber < 10) {
                suggestions.push({
                    type: 'info',
                    icon: '💡',
                    text: 'Añade más fibra con verduras o legumbres para controlar la glucosa.'
                });
            }
        }

        if (conditions.includes('hipertension')) {
            if (totals.sodium > 1000) {
                suggestions.push({
                    type: 'warning',
                    icon: '⚠️',
                    text: 'Contenido de sodio muy alto. Evita alimentos procesados y usa hierbas aromáticas.'
                });
            }
            suggestions.push({
                type: 'info',
                icon: '💡',
                text: 'Prioriza alimentos ricos en potasio como plátano, espinacas o aguacate.'
            });
        }

        if (conditions.includes('renal')) {
            if (totals.protein > 30) {
                suggestions.push({
                    type: 'warning',
                    icon: '⚠️',
                    text: 'Proteína moderada. Para insuficiencia renal se recomienda no exceder los límites.'
                });
            }
            if (totals.sodium > 800) {
                suggestions.push({
                    type: 'warning',
                    icon: '⚠️',
                    text: 'Sodio muy elevado. Reduce el consumo de alimentos procesados.'
                });
            }
        }

        if (conditions.includes('colesterol')) {
            if (totals.saturatedFats > 10) {
                suggestions.push({
                    type: 'warning',
                    icon: '⚠️',
                    text: 'Grasas saturadas elevadas. Evita carnes rojasgrasas, mantequilla y quesos.'
                });
            }
            suggestions.push({
                type: 'info',
                icon: '💡',
                text: 'Incluye alimentos con omega-3: pescado, nueces o semillas.'
            });
        }

        // Sugerencias generales
        if (!conditions.includes('diabetes') && carbsRatio > 1) {
            suggestions.push({
                type: 'warning',
                icon: '⚠️',
                text: 'Carbohidratos elevados. Considera reducir pan, arroz o pasta.'
            });
        }

        if (totals.protein < 15 && proteinRatio < 0.3) {
            suggestions.push({
                type: 'info',
                icon: '💡',
                text: 'Proteína baja. Añade huevos, pollo, pescado o legumbres.'
            });
        }

        if (totals.fats > 50 && fatsRatio > 0.8) {
            suggestions.push({
                type: 'info',
                icon: '💡',
                text: 'Grasas elevadas. Usa menos aceite y evita frituras.'
            });
        }

        if (totals.fiber < 15 && !conditions.includes('renal')) {
            suggestions.push({
                type: 'info',
                icon: '💡',
                text: 'Fibra baja. Añade verduras, frutas o cereales integrales.'
            });
        }

        // Mensaje positivo si está equilibrado
        if (suggestions.length === 0 && totals.protein > 10) {
            suggestions.push({
                type: 'success',
                icon: '✅',
                text: 'Composición equilibrada. ¡Buena elección!'
            });
        }

        return suggestions;
    }
}

// ========================================
// Aplicación Principal
// ========================================
class FoodCheckApp {
    constructor() {
        this.profileManager = new ProfileManager();
        this.foodManager = new FoodManager();
        this.dailyLogManager = new DailyLogManager();
        this.dietitianAssistant = new DietitianAssistant(this.profileManager);
        this.cloudflareAI = new CloudflareAI();

        this.currentEditingId = null;
        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.loadSavedData();
        this.updateUI();
    }

    bindElements() {
        // Secciones
        this.configSection = document.getElementById('config-content');
        this.perfilSection = document.getElementById('perfil-content');
        this.analysisSection = document.getElementById('analisis');

        // Upload
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('file-input');
        this.btnUpload = document.getElementById('btn-upload');
        this.previewContainer = document.getElementById('preview-container');
        this.imagePreview = document.getElementById('image-preview');
        this.previewFilename = document.getElementById('preview-filename');
        this.btnClosePreview = document.getElementById('btn-close-preview');

        // Detection
        this.detectionResult = document.getElementById('detection-result');
        this.foodsList = document.getElementById('foods-list');
        this.oilAmount = document.getElementById('oil-amount');
        this.btnAddFood = document.getElementById('btn-add-food');
        this.btnSaveMeal = document.getElementById('btn-save-meal');
        this.mealDate = document.getElementById('meal-date');
        this.saveHint = document.getElementById('save-hint');

        // Nutrition
        this.proteinValue = document.getElementById('protein-value');
        this.carbsValue = document.getElementById('carbs-value');
        this.fatsValue = document.getElementById('fats-value');
        this.proteinBar = document.getElementById('protein-bar');
        this.carbsBar = document.getElementById('carbs-bar');
        this.fatsBar = document.getElementById('fats-bar');
        this.proteinDetail = document.getElementById('protein-detail');
        this.carbsDetail = document.getElementById('carbs-detail');
        this.sugarsDetail = document.getElementById('sugars-detail');
        this.fiberDetail = document.getElementById('fiber-detail');
        this.fatsDetail = document.getElementById('fats-detail');
        this.saturatedFatsDetail = document.getElementById('saturated-fats-detail');
        this.sodiumDetail = document.getElementById('sodium-detail');

        // Assistant
        this.assistantContent = document.getElementById('assistant-content');

        // Daily Log
        this.dailySummary = document.getElementById('daily-summary');
        this.registerPlaceholder = document.getElementById('register-placeholder');
        this.mealsList = document.getElementById('meals-list');
        this.todayMeals = document.getElementById('today-meals');
        this.btnResetDay = document.getElementById('btn-reset-day');
        this.dailyProtein = document.getElementById('daily-protein');
        this.dailyCarbs = document.getElementById('daily-carbs');
        this.dailyFats = document.getElementById('daily-fats');

        // Modal
        this.foodModal = document.getElementById('food-modal');
        this.btnCloseModal = document.getElementById('btn-close-modal');
        this.foodName = document.getElementById('food-name');
        this.btnSearchFood = document.getElementById('btn-search-food');
        this.searchResults = document.getElementById('search-results');
        this.resultsList = document.getElementById('results-list');
        this.foodQuantity = document.getElementById('food-quantity');
        this.foodUnit = document.getElementById('food-unit');
        this.btnCancelModal = document.getElementById('btn-cancel-modal');
        this.btnSaveFood = document.getElementById('btn-save-food');

        // Loading & Toast
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.loadingText = document.querySelector('.loading-text');
        this.toastContainer = document.getElementById('toast-container');

        // Footer
        this.lastUpdate = document.getElementById('last-update');
    }

    bindEvents() {
        // Toggle sections
        document.querySelectorAll('.btn-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleSection(e));
        });

        // File upload
        this.btnUpload.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.uploadArea.addEventListener('click', () => this.fileInput.click());

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // Preview
        this.btnClosePreview.addEventListener('click', () => this.closePreview());

        // Detection actions
        this.btnAddFood.addEventListener('click', () => this.openFoodModal());
        this.btnSaveMeal.addEventListener('click', () => this.saveMeal());
        this.oilAmount.addEventListener('input', () => this.updateNutritionUI());

        // Modal
        this.btnCloseModal.addEventListener('click', () => this.closeFoodModal());
        this.btnCancelModal.addEventListener('click', () => this.closeFoodModal());
        this.btnSearchFood.addEventListener('click', () => this.searchFood());
        this.foodName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchFood();
        });
        this.btnSaveFood.addEventListener('click', () => this.saveFoodFromModal());
        this.foodModal.addEventListener('click', (e) => {
            if (e.target === this.foodModal) this.closeFoodModal();
        });

        // Daily log
        this.btnResetDay.addEventListener('click', () => this.resetDay());

        // Profile conditions
        document.querySelectorAll('.conditions-grid input').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.saveConditions());
        });
    }

    loadSavedData() {
        // Load conditions
        const conditions = this.profileManager.loadConditions();
        Object.keys(conditions).forEach(key => {
            const checkbox = document.getElementById(key);
            if (checkbox) checkbox.checked = conditions[key];
        });

        // Load daily log
        this.updateDailyLogUI();

        // Update date
        this.mealDate.textContent = Utils.formatDate(new Date());
        this.lastUpdate.textContent = new Date().toLocaleDateString('es-ES');
    }

    saveConditions() {
        const conditions = {
            diabetes: document.getElementById('diabetes').checked,
            renal: document.getElementById('renal').checked,
            hipertension: document.getElementById('hipertension').checked,
            colesterol: document.getElementById('colesterol').checked
        };
        this.profileManager.saveConditions(conditions);
        this.updateNutritionUI();
        this.showToast('Condiciones actualizadas', 'success');
    }

    // File handling
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) this.processFile(file);
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('drag-over');

        const file = e.dataTransfer.files[0];
        if (file) this.processFile(file);
    }

    async processFile(file) {
        if (!this.validateFile(file)) return;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.imagePreview.src = e.target.result;
            this.previewFilename.textContent = file.name;
            this.previewContainer.classList.remove('hidden');
            this.detectionResult.classList.add('hidden');
            this.uploadArea.parentElement.classList.add('hidden');
        };
        reader.readAsDataURL(file);

        // Analyze with LLaVA
        try {
            this.showLoading(true, 'Analizando imagen con LLaVA...');

            const base64 = await Utils.imageToBase64(file);
            const foods = await this.cloudflareAI.analyzeImage(base64, file.type);

            if (foods.length === 0) {
                this.showToast('No se detectaron alimentos. Añádelos manualmente.', 'warning');
            } else {
                this.showToast(`Se detectaron ${foods.length} alimentos`, 'success');
            }

            // Convert to food objects
            this.foodManager.clear();
            foods.forEach(food => {
                const foodData = NutriData.findFood(food.name);
                if (foodData) {
                    this.foodManager.addFood({
                        name: foodData.name,
                        quantity: food.quantity || foodData.portion,
                        unit: food.unit || 'g',
                        nutrition: foodData.nutrition,
                        source: 'llava'
                    });
                } else {
                    this.foodManager.addFood({
                        name: food.name,
                        quantity: food.quantity || 100,
                        unit: food.unit || 'g',
                        ...NutriData.createDefaultFood(food.name),
                        source: 'llava'
                    });
                }
            });

            this.detectionResult.classList.remove('hidden');
            this.renderFoodsList();
            this.updateNutritionUI();

        } catch (error) {
            console.error('Error analyzing image:', error);
            this.showToast('Error al analizar la imagen: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    validateFile(file) {
        if (!CONFIG.ALLOWED_FORMATS.includes(file.type)) {
            this.showToast('Formato no permitido. Usa JPG o PNG.', 'error');
            return false;
        }
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            this.showToast('Archivo muy grande. Máximo 10MB.', 'error');
            return false;
        }
        return true;
    }

    closePreview() {
        this.previewContainer.classList.add('hidden');
        this.detectionResult.classList.add('hidden');
        this.uploadArea.parentElement.classList.remove('hidden');
        this.fileInput.value = '';
        this.foodManager.clear();
        this.renderFoodsList();
        this.updateNutritionUI();
    }

    // Food list management
    renderFoodsList() {
        if (this.foodManager.foods.length === 0) {
            this.foodsList.innerHTML = '<p class="empty-state">Aún no hay alimentos en la lista. Usa el botón "Añadir alimento" para empezar.</p>';
            return;
        }

        this.foodsList.innerHTML = this.foodManager.foods.map(food => `
            <div class="food-item" data-id="${food.id}">
                <div class="food-info">
                    <span class="food-name">${food.name}</span>
                    <span class="food-quantity">${food.quantity}${food.unit}</span>
                </div>
                <div class="food-actions">
                    <button class="btn-edit-food" data-id="${food.id}" aria-label="Editar">✏️</button>
                    <button class="btn-remove-food" data-id="${food.id}" aria-label="Eliminar">🗑️</button>
                </div>
            </div>
        `).join('');

        // Bind events
        this.foodsList.querySelectorAll('.btn-edit-food').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openFoodModal(btn.dataset.id);
            });
        });

        this.foodsList.querySelectorAll('.btn-remove-food').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.foodManager.removeFood(btn.dataset.id);
                this.renderFoodsList();
                this.updateNutritionUI();
            });
        });
    }

    openFoodModal(foodId = null) {
        this.currentEditingId = foodId;
        this.foodName.value = '';
        this.searchResults.classList.add('hidden');
        this.foodQuantity.value = 100;
        this.foodUnit.value = 'g';

        if (foodId) {
            const food = this.foodManager.foods.find(f => f.id === foodId);
            if (food) {
                this.foodName.value = food.name;
                this.foodQuantity.value = food.quantity;
                this.foodUnit.value = food.unit || 'g';
            }
        }

        this.foodModal.classList.remove('hidden');
        this.foodName.focus();
    }

    closeFoodModal() {
        this.foodModal.classList.add('hidden');
        this.currentEditingId = null;
    }

    async searchFood() {
        const query = this.foodName.value.trim();
        if (!query) return;

        try {
            const products = await OpenFoodFactsAPI.searchProducts(query, 5);

            if (products.length === 0) {
                this.showToast('No se encontraron productos', 'warning');
                return;
            }

            const results = products.map(p => OpenFoodFactsAPI.extractNutritionData(p));
            this.renderSearchResults(results);
        } catch (error) {
            this.showToast('Error buscando productos', 'error');
        }
    }

    renderSearchResults(results) {
        this.resultsList.innerHTML = results.map((result, index) => `
            <div class="result-item" data-index="${index}">
                <span class="result-name">${result.name}</span>
                <span class="result-brand">${result.brand || 'Sin marca'}</span>
                <div class="result-nutrition">
                    P: ${result.nutrition.protein}g ·
                    C: ${result.nutrition.carbs}g ·
                    G: ${result.nutrition.fats}g
                </div>
            </div>
        `).join('');

        this.searchResults.classList.remove('hidden');

        // Bind click events
        this.resultsList.querySelectorAll('.result-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.selectSearchResult(results[index]);
            });
        });
    }

    selectSearchResult(product) {
        this.foodName.value = product.name;
        this.searchResults.classList.add('hidden');

        // Store product data for saving
        this.selectedProduct = product;
    }

    saveFoodFromModal() {
        const name = this.foodName.value.trim();
        const quantity = parseFloat(this.foodQuantity.value) || 100;
        const unit = this.foodUnit.value;

        if (!name) {
            this.showToast('Ingresa un nombre', 'error');
            return;
        }

        // Check if we have product data from search
        let nutritionData;
        if (this.selectedProduct) {
            nutritionData = this.selectedProduct.nutrition;
            this.selectedProduct = null;
        } else {
            const foodData = NutriData.findFood(name);
            if (foodData) {
                nutritionData = foodData.nutrition;
            } else {
                nutritionData = NutriData.createDefaultFood(name).nutrition;
            }
        }

        if (this.currentEditingId) {
            this.foodManager.updateFood(this.currentEditingId, {
                name,
                quantity,
                unit,
                nutrition: nutritionData
            });
        } else {
            this.foodManager.addFood({
                name,
                quantity,
                unit,
                nutrition: nutritionData,
                source: 'manual'
            });
        }

        this.renderFoodsList();
        this.updateNutritionUI();
        this.closeFoodModal();
        this.showToast(this.currentEditingId ? 'Alimento actualizado' : 'Alimento añadido', 'success');
    }

    // Nutrition UI
    updateNutritionUI() {
        const oilMl = parseFloat(this.oilAmount.value) || 0;
        const totals = this.foodManager.getTotalsWithOil(oilMl);
        const goals = this.profileManager.getNutritionGoals();

        // Update main values
        this.proteinValue.textContent = Math.round(totals.protein);
        this.carbsValue.textContent = Math.round(totals.carbs);
        this.fatsValue.textContent = Math.round(totals.fats);

        // Update progress bars
        this.proteinBar.style.width = `${Math.min((totals.protein / goals.protein) * 100, 100)}%`;
        this.carbsBar.style.width = `${Math.min((totals.carbs / goals.carbs) * 100, 100)}%`;
        this.fatsBar.style.width = `${Math.min((totals.fats / goals.fats) * 100, 100)}%`;

        // Update details
        this.proteinDetail.textContent = `${Math.round(totals.protein)} g`;
        this.carbsDetail.textContent = `${Math.round(totals.carbs)} g`;
        this.sugarsDetail.textContent = `${Math.round(totals.sugars)} g`;
        this.fiberDetail.textContent = `${Math.round(totals.fiber)} g`;
        this.fatsDetail.textContent = `${Math.round(totals.fats)} g`;
        this.saturatedFatsDetail.textContent = `${Math.round(totals.saturatedFats)} g`;
        this.sodiumDetail.textContent = `${Math.round(totals.sodium)} mg`;

        // Update assistant suggestions
        this.updateAssistantUI(totals);
    }

    updateAssistantUI(totals) {
        const suggestions = this.dietitianAssistant.generateSuggestions(totals);

        if (suggestions.length === 0) {
            this.assistantContent.innerHTML = `
                <div class="assistant-placeholder">
                    <span class="assistant-icon">💡</span>
                    <p>* Comienza añadiendo alimentos para obtener recomendaciones personalizadas.</p>
                </div>
            `;
            return;
        }

        this.assistantContent.innerHTML = suggestions.map(s => `
            <div class="suggestion-item ${s.type}">
                <span class="suggestion-icon">${s.icon}</span>
                <p class="suggestion-text">${s.text}</p>
            </div>
        `).join('');
    }

    // Meal management
    saveMeal() {
        if (this.foodManager.foods.length === 0) {
            this.showToast('Añade alimentos primero', 'warning');
            return;
        }

        const oilMl = parseFloat(this.oilAmount.value) || 0;
        const totals = this.foodManager.getTotalsWithOil(oilMl);
        const foods = this.foodManager.foods.map(f => ({
            name: f.name,
            quantity: f.quantity,
            unit: f.unit
        }));

        const mealEntry = this.dailyLogManager.addMeal({
            foods,
            totals,
            oilMl
        });

        this.showToast('Comida guardada', 'success');
        this.updateDailyLogUI();

        // Reset for next meal
        this.closePreview();
    }

    updateDailyLogUI() {
        const dailyTotals = this.dailyLogManager.calculateDailyTotals();
        const meals = this.dailyLogManager.meals;

        // Update cards
        this.dailyProtein.textContent = Math.round(dailyTotals.protein);
        this.dailyCarbs.textContent = Math.round(dailyTotals.carbs);
        this.dailyFats.textContent = Math.round(dailyTotals.fats);

        // Update meals list
        if (meals.length === 0) {
            this.registerPlaceholder.classList.remove('hidden');
            this.mealsList.classList.add('hidden');
        } else {
            this.registerPlaceholder.classList.add('hidden');
            this.mealsList.classList.remove('hidden');

            this.todayMeals.innerHTML = meals.map(meal => `
                <div class="meal-entry">
                    <div class="meal-time">${meal.time}</div>
                    <div class="meal-foods">${meal.foods.map(f => f.name).join(', ')}</div>
                    <div class="meal-totals">
                        P: ${Math.round(meal.totals.protein)}g ·
                        C: ${Math.round(meal.totals.carbs)}g ·
                        G: ${Math.round(meal.totals.fats)}g
                    </div>
                </div>
            `).join('');
        }
    }

    resetDay() {
        if (confirm('¿Reiniciar el registro del día?')) {
            this.dailyLogManager.resetDay();
            this.updateDailyLogUI();
            this.showToast('Día reiniciado', 'success');
        }
    }

    // UI Helpers
    toggleSection(e) {
        const btn = e.currentTarget;
        const content = document.getElementById(btn.getAttribute('aria-controls'));
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';

        btn.setAttribute('aria-expanded', !isExpanded);
        content.classList.toggle('collapsed');
        btn.querySelector('.toggle-icon').textContent = isExpanded ? '▼' : '▲';
    }

    showLoading(show, text = 'Cargando...') {
        this.loadingOverlay.classList.toggle('hidden', !show);
        this.loadingText.textContent = text;
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    updateUI() {
        this.updateNutritionUI();
        this.updateDailyLogUI();
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FoodCheckApp();
});
