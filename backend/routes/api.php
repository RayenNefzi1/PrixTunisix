<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\EmployeeController;
use App\Http\Controllers\Admin\ScrapingController;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;
use Illuminate\Http\Request;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\OtpController;
use App\Http\Controllers\Catalog\BrandController;
use App\Http\Controllers\Catalog\BoutiqueController;
use App\Http\Controllers\Catalog\CategoryController;
use App\Http\Controllers\Catalog\ChatbotController;
use App\Http\Controllers\Catalog\MarqueController;
use App\Http\Controllers\Client\DashboardController;
use App\Http\Controllers\Client\FavoriteController;
use App\Http\Controllers\Client\PriceAlertController;
use App\Http\Controllers\Catalog\OfferController;
use App\Http\Controllers\Catalog\ProductController;
use App\Http\Controllers\Catalog\SearchController;
use App\Http\Controllers\Client\WishlistController;
use App\Http\Controllers\Fournisseur\FournisseurAuthController;
use App\Http\Controllers\Fournisseur\FournisseurController;
use App\Http\Controllers\Merchant\MerchantController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — PrixTunisix
|--------------------------------------------------------------------------
*/

Route::middleware('api')->group(function () {

// Public auth routes
// ── Public auth ───────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('login',    [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);

    Route::post('otp/send',            [OtpController::class, 'send']);
    Route::post('otp/verify-login',    [OtpController::class, 'verifyLogin']);
    Route::post('otp/verify-register', [OtpController::class, 'verifyRegister']);
});

// ── Employee API (public test) ───────────────────────────────────────────
Route::get('employee-test', function() {
    return response()->json(['status' => 'ok', 'time' => now()]);
});

Route::get('run-migrations', function() {
    try {
        Schema::table('employees', function ($table) {
            if (!Schema::hasColumn('employees', 'name')) {
                $table->string('name')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('employees', 'prename')) {
                $table->string('prename')->nullable()->after('name');
            }
            if (!Schema::hasColumn('employees', 'cin')) {
                $table->string('cin')->nullable()->unique()->after('prename');
            }
            if (!Schema::hasColumn('employees', 'phone')) {
                $table->string('phone')->nullable()->after('cin');
            }
            if (!Schema::hasColumn('employees', 'auto_id')) {
                $table->string('auto_id')->nullable()->unique()->after('phone');
            }
        });
        return response()->json(['status' => 'ok', 'message' => 'Columns added']);
    } catch (\Exception $e) {
        return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
    }
});

// ── Employee API ────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::get('employee/dashboard', [AdminController::class, 'dashboard']);
    Route::get('employee/products', [\App\Http\Controllers\Catalog\ProductController::class, 'index']);
    Route::put('employee/products/{product}', [\App\Http\Controllers\Catalog\ProductController::class, 'update']);
    Route::delete('employee/products/{product}', [\App\Http\Controllers\Catalog\ProductController::class, 'destroy']);
    Route::get('employee/categories', [\App\Http\Controllers\Catalog\CategoryController::class, 'index']);
    Route::get('employee/alerts', [AdminController::class, 'alerts']);
    Route::get('employee/analytics/clicks', [AdminController::class, 'clickAnalytics']);
    Route::get('employee/manual-product-requests', [AdminController::class, 'getManualProductRequests']);
    Route::get('employee/manual-products/pending-count', [AdminController::class, 'getPendingManualProductCount']);
    Route::get('employee/manual-products/{requestId}', [AdminController::class, 'getManualProducts']);
    Route::post('employee/manual-products/{id}/approve', [AdminController::class, 'approveManualProduct']);
    Route::post('employee/manual-products/{id}/reject', [AdminController::class, 'rejectManualProduct']);
});

// ── Public catalog ────────────────────────────────────────────────────────
Route::get('categories',           [CategoryController::class, 'index']);
Route::get('categories/{category}',[CategoryController::class, 'show']);
Route::get('brands',               [BrandController::class, 'index']);
Route::get('brands/{brand}',       [BrandController::class, 'show']);
Route::get('products',             [ProductController::class, 'index']);
Route::get('products/{product}',   [ProductController::class, 'show']);
Route::get('products/{product}/offers', [ProductController::class, 'offers']);

// SEF URL: /produits/{categorySlug}/{productSlug}
Route::get('produits/{categorySlug}/{productSlug}', [ProductController::class, 'showBySlug']);

// Search
Route::get('search/suggestions', [SearchController::class, 'suggestions']);
Route::get('search/results',     [SearchController::class, 'results']);
Route::get('search/filters',     [SearchController::class, 'filters']);

// Price history & redirect
Route::get('offers/{offer}/price-history', [OfferController::class, 'priceHistory']);
Route::get('offers/{offer}/redirect', [OfferController::class, 'redirect']);
Route::get('offers/{offer}/go', [OfferController::class, 'go']);

// ── Boutiques (merchant storefronts) ──────────────────────────────────────
Route::get('boutiques',        [BoutiqueController::class, 'index']);
Route::get('boutiques/{slug}', [BoutiqueController::class, 'show']);

// ── Marques (brands) ─────────────────────────────────────────────────────
Route::get('marques',        [MarqueController::class, 'index']);
Route::get('marques/{slug}', [MarqueController::class, 'show']);

// ── Chatbot ───────────────────────────────────────────────────────────────
Route::post('chatbot', [ChatbotController::class, 'chat']);

// ── Public seed endpoints ──────────────────────────────────────────────
Route::post('/seed', function () {
    \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
    return response()->json(['message' => 'Database seeded successfully']);
});
Route::get('/seed', function () {
    \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
    return response()->json(['message' => 'Database seeded successfully']);
});

Route::get('/create-coupons-table', function () {
    try {
        \Illuminate\Support\Facades\Schema::create('coupons', function ($table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('description')->nullable();
            $table->decimal('discount_value', 10, 3);
            $table->enum('discount_type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('min_order_amount', 10, 3)->nullable();
            $table->decimal('max_discount', 10, 3)->nullable();
            $table->integer('usage_limit')->nullable();
            $table->integer('usage_count')->default(0);
            $table->foreignId('offer_id')->nullable()->constrained()->cascadeOnDelete();
            $table->timestamp('valid_from')->nullable();
            $table->timestamp('valid_until')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        return response()->json(['message' => 'Coupons table created']);
    } catch (\Exception $e) {
        return response()->json(['message' => $e->getMessage()], 500);
    }
});

Route::get('/seed-coupons', function () {
    try {
        $offer = \App\Models\Offer::first();
        if (!$offer) {
            return response()->json(['message' => 'No offers found'], 400);
        }
        \App\Models\Coupon::firstOrCreate(['code' => 'WELCOME10'], [
            'description' => '10% discount for new customers',
            'discount_value' => 10,
            'discount_type' => 'percentage',
            'min_order_amount' => 100,
            'usage_limit' => 100,
            'offer_id' => $offer->id,
            'valid_from' => now(),
            'valid_until' => now()->addMonths(3),
            'is_active' => true,
        ]);
        \App\Models\Coupon::firstOrCreate(['code' => 'SAVE50'], [
            'description' => '50 DT fixed discount',
            'discount_value' => 50,
            'discount_type' => 'fixed',
            'min_order_amount' => 500,
            'max_discount' => 50,
            'usage_limit' => 50,
            'offer_id' => $offer->id,
            'valid_from' => now(),
            'valid_until' => now()->addMonths(2),
            'is_active' => true,
        ]);
        \App\Models\Coupon::firstOrCreate(['code' => 'SUMMER20'], [
            'description' => '20% summer sale',
            'discount_value' => 20,
            'discount_type' => 'percentage',
            'min_order_amount' => 200,
            'max_discount' => 100,
            'usage_limit' => 200,
            'offer_id' => null,
            'valid_from' => now(),
            'valid_until' => now()->addMonths(1),
            'is_active' => true,
        ]);
        return response()->json(['message' => 'Coupons seeded successfully']);
    } catch (\Exception $e) {
        return response()->json(['message' => $e->getMessage()], 500);
    }
});

// Public coupons endpoint (guests can see active coupons)
Route::get('/coupons', function () {
    $coupons = \App\Models\Coupon::where('is_active', true)
        ->where(function ($query) {
            $query->whereNull('valid_from')
                  ->orWhere('valid_from', '<=', now());
        })
        ->where(function ($query) {
            $query->whereNull('valid_until')
                  ->orWhere('valid_until', '>=', now());
        })
        ->where(function ($query) {
            $query->whereNull('usage_limit')
                  ->orWhereRaw('usage_count < usage_limit');
        })
        ->with(['offer.product', 'offer.merchantWebsite'])
        ->get();
    return response()->json($coupons);
});

Route::get('/seed-fournisseurs', function () {
    $fournisseurs = [
        ['email' => 'contact@tunisiteck.com', 'name' => 'TunisiaTech', 'pass' => 'TunisiaTech@12345', 'plan' => 'max', 'merchant_id' => 4, 'merchant_url' => 'https://www.tunisiteck.com'],
        ['email' => 'contact@nutridiet.tn', 'name' => 'Nutridiet', 'pass' => 'Nutridiet@12345', 'plan' => 'premium_manual', 'merchant_id' => null, 'merchant_url' => 'https://www.nutridiet.tn'],
        ['email' => 'contact@ipmact.tn', 'name' => 'Ipmact Nutrition', 'pass' => 'Ipmact@12345', 'plan' => 'premium_manual', 'merchant_id' => null, 'merchant_url' => 'https://www.ipmact.tn'],
        ['email' => 'contact@motottunisie.tn', 'name' => 'Motottunisie', 'pass' => 'Motot@12345', 'plan' => 'premium_manual', 'merchant_id' => null, 'merchant_url' => 'https://www.motottunisie.tn'],
        ['email' => 'contact@motor.tn', 'name' => 'Motor', 'pass' => 'Motor@12345', 'plan' => 'pro', 'merchant_id' => null, 'merchant_url' => 'https://www.motor.tn'],
    ];
    foreach ($fournisseurs as $f) {
        $user = \App\Models\User::firstOrCreate(['email' => $f['email']], [
            'name' => $f['name'], 'prename' => 'Admin', 'password' => \Illuminate\Support\Facades\Hash::make($f['pass']), 'role' => 'fournisseur'
        ]);
        $fournisseur = \App\Models\Fournisseur::firstOrCreate(['user_id' => $user->id], [
            'merchant_website_id' => $f['merchant_id'], 'company_name' => $f['name'], 'contact_email' => $f['email'],
            'merchant_url' => $f['merchant_url'], 'company_phone' => '+216 72 000 000', 'company_address' => 'Tunis, Tunisia',
            'api_key' => \App\Models\Fournisseur::generateApiKey(), 'active' => true
        ]);
        \App\Models\FournisseurSubscription::updateOrCreate(['fournisseur_id' => $fournisseur->id], [
            'plan' => $f['plan'], 'price' => in_array($f['plan'], ['premium_manual']) ? 19.99 : (in_array($f['plan'], ['pro']) ? 29.99 : 49.99),
            'start_date' => now()->subDays(15), 'end_date' => now()->addDays(15), 'status' => 'active'
        ]);
    }
    return response()->json(['message' => 'Fournisseurs seeded successfully']);
});

Route::get('/fix-basic-subscriptions', function () {
    $basicSubs = \App\Models\FournisseurSubscription::where('plan', 'basic')->get();
    foreach ($basicSubs as $sub) {
        $sub->update(['plan' => 'premium_manual', 'price' => 19.99]);
    }
    return response()->json(['message' => "Updated {$basicSubs->count()} subscriptions from basic to premium_manual"]);
});

Route::get('/update-tunisianet-logo', function () {
    $mw = \App\Models\MerchantWebsite::where('name', 'Tunisianet')->first();
    if ($mw) {
        $mw->update(['logo_url' => 'https://borgiphones.com/wp-content/uploads/2024/02/tunisianet-logo.png']);
        return response()->json(['message' => 'Tunisianet logo updated']);
    }
    return response()->json(['message' => 'Tunisianet not found'], 404);
});

Route::get('/update-tunisiatech-logo', function () {
    $mw = \App\Models\MerchantWebsite::where('name', 'TunisiaTech')->first();
    if ($mw) {
        $mw->update(['logo_url' => 'https://cdn.primini.tn/8bfdb42c-b046-4c84-9100-13b14785668d.jpg']);
        return response()->json(['message' => 'TunisiaTech logo updated']);
    }
    return response()->json(['message' => 'TunisiaTech not found'], 404);
});

Route::get('/update-motorz-logo', function () {
    $mw = \App\Models\MerchantWebsite::where('name', 'Motorz')->first();
    if ($mw) {
        $mw->update(['logo_url' => 'https://motorz.tn/wp-content/uploads/2025/05/LOGO-RB.png']);
        return response()->json(['message' => 'Motorz logo updated']);
    }
    return response()->json(['message' => 'Motorz not found'], 404);
});

Route::get('/update-motottunisie-logo', function () {
    $mw = \App\Models\MerchantWebsite::where('name', 'Motottunisie')->first();
    if ($mw) {
        $mw->update(['logo_url' => 'https://www.mototunisie.tn/wp-content/uploads/2025/12/moto-tunisie-logo-white-3.png']);
        return response()->json(['message' => 'Motottunisie logo updated']);
    }
    return response()->json(['message' => 'Motottunisie not found'], 404);
});

Route::get('/seed-analytics', function () {
    $fournisseurs = \App\Models\Fournisseur::whereNotNull('merchant_website_id')->get();
    
    $totalClicks = 0;
    $totalViews = 0;
    
    foreach ($fournisseurs as $fournisseur) {
        $offers = \App\Models\Offer::where('merchant_website_id', $fournisseur->merchant_website_id)
            ->whereNotNull('product_id')
            ->get();
        $productIds = $offers->pluck('product_id')->unique()->filter()->toArray();
        
        if (empty($productIds)) continue;
        
        $clicksCount = rand(50, 200);
        $totalClicks += $clicksCount;
        
        for ($i = 0; $i < $clicksCount; $i++) {
            $productId = $productIds[array_rand($productIds)];
            \App\Models\MerchantClick::create([
                'fournisseur_id' => $fournisseur->id,
                'product_id' => $productId,
                'referrer' => 'https://www.google.' . ['tn', 'fr'][array_rand(['tn', 'fr'])] . '/search?q=' . urlencode(['prix', 'acheter', 'compare'][array_rand(['prix', 'acheter', 'compare'])]),
                'ip_address' => '197.' . rand(27, 31) . '.' . rand(1, 255) . '.' . rand(1, 255),
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/' . rand(110, 125) . '.0',
                'clicked_at' => now()->subDays(rand(0, 30))->subHours(rand(0, 23))->subMinutes(rand(0, 59)),
            ]);
        }
        
        foreach ($productIds as $productId) {
            for ($d = 0; $d <= rand(5, 15); $d++) {
                $viewDate = now()->subDays($d)->toDateString();
                $existing = \App\Models\ProductView::where('fournisseur_id', $fournisseur->id)
                    ->where('product_id', $productId)
                    ->where('view_date', $viewDate)
                    ->first();
                
                if ($existing) {
                    $existing->increment('view_count', rand(1, 10));
                    $totalViews += rand(1, 10);
                } else {
                    \App\Models\ProductView::create([
                        'fournisseur_id' => $fournisseur->id,
                        'product_id' => $productId,
                        'merchant_website_id' => $fournisseur->merchant_website_id,
                        'view_date' => $viewDate,
                        'view_count' => rand(1, 20),
                    ]);
                    $totalViews += rand(1, 20);
                }
            }
        }
    }
    
    return response()->json([
        'message' => 'Analytics data seeded',
        'total_clicks' => $totalClicks,
        'total_views' => $totalViews,
    ]);
});

Route::get('/create-test-client', function () {
    $phone = request('phone', '+21698000001');
    $code = '123456';
    
    $user = \App\Models\User::firstOrCreate(
        ['email' => 'client@test.tn'],
        ['name' => 'Test', 'prename' => 'Client', 'password' => \Illuminate\Support\Facades\Hash::make('test123'), 'role' => 'client', 'phone' => $phone]
    );
    
    \App\Models\Client::updateOrCreate(
        ['user_id' => $user->id],
        ['phone' => $phone]
    );
    
    \App\Models\PhoneOtp::where('phone', $phone)->delete();
    
    \App\Models\PhoneOtp::create([
        'phone' => $phone,
        'code' => $code,
        'expires_at' => now()->addHours(24),
        'used_at' => null
    ]);
    
    return response()->json([
        'message' => 'Client ready. Use phone: ' . $phone . ' and OTP: ' . $code,
        'phone' => $phone,
        'otp' => $code,
        'expires' => now()->addHours(24)->toDateTimeString()
    ]);
});

Route::get('/check-otp', function () {
    $phone = request('phone', '+21698000001');
    $otp = \App\Models\PhoneOtp::where('phone', $phone)->first();
    
    if (!$otp) {
        return response()->json(['message' => 'No OTP found', 'phone' => $phone]);
    }
    
    return response()->json([
        'phone' => $otp->phone,
        'code' => $otp->code,
        'expires_at' => $otp->expires_at,
        'used_at' => $otp->used_at,
        'is_valid' => $otp->expires_at > now() && is_null($otp->used_at)
    ]);
});

Route::post('/test-login', function (Request $request) {
    $data = $request->all();
    
    return response()->json([
        'received' => $data,
        'otp_in_db' => \App\Models\PhoneOtp::where('phone', '+21698000001')->first(),
        'user_by_phone' => \App\Models\User::where('phone', '+21698000001')->first(),
        'client_by_phone' => \App\Models\Client::where('phone', '+21698000001')->first()
    ]);
});

Route::get('/test-login', function () {
    return response()->json([
        'otp_in_db' => \App\Models\PhoneOtp::where('phone', '+21698000001')->first(),
        'user_by_phone' => \App\Models\User::where('phone', '+21698000001')->first(),
        'client_by_phone' => \App\Models\Client::where('phone', '+21698000001')->first()
    ]);
});

Route::get('/add-tunisiatech-offer', function () {
    // Find or create the product - use slug to find existing
    $productName = 'Tablette Samsung Galaxy Tab A11 Wi-Fi 4G 4Go 64Go Silver';
    $slug = 'tablette-samsung-galaxy-tab-a11-4g-lte-4go-64go-87-wxga-gris-sm-a11-4-64-gr';
    
    $brand = \App\Models\Brand::firstOrCreate(['name' => 'Samsung'], ['slug' => 'samsung']);
    $category = \App\Models\Category::where('slug', 'tablettes')->first();
    
    // Find existing product by slug first
    $product = \App\Models\Product::where('slug', $slug)->first();
    
    if (!$product) {
        // Try by name
        $product = \App\Models\Product::where('name', 'like', '%Samsung Galaxy Tab A11%')->first();
    }
    
    if (!$product) {
        // Create new if not exists
        $product = \App\Models\Product::create([
            'name' => $productName,
            'slug' => $slug,
            'category_id' => $category?->id,
            'brand_id' => $brand->id,
            'image_url' => 'https://www.tunisiatech.tn/16538-medium_default/tablette-samsung-galaxy-tab-a11-wi-fi-4g-4go-64go-silver.jpg',
            'is_validated' => true,
        ]);
    }
    
    // Find TunisiaTech merchant website (id 4)
    $merchantWebsite = \App\Models\MerchantWebsite::find(4);
    
    // Create or update offer
    $offer = \App\Models\Offer::updateOrCreate(
        [
            'product_id' => $product->id,
            'merchant_website_id' => 4,
        ],
        [
            'raw_title' => $productName,
            'price' => 469.000,
            'merchant_url' => 'https://tunisiatech.tn/tablettes-en-tunisie/5857-tablette-samsung-galaxy-tab-a11-wi-fi-4g-4go-64go-silver.html',
            'image_url' => 'https://www.tunisiatech.tn/16538-medium_default/tablette-samsung-galaxy-tab-a11-wi-fi-4g-4go-64go-silver.jpg',
            'is_available' => true,
            'scraped_at' => now(),
            'scraped_reference' => 'TT-5857',
        ]
    );
    
    return response()->json([
        'message' => 'TunisiaTech offer added',
        'product' => $product->name,
        'offer_price' => $offer->price,
        'merchant' => $merchantWebsite?->name,
    ]);
});

Route::get('/setup-aprilia-product', function () {
    $productName = 'Aprilia SR 125';
    $slug = 'aprilia-sr-125';
    $productImage = 'https://motorz.tn/wp-content/uploads/2026/02/Aprilia-SR-125-B4-Prix-Tunisie-1080x577.webp';
    
    $brand = \App\Models\Brand::firstOrCreate(['name' => 'Aprilia'], ['slug' => 'aprilia']);
    $category = \App\Models\Category::where('slug', 'motos-scooters')->first();
    
    // Create merchant websites if not exist
    $motorzMw = \App\Models\MerchantWebsite::firstOrCreate(
        ['name' => 'Motorz'],
        [
            'base_url' => 'https://motorz.tn',
            'logo_url' => 'https://motorz.tn/wp-content/uploads/2025/05/LOGO-RB.png',
            'is_active' => true,
        ]
    );
    
    $motottunisieMw = \App\Models\MerchantWebsite::firstOrCreate(
        ['name' => 'Motottunisie'],
        [
            'base_url' => 'https://www.mototunisie.tn',
            'logo_url' => 'https://www.mototunisie.tn/wp-content/uploads/2025/12/moto-tunisie-logo-white-3.png',
            'is_active' => true,
        ]
    );
    
    // Delete all offers and products with aprilia
    $oldOffers = \App\Models\Offer::whereHas('product', function ($q) {
        $q->where('name', 'like', '%Aprilia%')->orWhere('slug', 'like', '%aprilia%');
    })->delete();
    
    $oldProducts = \App\Models\Product::where('name', 'like', '%Aprilia%')->orWhere('slug', 'like', '%aprilia%')->delete();
    
    // Create product with image and description
    $product = \App\Models\Product::create([
        'name' => $productName,
        'slug' => $slug,
        'category_id' => $category?->id,
        'brand_id' => $brand->id,
        'image_url' => $productImage,
        'description' => 'Scooter APRILIA SR 125 - Refroidissement: A air - Cylindré: 125 cc - Moteur: Monocylindre 4 Temps - Capacité du Réservoir: 6.5Litres - Puissance maximum: 7.1 Kw à 7 250 tr/min - Vitesse max: 90 Km/h - Compteur Numérique - Freinage: avant: Disque hydraulique Ø 220 mm - arrière: Frein à tambour Ø 140 mm - Pneus: avant: 120/70 - arrière: 120/70 - Dimensions: 1985 x 1261 x 806 mm - Poids: 115 kg',
        'is_validated' => true,
    ]);
    
    // Motorz offer
    $motorzOffer = \App\Models\Offer::create([
        'product_id' => $product->id,
        'merchant_website_id' => $motorzMw->id,
        'raw_title' => $productName . ' - Motorz',
        'price' => 8900.000,
        'merchant_url' => 'https://motorz.tn/listings/scooter-aprilia-sr-125-prix-tunisie/',
        'image_url' => $productImage,
        'is_available' => true,
        'scraped_at' => now(),
        'scraped_reference' => 'MOTORZ-APRILIA-SR125',
    ]);
    
    // Create price history for Motorz (6 months, fluctuating)
    $motorzBasePrice = 8900;
    for ($i = 180; $i >= 0; $i--) {
        $variation = rand(-8, 8) / 100;
        $price = $motorzBasePrice * (1 + $variation);
        $price = round($price, 3);
        \App\Models\PriceHistory::create([
            'offer_id' => $motorzOffer->id,
            'price' => $price,
            'recorded_at' => now()->subDays($i),
        ]);
    }
    
    // Motottunisie offer
    $motottunisieOffer = \App\Models\Offer::create([
        'product_id' => $product->id,
        'merchant_website_id' => $motottunisieMw->id,
        'raw_title' => $productName . ' - Motottunisie',
        'price' => 8699.000,
        'merchant_url' => 'https://www.mototunisie.tn/annonces/aprilia-sr125-bleu/',
        'image_url' => $productImage,
        'is_available' => true,
        'scraped_at' => now(),
        'scraped_reference' => 'MOTOTUNISIE-APRILIA-SR125',
    ]);
    
    // Create price history for Motottunisie (6 months, fluctuating)
    $motottunisieBasePrice = 8699;
    for ($i = 180; $i >= 0; $i--) {
        $variation = rand(-8, 8) / 100;
        $price = $motottunisieBasePrice * (1 + $variation);
        $price = round($price, 3);
        \App\Models\PriceHistory::create([
            'offer_id' => $motottunisieOffer->id,
            'price' => $price,
            'recorded_at' => now()->subDays($i),
        ]);
    }
    
    return response()->json([
        'message' => 'Aprilia product created with both offers and price history',
        'product' => $product->name,
        'product_url' => '/produits/' . $product->slug,
        'offers_count' => 2,
    ]);
});

// Scraping seed endpoints
Route::post('/seed-scraping', function () {
    $scripts = [
        ['name' => 'Tunisianet', 'merchant_website_id' => 2, 'target_url' => 'https://www.tunisianet.com.tn', 'command' => 'scrape:all --tunisianet', 'schedule' => 'daily', 'active' => true],
        ['name' => 'TunisiaTech', 'merchant_website_id' => 4, 'target_url' => 'https://www.tunisiteck.com', 'command' => 'scrape:all --tunisiteck', 'schedule' => 'daily', 'active' => true],
        ['name' => 'Zoom', 'merchant_website_id' => 5, 'target_url' => 'https://zoom.com.tn', 'command' => 'scrape:all --zoom', 'schedule' => 'daily', 'active' => true],
        ['name' => 'Khadraoui', 'merchant_website_id' => 6, 'target_url' => 'https://khadraouitek.tn', 'command' => 'scrape:all --khadraoui', 'schedule' => 'daily', 'active' => true],
    ];
    foreach ($scripts as $script) {
        \App\Models\ScrapingScript::firstOrCreate(['name' => $script['name']], $script);
    }
    return response()->json(['message' => 'Scraping scripts seeded']);
});

Route::get('/seed-scraping', function () {
    $scripts = [
        ['name' => 'Tunisianet', 'merchant_website_id' => 2, 'target_url' => 'https://www.tunisianet.com.tn', 'command' => 'scrape:all --tunisianet', 'schedule' => 'daily', 'active' => true],
        ['name' => 'TunisiaTech', 'merchant_website_id' => 4, 'target_url' => 'https://www.tunisiteck.com', 'command' => 'scrape:all --tunisiteck', 'schedule' => 'daily', 'active' => true],
        ['name' => 'Zoom', 'merchant_website_id' => 5, 'target_url' => 'https://zoom.com.tn', 'command' => 'scrape:all --zoom', 'schedule' => 'daily', 'active' => true],
        ['name' => 'Khadraoui', 'merchant_website_id' => 6, 'target_url' => 'https://khadraouitek.tn', 'command' => 'scrape:all --khadraoui', 'schedule' => 'daily', 'active' => true],
    ];
    foreach ($scripts as $script) {
        \App\Models\ScrapingScript::firstOrCreate(['name' => $script['name']], $script);
    }
    return response()->json(['message' => 'Scraping scripts seeded']);
});

Route::get('seed-products', function () {
        $products = [
            ['name' => 'MacBook Air M3 13"', 'brand' => 'Apple', 'price' => 2999.000],
            ['name' => 'iPhone 15 Pro', 'brand' => 'Apple', 'price' => 2499.000],
            ['name' => 'Samsung Galaxy S24 Ultra', 'brand' => 'Samsung', 'price' => 2899.000],
            ['name' => 'PC Portable HP 15s', 'brand' => 'HP', 'price' => 899.000],
            ['name' => 'Dell Inspiron 15', 'brand' => 'Dell', 'price' => 1099.000],
            ['name' => 'Lenovo ThinkPad X1', 'brand' => 'Lenovo', 'price' => 1899.000],
            ['name' => 'ASUS VivoBook 15', 'brand' => 'Asus', 'price' => 749.000],
            ['name' => 'Samsung TV 55" 4K', 'brand' => 'Samsung', 'price' => 1199.000],
            ['name' => 'iPad Pro 11"', 'brand' => 'Apple', 'price' => 1899.000],
            ['name' => 'Apple Watch Series 9', 'brand' => 'Apple', 'price' => 699.000],
        ];
        
        $category = \App\Models\Category::where('slug', 'informatique')->first();
        $brandModel = \App\Models\Brand::where('name', 'Apple')->first();
        $merchant = \App\Models\MerchantWebsite::find(2);
        
        foreach ($products as $idx => $prod) {
            $brand = \App\Models\Brand::firstOrCreate(['name' => $prod['brand']], ['name' => $prod['brand'], 'slug' => strtolower($prod['brand'])]);
            
            $product = \App\Models\Product::firstOrCreate(
                ['name' => $prod['name']],
                [
                    'slug' => strtolower(str_replace(' ', '-', $prod['name'])) . '-' . ($idx + 1),
                    'category_id' => $category?->id,
                    'brand_id' => $brand->id,
                    'image_url' => 'https://placehold.co/400x400/f3f4f6/6b7280?text=' . urlencode($prod['name']),
                    'is_validated' => true,
                ]
            );
            
            \App\Models\Offer::firstOrCreate(
                ['product_id' => $product->id, 'merchant_website_id' => $merchant->id],
                [
                    'raw_title' => $prod['name'],
                    'price' => $prod['price'],
                    'merchant_url' => 'https://www.tunisianet.com.tn/produit/' . $product->slug,
                    'is_available' => true,
                    'image_url' => $product->image_url,
                    'scraped_at' => now(),
                ]
            );
        }
        
        return response()->json(['message' => 'Sample products seeded: ' . count($products)]);
    });

    // Scrape trigger endpoint
    Route::post('scrape-trigger', function (\Illuminate\Http\Request $request) {
        $script = \App\Models\ScrapingScript::find($request->script_id);
        if (!$script) {
            return response()->json(['error' => 'Script not found'], 404);
        }
        
        $script->update([
            'last_run' => now(),
            'active' => true,
        ]);
        
        return response()->json(['message' => 'Scraping started', 'script' => $script]);
    });

    // Scrape status update endpoint
    Route::post('scrape-status', function (\Illuminate\Http\Request $request) {
        $script = \App\Models\ScrapingScript::find($request->script_id);
        if (!$script) {
            return response()->json(['error' => 'Script not found'], 404);
        }
        
        $script->update([
            'active' => $request->status !== 'running',
            'last_run' => $request->status === 'running' ? now() : $script->last_run,
        ]);
        
        return response()->json(['message' => 'Status updated']);
    });
});

// ── Fournisseur public routes (outside auth:sanctum) ───────────────────
Route::prefix('fournisseur')->group(function () {
    Route::post('register',          [FournisseurAuthController::class, 'register']);
    Route::post('login',             [FournisseurAuthController::class, 'login']);
    Route::get('validate-email',     [FournisseurAuthController::class, 'validateEmail']);
    Route::get('validate-password', [FournisseurAuthController::class, 'validatePassword']);
});

// ── Fournisseur tracking (public, no auth) ────────────────────────────
Route::post('fournisseur/track-click',       [FournisseurController::class, 'trackClick']);
Route::post('fournisseur/record-view',       [FournisseurController::class, 'recordProductView']);

// ── Authenticated routes (sanctum token based) ────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('auth/logout',    [AuthController::class, 'logout']);
    Route::get('auth/me',         [AuthController::class, 'me']);
    Route::patch('auth/profile',  [AuthController::class, 'updateProfile']);

    // Client Dashboard - with real data
    Route::get('client/dashboard', function(\Illuminate\Http\Request $request) {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json([
                    'stats' => ['liked_count' => 0, 'visited_count' => 0, 'total_clicks' => 0, 'most_viewed_brand' => null, 'most_viewed_fournisseur' => null],
                    'recent_products' => [], 'suggestions' => [],
                ]);
            }
            
            $client = \App\Models\Client::where('user_id', $user->id)->first();
            if (!$client) {
                return response()->json([
                    'stats' => ['liked_count' => 0, 'visited_count' => 0, 'total_clicks' => 0, 'most_viewed_brand' => null, 'most_viewed_fournisseur' => null],
                    'recent_products' => [], 'suggestions' => [],
                ]);
            }
            
            // Get stats
            $likedCount = \App\Models\Favorite::where('client_id', $client->id)->count();
            $visitedCount = \App\Models\ClientProductView::where('client_id', $client->id)->count();
            
            // Get recent products (last 5 viewed)
            $recentProducts = \App\Models\ClientProductView::where('client_id', $client->id)
                ->with(['product' => function($q) {
                    $q->with(['category', 'brand', 'offers' => function($o) {
                        $o->where('is_available', true)->orderBy('price', 'asc')->limit(1);
                    }]);
                }])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function($view) {
                    $product = $view->product;
                    if (!$product) return null;
                    $bestOffer = $product->offers->first();
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'slug' => $product->slug,
                        'image' => $product->image_url,
                        'category' => $product->category?->name,
                        'brand' => $product->brand?->name,
                        'best_price' => $bestOffer?->price,
                        'viewed_at' => $view->created_at,
                    ];
                })
                ->filter();
            
            // Get AI suggestions based on viewed categories/brands
            $viewedProducts = \App\Models\ClientProductView::where('client_id', $client->id)
                ->with('product.category', 'product.brand')
                ->get()
                ->pluck('product')
                ->filter();
            
            $viewedCategories = $viewedProducts->pluck('category_id')->filter()->unique();
            $viewedBrands = $viewedProducts->pluck('brand_id')->filter()->unique();
            
            $suggestions = \App\Models\Product::query()
                ->where(function($q) use ($viewedCategories, $viewedBrands) {
                    $q->whereIn('category_id', $viewedCategories)
                        ->orWhereIn('brand_id', $viewedBrands);
                })
                ->whereHas('offers', fn($q) => $q->where('price', '>', 0)->where('is_available', true))
                ->with(['category', 'brand', 'offers' => fn($q) => $q->orderBy('price', 'asc')->limit(1)])
                ->whereNotIn('id', $viewedProducts->pluck('id')->filter())
                ->limit(6)
                ->get()
                ->map(function($product) {
                    $bestOffer = $product->offers->first();
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'slug' => $product->slug,
                        'image' => $product->image_url,
                        'category' => $product->category?->name,
                        'brand' => $product->brand?->name,
                        'best_price' => $bestOffer?->price,
                        'reason' => 'Basé sur vos produits visités',
                    ];
                });
            
            return response()->json([
                'stats' => [
                    'liked_count' => $likedCount,
                    'visited_count' => $visitedCount,
                    'total_clicks' => 0,
                    'most_viewed_brand' => null,
                    'most_viewed_fournisseur' => null,
                ],
                'recent_products' => $recentProducts->values(),
                'suggestions' => $suggestions,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'stats' => ['liked_count' => 0, 'visited_count' => 0, 'total_clicks' => 0, 'most_viewed_brand' => null, 'most_viewed_fournisseur' => null],
                'recent_products' => [], 'suggestions' => [],
            ]);
        }
    });
    
    // Track product view
    Route::post('client/track-view', function(\Illuminate\Http\Request $request) {
        try {
            $user = $request->user();
            if (!$user) return response()->json(['message' => 'ok']);
            
            $client = \App\Models\Client::where('user_id', $user->id)->first();
            if (!$client) {
                $client = \App\Models\Client::create(['user_id' => $user->id]);
            }
            
            $productId = $request->product_id;
            if ($productId) {
                $client->viewedProducts()->syncWithoutDetaching([$productId => ['created_at' => now()]]);
            }
            
            return response()->json(['message' => 'ok']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'ok']);
        }
    });

    // ── Admin routes ──────────────────────────────────────────────────────
    Route::prefix('admin')
        ->middleware(['auth:sanctum'])
        ->group(function () {
            Route::middleware([\App\Http\Middleware\RoleMiddleware::class.':admin'])->group(function () {
                Route::get('dashboard', [AdminController::class, 'dashboard']);
                Route::get('users', [AdminController::class, 'users']);
                Route::get('employees', [EmployeeController::class, 'index']);
                Route::post('employees', [EmployeeController::class, 'store']);
                Route::put('employees/{employee}', [EmployeeController::class, 'update']);
                Route::delete('employees/{employee}', [EmployeeController::class, 'destroy']);
                Route::post('employees/{employee}/regenerate-id', [EmployeeController::class, 'regenerateId']);
                Route::get('fournisseurs',          [AdminController::class, 'fournisseurs']);
                Route::put('fournisseurs/{fournisseur}/toggle', [AdminController::class, 'toggleFournisseur']);
                Route::get('subscriptions',        [AdminController::class, 'subscriptions']);
                Route::get('alerts',               [AdminController::class, 'alerts']);
                Route::delete('alerts/{priceAlert}', [AdminController::class, 'deleteAlert']);

                Route::post('categories',           [CategoryController::class, 'store']);
                Route::put('categories/{category}', [CategoryController::class, 'update']);
                Route::delete('categories/{category}', [CategoryController::class, 'destroy']);

                Route::post('brands',        [BrandController::class, 'store']);
                Route::put('brands/{brand}', [BrandController::class, 'update']);
                Route::delete('brands/{brand}', [BrandController::class, 'destroy']);

                Route::post('products',          [ProductController::class, 'store']);
                Route::put('products/{product}', [ProductController::class, 'update']);
                Route::delete('products/{product}', [ProductController::class, 'destroy']);

                Route::get('users',                 [AdminController::class, 'users']);
                Route::put('users/{user}/role',     [AdminController::class, 'updateRole']);

                Route::get('merchants',                        [AdminController::class, 'merchants']);
                Route::post('merchants/{merchant}/verify',     [AdminController::class, 'verifyMerchant']);
                Route::get('product-matches',                  [AdminController::class, 'productMatches']);
                Route::put('product-matches/{productMatch}',   [AdminController::class, 'reviewMatch']);
                Route::get('analytics/clicks',                 [AdminController::class, 'clickAnalytics']);

                // Manual product requests
                Route::get('manual-product-requests', [AdminController::class, 'getManualProductRequests']);
                Route::get('manual-products/{requestId}', [AdminController::class, 'getManualProducts']);
                Route::post('manual-products/{productId}/approve', [AdminController::class, 'approveManualProduct']);
                Route::post('manual-products/{productId}/reject', [AdminController::class, 'rejectManualProduct']);
                
                // Scraping scripts management
                Route::get('scraping',             [ScrapingController::class, 'index']);
                Route::post('scraping',            [ScrapingController::class, 'store']);
                Route::put('scraping/{scrapingScript}', [ScrapingController::class, 'update']);
                Route::delete('scraping/{scrapingScript}', [ScrapingController::class, 'destroy']);
                Route::post('scraping/{scrapingScript}/toggle', [ScrapingController::class, 'toggleStatus']);
                Route::put('scraping/{scrapingScript}/frequency', [ScrapingController::class, 'updateFrequency']);
                Route::post('scraping/{scrapingScript}/run', [ScrapingController::class, 'runScript']);
                Route::post('scraping/{scrapingScript}/stop', [ScrapingController::class, 'stopScript']);
                Route::post('scraping/run-all',    [ScrapingController::class, 'runAll']);
                Route::get('scraping/{scrapingScript}/logs', [ScrapingController::class, 'logs']);
                Route::get('scraping/logs',        [ScrapingController::class, 'allLogs']);
                Route::get('scraping/stats',       [ScrapingController::class, 'stats']);
                Route::get('scraping/available-fournisseurs', [ScrapingController::class, 'availableFournisseurs']);
            });
        });
    
    // ── Employee routes ─────────────────────────────────────────────────
    Route::prefix('employee')->group(function () {
        // Public test endpoint
        Route::get('test', function() {
            return response()->json(['status' => 'ok', 'message' => 'Employee routes working']);
        });
        
        // Protected routes - simplified without role middleware first
        Route::middleware(['auth:sanctum'])->group(function () {
            Route::get('dashboard', [AdminController::class, 'dashboard']);
            Route::get('products', [\App\Http\Controllers\Catalog\ProductController::class, 'index']);
            Route::get('products/{product}', [\App\Http\Controllers\Catalog\ProductController::class, 'show']);
            Route::put('products/{product}', [\App\Http\Controllers\Catalog\ProductController::class, 'update']);
            Route::get('categories', [\App\Http\Controllers\Catalog\CategoryController::class, 'index']);
            Route::get('brands', [\App\Http\Controllers\Catalog\BrandController::class, 'index']);
            Route::get('alerts', [AdminController::class, 'alerts']);
            Route::get('analytics/clicks', [AdminController::class, 'clickAnalytics']);
        });
    });

    // ── Client routes ─────────────────────────────────────────────────────
    Route::middleware('role:client')->prefix('client')->group(function () {
        Route::get('wishlists',                              [WishlistController::class, 'index']);
        Route::post('wishlists',                             [WishlistController::class, 'store']);
        Route::delete('wishlists/{wishlist}',                [WishlistController::class, 'destroy']);
        Route::post('wishlists/{wishlist}/items',            [WishlistController::class, 'addItem']);
        Route::delete('wishlists/{wishlist}/items/{item}',   [WishlistController::class, 'removeItem']);
    });

    // Price Alerts
    Route::get('client/alerts', function(\Illuminate\Http\Request $request) {
        try {
            $user = $request->user();
            if (!$user) return response()->json([]);
            
            $client = \App\Models\Client::where('user_id', $user->id)->first();
            if (!$client) return response()->json([]);
            
            $alerts = \App\Models\PriceAlert::where('client_id', $client->id)
                ->with(['product' => function($q) {
                    $q->with(['offers' => function($o) {
                        $o->where('is_available', true)->orderBy('price', 'asc')->limit(1);
                    }, 'category']);
                }])
                ->get()
                ->map(function($alert) {
                    $product = $alert->product;
                    if (!$product) return null;
                    
                    $bestOffer = $product->offers->first();
                    $currentPrice = $bestOffer?->price;
                    $reached = $currentPrice && $currentPrice <= $alert->target_price;
                    
                    return [
                        'id' => $alert->id,
                        'target_price' => $alert->target_price,
                        'current_price' => $currentPrice,
                        'reached' => $reached,
                        'product' => [
                            'id' => $product->id,
                            'name' => $product->name,
                            'slug' => $product->slug,
                            'image_url' => $product->image_url,
                            'category' => $product->category?->name,
                        ]
                    ];
                })
                ->filter()
                ->values();
            
            return response()->json($alerts);
        } catch (\Exception $e) {
            return response()->json([]);
        }
    });
    
    Route::post('client/alerts', function(\Illuminate\Http\Request $request) {
        try {
            $user = $request->user();
            if (!$user) return response()->json(['message' => 'Unauthorized'], 401);
            
            $client = \App\Models\Client::where('user_id', $user->id)->first();
            if (!$client) $client = \App\Models\Client::create(['user_id' => $user->id]);
            
            $alert = \App\Models\PriceAlert::create([
                'client_id' => $client->id,
                'product_id' => $request->product_id,
                'target_price' => $request->target_price,
                'is_active' => true,
            ]);
            
            return response()->json(['id' => $alert->id, 'message' => 'Alert created', 'status' => 'added']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    });

    // Favorites - accessible to any authenticated user (supports both session & token)
    Route::middleware('auth:web,sanctum')->group(function () {
        Route::get('favorites',                    [FavoriteController::class, 'index']);
        Route::post('favorites',                   [FavoriteController::class, 'store']);
        Route::post('favorites/toggle',           [FavoriteController::class, 'toggle']);
        Route::delete('favorites/{productId}',     [FavoriteController::class, 'destroy']);
    });

// ── Merchant routes ───────────────────────────────────────────────────
    Route::middleware('role:merchant')->prefix('merchant')->group(function () {
        Route::get('profile',                [MerchantController::class, 'profile']);
        Route::put('profile',                [MerchantController::class, 'updateProfile']);
        Route::get('offers',                 [MerchantController::class, 'offers']);
        Route::post('offers',                 [MerchantController::class, 'storeOffer']);
        Route::put('offers/{offer}',         [MerchantController::class, 'updateOffer']);
        Route::delete('offers/{offer}',      [MerchantController::class, 'deleteOffer']);
    });

    // ── Fournisseur (supplier portal) - Authenticated routes ──────────────────
    Route::middleware('auth:sanctum')->prefix('fournisseur')->group(function () {
        Route::post('logout',               [FournisseurAuthController::class, 'logout']);
        Route::get('dashboard',              [FournisseurController::class, 'dashboard']);
        Route::post('register-company',      [FournisseurController::class, 'register']);
        Route::get('products',               [FournisseurController::class, 'products']);
        Route::get('products/{id}/stats',    [FournisseurController::class, 'productStats']);
        Route::post('generate-api-key',      [FournisseurController::class, 'generateApiKey']);
        Route::get('affiliate-links',        [FournisseurController::class, 'getAffiliateLinks']);
        Route::patch('profile',              [FournisseurController::class, 'updateProfile']);
        Route::get('subscription/plans',      [FournisseurController::class, 'getSubscriptionPlans']);
        Route::get('subscription',            [FournisseurController::class, 'getSubscription']);
        Route::post('subscription',           [FournisseurController::class, 'subscribe']);
        Route::post('subscription/cancel',    [FournisseurController::class, 'cancelSubscription']);
        Route::post('manual-products/upload', [FournisseurController::class, 'uploadManualProducts']);
        Route::get('manual-products/requests', [FournisseurController::class, 'getManualProductRequests']);
    });

}); // End CORS middleware group
