<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class ChatbotController extends Controller
{
    private ?string $ollamaUrl = null;
    private string $ollamaModel = 'llama3.2';
    private ?string $groqApiKey = null;
    private string $groqModel = 'llama-3.1-8b-instant';

    public function __construct()
    {
        $this->groqApiKey = $_ENV['GROQ_API_KEY'] ?? $_SERVER['GROQ_API_KEY'] ?? getenv('GROQ_API_KEY') ?? '';
        $this->ollamaUrl = $_ENV['OLLAMA_API_URL'] ?? $_SERVER['OLLAMA_API_URL'] ?? getenv('OLLAMA_API_URL') ?? null;
    }
    private array $categoryKeywords = [
        'téléphones' => [
            'téléphone', 'téléphones', 'phone', 'mobile', 'smartphone', 'telephone', 'telephones',
            'iphone', 'samsung', 'huawei', 'xiaomi', 'oppo', 'vivo', 'realme', 'tecno', 'itel',
        ],
        'informatique' => [
            'ordinateur', 'ordinateurs', 'laptop', 'pc', 'macbook', 'ultrabook', 'computer',
            'pc portable', 'informatique', 'notebooks', 'notebook', 'asus', 'acer', 'lenovo', 'dell', 'hp', 'msi',
        ],
        'gaming' => [
            'gaming', 'game', 'playstation', 'xbox', 'console', 'gamer', 'gaming pc',
            'rtx', 'gtx', 'rgb', 'nintendo', 'steam deck',
        ],
        'audio' => [
            'casque', 'headphone', 'écouteur', 'airpod', 'speaker', 'audio',
            'earphones', 'bluetooth', 'soundbar', 'home cinema',
        ],
        'tv & écrans' => [
            'télé', 'tv', 'téléviseur', 'écran', 'smart tv', 'oled', 'qled',
            'television', 'televiseur', 'moniteur', 'monitor',
        ],
        'photo & caméra' => [
            'appareil photo', 'camera', 'photo', 'caméra', 'reflex',
            'mirrorless', 'dslr', 'polaroid', 'gopro',
        ],
        'accessoires' => [
            'accessoire', 'accessoires', 'chargeur', 'cable', 'souris', 'clavier',
            'disque', 'ssd', 'disque dur', 'webcam', 'micro', 'hub', 'tapis',
        ],
        'tablette' => [
            'tablette', 'tablet', 'ipad', 'android tablet', 'tab', 'galaxy tab',
        ],
        'électroménager' => [
            'electroménager', 'electromenager', 'lave-linge', 'réfrigérateur', 'frigo',
            'machine à laver', 'climatiseur', 'clim', 'four', 'micro-onde',
        ],
        'petit électroménager' => [
            'aspirateur', 'fer à repasser', 'grille-pain', 'cafetière', 'robot culinaire',
            'mixeur', 'batteur', 'blender', 'rasoir', 'tondeuse',
        ],
    ];

    private array $arabicCategoryKeywords = [
        'هاتف' => ['هاتف', 'موبايل', 'سمارت فون', 'آيفون', 'جالكسي'],
        'حاسوب' => ['حاسوب', 'لابتوب', 'كمبيوتر', 'ماك'],
        'ألعاب' => ['ألعاب', 'جيمنج', 'بلايستيشن', 'إكس بوكس', 'كونسول'],
        'صوت' => ['سماعات', 'هيدفون', 'إيربود', 'صوت', 'مكبر صوت'],
        'تلفزيون' => ['تلفزيون', 'تي في', 'شاشة', 'سمارت تي في'],
        'كاميرا' => ['كاميرا', 'صورة', 'تصوير'],
        'إكسسوارات' => ['إكسسوارات', 'شاحن', 'كابل', 'ماوس', 'لوحة مفاتيح'],
        'جهاز لوحي' => ['جهاز لوحي', 'تابلت', 'آيباد'],
    ];

    private array $characteristicKeywords = [
        'gaming'       => ['gaming', 'game', 'gamer', 'rtx', 'gtx', 'rgb'],
        'professional' => ['pro', 'professionnel', 'business'],
        'budget'       => ['pas cher', 'économique', 'budget', 'cheap', 'affordable'],
        'high_end'     => ['haut de gamme', 'premium', 'flagship', 'elite'],
        'portable'     => ['portable', 'léger', 'fin', 'ultrabook', 'slim'],
        '5g'           => ['5g', 'cinq g'],
        '4g'           => ['4g', 'quatre g', 'lte'],
    ];

    private array $arabicCharacteristicKeywords = [
        'gaming' => ['جيمنج', 'ألعاب', 'غايمينغ'],
        'budget' => ['رخيص', 'اقتصادي', 'ميزانية'],
        '5g'     => ['5G', 'خمسة جي'],
        '4g'     => ['4G', 'أربعة جي'],
    ];

    private array $pricePatterns = [
        'max'      => '/(?:moins|avant|maximum|max|up to|under|inférieur|moins de|pas plus de)\s*(\d+)/i',
        'min'      => '/(?:plus|minimum|min|au dessus|above|over|supérieur|plus de)\s*(\d+)/i',
        'range'    => '/(\d+)\s*(?:à|-|et|to|from|~)\s*(\d+)/i',
        'range_dt' => '/(\d+)\s*-\s*(\d+)\s*(?:dt|tnd|dinars?)/i',
    ];

    private array $stopWords = [
        'je', 'cherche', 'veux', 'un', 'une', 'des', 'le', 'la', 'les', 'pour', 'avec', 'et', 'ou',
        'mon', 'ma', 'mes', 'dans', 'sur', 'i', 'want', 'am', 'looking', 'for', 'a', 'the', 'to',
        'and', 'or', 'my', 'in', 'on', 'with', 'have', 'need', 'can', 'could', 'should',
    ];

    private string $detectedLanguage = 'fr';

    private array $greetings = [
        'fr' => ['bonjour', 'salut', 'bonsoir', 'coucou', 'hello', 'hi', 'hey', 'salutations', 'bjr', 'svp', 's\'il vous plait'],
        'en' => ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon', 'greetings', 'hi there'],
        'ar' => ['مرحبا', 'اهلا', 'السلام عليكم', 'سلام', 'ما اسمك', 'كيف حالك'],
    ];

    private array $helpQueries = [
        'fr' => ['aide', 'help', 'comment ça marche', 'que peux-tu faire', 'quoi', 'que fait', 'qu\'est ce que'],
        'en' => ['help', 'what can you do', 'how does it work', 'what'],
        'ar' => ['ماذا يمكنك ان تفعل', 'مساعدة', 'كيف'],
    ];

    public function chat(Request $request)
    {
        $message = $request->input('message', '');
        $context = $request->input('context', null);

        \Illuminate\Support\Facades\Log::info('Chatbot received: ' . $message);

        if (empty($message)) {
            return response()->json([
                'reply'    => $this->getWelcomeMessage(),
                'language' => $this->detectedLanguage,
            ]);
        }

        $this->detectedLanguage = $this->detectLanguage($message);
        $messageLower = mb_strtolower($message, 'UTF-8');

        // Check for greetings
        $greetingWords = $this->greetings[$this->detectedLanguage] ?? $this->greetings['fr'];
        $cleanMessage = preg_replace('/[^a-zA-Z]/u', ' ', $messageLower);
        $words = preg_split('/\s+/', trim($cleanMessage));
        $messageWords = array_filter($words, fn($w) => mb_strlen($w) > 1);
        
        foreach ($messageWords as $word) {
            if (in_array($word, $greetingWords)) {
                return response()->json([
                    'reply' => $this->getGreetingResponse(),
                    'language' => $this->detectedLanguage,
                ]);
            }
        }

        // Check for help queries
        $helpWords = $this->helpQueries[$this->detectedLanguage] ?? $this->helpQueries['fr'];
        foreach ($helpWords as $pattern) {
            if (str_contains($messageLower, $pattern)) {
                return response()->json([
                    'reply' => $this->getHelpResponse(),
                    'language' => $this->detectedLanguage,
                ]);
            }
        }

        // Detect comparison intent
        $comparisonPatterns = [
            '/(lequel|laquelle|lesquel|quel|quelle)\s+(est|sont|recommande|meilleur|meilleure|top)/i',
            '/(lequel|laquelle|lesquel)\s+(choisir|prendre|acheter)/i',
            '/(which one|which is|best|recommended|top|better)/i',
            '/^(quel|quelle|laquelle|lequel|meilleur|conseil)/i',
            '/(un seul|une seule|le meilleur|la meilleure|just one|give me one)/i',
        ];

        $isComparison = false;
        $showOnlyOne = false;
        foreach ($comparisonPatterns as $pattern) {
            if (@preg_match($pattern, $messageLower)) {
                $isComparison = true;
                if (@preg_match('/(un seul|une seule|le meilleur|la meilleure|just one|give me one)/i', $messageLower)) {
                    $showOnlyOne = true;
                }
                break;
            }
        }

        // Enrich with context criteria if comparison or follow-up
        if ($context && isset($context['criteria']) && is_array($context['criteria'])) {
            $parts = [];
            if (!empty($context['criteria']['category'])) {
                $parts[] = $context['criteria']['category'];
            }
            if (!empty($context['criteria']['max_price'])) {
                $parts[] = 'max ' . $context['criteria']['max_price'];
            }
            if (!empty($parts)) {
                $messageLower = implode(' ', $parts) . ' ' . $messageLower;
            }
        }

        $extracted = $this->extractCriteria($messageLower);
        $products  = $this->searchProducts($extracted);

        if ($products->isEmpty()) {
            $aiReply = $this->callOllama($message, $this->detectedLanguage);
            if ($aiReply) {
                return response()->json([
                    'reply'    => $aiReply,
                    'language' => $this->detectedLanguage,
                ]);
            }
            return response()->json([
                'reply'    => $this->generateNoResultsMessage($extracted),
                'language' => $this->detectedLanguage,
            ]);
        }

        if ($isComparison) {
            $ranked = $this->rankProducts($products);
            $reply  = $this->generateComparisonResponse($ranked, $showOnlyOne);

            return response()->json([
                'reply'         => $reply,
                'products'      => ($showOnlyOne ? $ranked->take(1) : $ranked->take(5))->map(fn($p) => [
                    'id'        => $p['id'],
                    'name'      => $p['name'],
                    'image_url' => $p['image_url'],
                    'price'     => $p['lowest_price'],
                    'category'  => $p['category'],
                    'brand'     => $p['brand'],
                    'score'     => $p['score'],
                    'reasons'   => $p['reasons'],
                ]),
                'is_comparison' => true,
                'language'      => $this->detectedLanguage,
            ]);
        }

        $reply = $this->generateResponse($products, $extracted);

        return response()->json([
            'reply'    => $reply,
            'products' => $products->take(5)->map(fn($p) => [
                'id'        => $p->id,
                'name'      => $p->name,
                'image_url' => $p->image_url,
                'price'     => $p->lowest_price,
                'category'  => $p->category?->name,
                'brand'     => $p->brand?->name,
            ]),
            'criteria' => $extracted,
            'language' => $this->detectedLanguage,
        ]);
    }

    private function detectLanguage(string $message): string
    {
        // Simple Arabic detection - check for Arabic characters
        if (preg_match('/[\p{Arabic}]/u', $message)) {
            return 'ar';
        }

        $englishWords = ['i', 'want', 'looking', 'for', 'need', 'search', 'find', 'phone', 'laptop', 'gaming', 'budget', 'cheap', 'price', 'buy'];
        $words        = preg_split('/\s+/', mb_strtolower($message, 'UTF-8'));
        $count        = 0;
        foreach ($words as $w) {
            if (in_array(trim($w, '.,!?;:'), $englishWords)) {
                $count++;
            }
        }
        return $count >= 2 ? 'en' : 'fr';
    }

    private function getWelcomeMessage(): string
    {
        return match ($this->detectedLanguage) {
            'en'    => "Hello! I'm your shopping assistant. Tell me what you're looking for (product, budget, features)...",
            'ar'    => "مرحباً! أنا مساعد التسوق الخاص بك. أخبرني بما تبحث عنه...",
            default => "Bonjour ! Je suis votre assistant d'achat. Décrivez ce que vous recherchez (produit, budget, caractéristiques)...",
        };
    }

    private function getGreetingResponse(): string
    {
        return match ($this->detectedLanguage) {
            'en'    => "Hello! 👋 I'm Prixy, your shopping assistant!\n\nI can help you find the best prices for products in Tunisia. Just tell me:\n• What you're looking for (phone, laptop, etc.)\n• Your budget\n• Any specific features\n\nWhat would you like to find today?",
            'ar'    => "مرحباً! 👋 أنا Prixy، مساعد التسوق الخاص بك!\n\nيمكنني مساعدتك في finding أفضل الأسعار في تونس. أخبرني:\n• ما تبحث عنه\n• ميزانيتك\n• أي مواصفات خاصة\n\nماذا تريد أن تجد اليوم؟",
            default => "Salut! 👋 Je suis Prixy, votre assistant shopping!\n\nJe peux vous aider à trouver les meilleurs prix en Tunisie. Dites-moi:\n• Ce que vous recherchez (téléphone, laptop, etc.)\n• Votre budget\n• Cualquier caractéristique particulière\n\nQu'est-ce que vous voulez trouver aujourd'hui?",
        };
    }

    private function getHelpResponse(): string
    {
        return match ($this->detectedLanguage) {
            'en'    => "I'm Prixy, your shopping assistant! 🎯\n\nHere's what I can do:\n• Search products by name or category\n• Filter by budget (ex: \"less than 500 TND\")\n• Compare products and recommend the best ones\n• Find specific brands (Samsung, Apple, Dell...)\n\nJust tell me what you need!",
            'ar'    => "أنا Prixy، مساعد التسوق الخاص بك! 🎯\n\nما يمكنني فعله:\n• البحث عن_products بالاسم أو الفئة\n• التصفية حسب الميزانية\n• مقارنة المنتجات والتوصية بأفضلها\n•Find علامات تجارية محددة\n\nأخبرني بما تحتاجه!",
            default => "Je suis Prixy, votre assistant shopping! 🎯\n\nVoici ce que je peux faire:\n• Rechercher des produits par nom ou catégorie\n• Filtrer par budget (ex: \"moins de 500 TND\")\n• Comparer les produits et recommander les meilleurs\n• Trouver des marques spécifiques (Samsung, Apple, Dell...)\n\nDites-moi juste ce dont vous avez besoin!",
        };
    }

    private function extractCriteria(string $message): array
    {
        $criteria = ['category' => null, 'min_price' => null, 'max_price' => null, 'characteristics' => [], 'keywords' => []];

        foreach ($this->categoryKeywords as $category => $keywords) {
            foreach ($keywords as $kw) {
                if (str_contains($message, mb_strtolower($kw, 'UTF-8'))) {
                    $criteria['category'] = $category;
                    break 2;
                }
            }
        }

        foreach ($this->arabicCategoryKeywords as $category => $keywords) {
            foreach ($keywords as $kw) {
                if (str_contains($message, $kw)) {
                    $criteria['category'] = $category;
                    break 2;
                }
            }
        }

        foreach ($this->pricePatterns as $type => $pattern) {
            if (preg_match($pattern, $message, $m)) {
                if ($type === 'range' || $type === 'range_dt') {
                    $criteria['min_price'] = (float) $m[1];
                    $criteria['max_price'] = (float) $m[2];
                } elseif ($type === 'min') {
                    $criteria['min_price'] = (float) $m[1];
                } elseif ($type === 'max') {
                    $criteria['max_price'] = (float) $m[1];
                }
            }
        }

        // Extra number patterns for price
        $extras = [
            '/jusqu\'?à?\s*(\d+)/i',
            '/moins\s*de\s*(\d+)/i',
            '/budget\s*(?:de)?\s*(\d+)/i',
            '/under\s*(\d+)/i',
            '/entre\s*(\d+)\s*et\s*(\d+)/i',
            '/(\d+)\s*(?:à|a)\s*(\d+)\s*(?:dt|tnd|dinars?)?/i',
            '/(\d+)\s*(?:dt|tnd|dinars?)/i',
        ];
        foreach ($extras as $p) {
            if (preg_match($p, $message, $m)) {
                if (count($m) === 3) {
                    $criteria['min_price'] = $criteria['min_price'] ?? (float) $m[1];
                    $criteria['max_price'] = $criteria['max_price'] ?? (float) $m[2];
                } elseif (count($m) === 2 && !$criteria['max_price']) {
                    $criteria['max_price'] = (float) $m[1];
                }
            }
        }

        foreach ($this->characteristicKeywords as $char => $keywords) {
            foreach ($keywords as $kw) {
                if (str_contains($message, mb_strtolower($kw, 'UTF-8'))) {
                    $criteria['characteristics'][] = $char;
                    break;
                }
            }
        }

        foreach ($this->arabicCharacteristicKeywords as $char => $keywords) {
            foreach ($keywords as $kw) {
                if (str_contains($message, $kw)) {
                    $criteria['characteristics'][] = $char;
                    break;
                }
            }
        }

        $words = preg_split('/\s+/', $message);
        foreach ($words as $word) {
            $clean = mb_strtolower(trim($word, '.,!?;:()[]{}،'), 'UTF-8');
            if (!in_array($clean, $this->stopWords) && mb_strlen($clean) > 2 && !is_numeric($clean)) {
                $criteria['keywords'][] = $clean;
            }
        }

        return $criteria;
    }

    private function searchProducts(array $criteria)
    {
        $query = Product::with(['offers', 'category', 'brand']);

        if ($criteria['category']) {
            $cat = Category::where('name', 'ilike', '%' . $criteria['category'] . '%')->first();
            if ($cat) {
                $query->where('category_id', $cat->id);
            }
        }

        if (!empty($criteria['keywords'])) {
            $query->where(function ($q) use ($criteria) {
                foreach ($criteria['keywords'] as $kw) {
                    $q->orWhere('name', 'ilike', "%{$kw}%")
                      ->orWhere('description', 'ilike', "%{$kw}%");
                }
            });
        }

        if ($criteria['min_price'] || $criteria['max_price']) {
            $query->whereHas('offers', function ($q) use ($criteria) {
                if ($criteria['min_price']) {
                    $q->where('price', '>=', $criteria['min_price']);
                }
                if ($criteria['max_price']) {
                    $q->where('price', '<=', $criteria['max_price']);
                }
                $q->where('is_available', true);
            });
        }

        return $query->limit(50)->get()->map(function ($p) {
            $p->lowest_price = $p->offers->where('is_available', true)->min('price');
            return $p;
        })->filter(fn($p) => $p->lowest_price !== null)->sortBy('lowest_price');
    }

    private function rankProducts($products)
    {
        return $products->map(function ($p) {
            $score   = 0;
            $reasons = [];

            $price = $p->lowest_price;
            if ($price) {
                if ($price < 100)       { $score += 40; $reasons[] = 'Excellent prix'; }
                elseif ($price < 300)   { $score += 30; $reasons[] = 'Bon rapport qualité/prix'; }
                elseif ($price < 500)   { $score += 20; $reasons[] = 'Prix intermédiaire'; }
                else                    { $score += 10; }
            }

            $offerCount = $p->offers->where('is_available', true)->count();
            if ($offerCount >= 3)      { $score += 30; $reasons[] = 'Plusieurs marchands disponibles'; }
            elseif ($offerCount >= 2)  { $score += 20; $reasons[] = 'Quelques offres disponibles'; }
            elseif ($offerCount == 1)  { $score += 10; }

            if ($p->brand?->name) { $score += 20; $reasons[] = 'Marque reconnue: ' . $p->brand->name; }

            return [
                'id'           => $p->id,
                'name'         => $p->name,
                'image_url'    => $p->image_url,
                'lowest_price' => $p->lowest_price,
                'category'     => $p->category?->name,
                'brand'        => $p->brand?->name,
                'offer_count'  => $offerCount,
                'score'        => $score,
                'reasons'      => $reasons,
            ];
        })->sortByDesc('score')->values();
    }

    private function generateComparisonResponse($ranked, bool $showOnlyOne): string
    {
        if ($ranked->isEmpty()) {
            return "Je n'ai pas trouvé assez de produits pour faire une comparaison.";
        }

        $top = $ranked->first();

        if ($showOnlyOne || $ranked->count() === 1) {
            return match ($this->detectedLanguage) {
                    'en' => "Here's my best recommendation:\n\n",
                    'ar' => "ها أفضل توصية:\n\n",
                    default => "Voici mon meilleur choix:\n\n",
                } .
                "📦 {$top['name']}\n" .
                "💰 Prix: " . number_format($top['lowest_price'], 0, ',', ' ') . " TND\n" .
                implode("\n", array_map(fn($r) => "✅ $r", $top['reasons']));
        }

        $second   = $ranked->get(1);
        $response = "🏆 **MEILLEUR CHOIX**: {$top['name']}\n";
        $response .= "💰 " . number_format($top['lowest_price'], 0, ',', ' ') . " TND\n";
        foreach ($top['reasons'] as $r) {
            $response .= "✅ $r\n";
        }

        $response .= "\n🥈 **2ÈME CHOIX**: {$second['name']}\n";
        $response .= "💰 " . number_format($second['lowest_price'], 0, ',', ' ') . " TND\n";
        if (!empty($second['reasons'])) {
            $response .= "✅ {$second['reasons'][0]}\n";
        }

        return $response;
    }

    private function generateResponse($products, array $criteria): string
    {
        $count = $products->count();

        $intro = match ($this->detectedLanguage) {
            'en'    => "I found {$count} product(s) matching your needs!\n\n",
            'ar'    => "وجدت {$count} منتج يناسب احتياجاتك!\n\n",
            default => "J'ai trouvé {$count} produit(s) correspondant à vos besoins !\n\n",
        };

        $response = $intro;

        foreach ($products->take(5) as $i => $p) {
            $price    = $p->lowest_price ? number_format($p->lowest_price, 0, ',', ' ') . ' TND' : 'N/A';
            $brand    = $p->brand?->name ?? '';
            $response .= "📦 " . ($i + 1) . ". {$p->name}\n";
            $response .= "   💰 {$price}" . ($brand ? " | {$brand}" : '') . "\n\n";
        }

        $response .= match ($this->detectedLanguage) {
            'en'    => "Click on a product for full details and merchant prices!",
            'ar'    => "انقر على المنتج لرؤية التفاصيل!",
            default => "Cliquez sur un produit pour voir les détails et comparer les prix !",
        };

        return $response;
    }

    private function callOllama(string $message, string $language): ?string
    {
        // Always try Groq first (free, fast, reliable)
        \Illuminate\Support\Facades\Log::info('Calling Groq, key length: ' . strlen($this->groqApiKey ?? ''));
        
        if (!empty($this->groqApiKey)) {
            $reply = $this->callGroq($message, $language);
            if ($reply) {
                \Illuminate\Support\Facades\Log::info('Groq returned: ' . substr($reply, 0, 100));
                return $reply;
            }
        }

        // Fallback to Ollama if configured
        if (empty($this->ollamaUrl)) {
            \Illuminate\Support\Facades\Log::info('No Ollama URL configured');
            return null;
        }

        $systemPrompt = match ($language) {
            'ar' => 'أنت Prixy، مساعد تسوق ودود. ساعد المستخدم في إيجاد المنتجات في Tunisia. كن مختصرا وودودا.',
            'en' => 'You are Prixy, a friendly shopping assistant. Help users find products in Tunisia. Be concise and friendly.',
            default => 'Tu es Prixy, un assistant shopping amical. Aide les utilisateurs à trouver des produits en Tunisie. Sois concis et amical.',
        };

        $prompt = "{$systemPrompt}\n\nUtilisateur: {$message}\nPrixy:";

        try {
            $response = Http::timeout(30)->post($this->ollamaUrl . '/api/generate', [
                'model' => $this->ollamaModel,
                'prompt' => $prompt,
                'stream' => false,
            ]);

            if ($response->successful()) {
                $result = $response->json();
                return trim($result['response'] ?? '');
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Ollama error: ' . $e->getMessage());
        }

        return null;
    }

    private function callGroq(string $message, string $language): ?string
    {
        if (empty($this->groqApiKey)) {
            \Illuminate\Support\Facades\Log::error('Groq API key is empty');
            return null;
        }

        $systemPrompt = match ($language) {
            'ar' => 'أنت Prixy، مساعد تسوق ودود. ساعد المستخدم في إيجاد المنتجات في Tunisia. كن مختصرا وودودا. إذا لم تجد منتجا، اعتذر واقترح كلمات بديلة.',
            'en' => 'You are Prixy, a friendly shopping assistant. Help users find products in Tunisia. Be concise and friendly. If no product found, apologize and suggest alternatives.',
            default => 'Tu es Prixy, un assistant shopping amical. Aide les utilisateurs à trouver des produits en Tunisie. Sois concis et amical. Si tu ne trouves pas de produit, excuse-toi et suggère des alternatives.',
        };

        try {
            $response = Http::timeout(30)->withHeaders([
                'Authorization' => 'Bearer ' . $this->groqApiKey,
                'Content-Type' => 'application/json',
            ])->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => $this->groqModel,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $message],
                ],
                'temperature' => 0.7,
                'max_tokens' => 200,
            ]);

            \Illuminate\Support\Facades\Log::info('Groq response status: ' . $response->status());
            
            if ($response->successful()) {
                $result = $response->json();
                return trim($result['choices'][0]['message']['content'] ?? '');
            } else {
                \Illuminate\Support\Facades\Log::error('Groq API error: ' . $response->status() . ' - ' . $response->body());
                return 'Groq error: ' . $response->status();
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Groq exception: ' . $e->getMessage());
            return 'Groq exception: ' . $e->getMessage();
        }
    }

    private function generateNoResultsMessage(array $criteria): string
    {
        $msg = match ($this->detectedLanguage) {
            'en'    => "Sorry, I couldn't find any products matching your criteria.",
            'ar'    => "عذراً، لم أتمكن من العثور على منتجات تطابق معاييرك.",
            default => "Désolé, je n'ai trouvé aucun produit correspondant à vos critères.",
        };

        if ($criteria['max_price'] && $criteria['max_price'] < 500) {
            $msg .= match ($this->detectedLanguage) {
                'en'    => "\n\n💡 Try increasing your budget slightly.",
                'ar'    => "\n\n💡 حاول زيادة ميزانيتك قليلاً.",
                default => "\n\n💡 Essayez d'augmenter légèrement votre budget.",
            };
        }

        $msg .= match ($this->detectedLanguage) {
            'en'    => "\n\n- Try different keywords\n- Widen your price range\n- Change category",
            'ar'    => "\n\n- جرب كلمات مختلفة\n- وسّع نطاق السعر\n- غير الفئة",
            default => "\n\n- Essayez d'autres mots-clés\n- Élargissez votre fourchette de prix\n- Changez de catégorie",
        };

        return $msg;
    }
}
