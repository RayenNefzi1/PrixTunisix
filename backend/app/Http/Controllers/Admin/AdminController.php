<?php

namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;

use App\Models\Merchant;
use App\Models\ProductMatch;
use App\Models\Product;
use App\Models\Offer;
use App\Models\PriceAlert;
use App\Models\Fournisseur;
use App\Models\FournisseurSubscription;
use App\Models\RedirectClick;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $productsCount = Product::where('is_validated', true)->count();
        $categoriesCount = \App\Models\Category::whereNull('parent_id')->count();
        $brandsCount = \App\Models\Brand::count();
        
        // Products by category for pie chart
        $rootCategories = \App\Models\Category::whereNull('parent_id')
            ->with(['products' => function($q) {
                $q->where('is_validated', true);
            }])
            ->get()
            ->map(function($cat) use ($productsCount) {
                return [
                    'name' => $cat->name,
                    'count' => $cat->products->count(),
                    'percentage' => $productsCount > 0 ? round(($cat->products->count() / $productsCount) * 100, 1) : 0
                ];
            })
            ->filter(fn($c) => $c['count'] > 0)
            ->take(6);

        // Recent products
        $recentProducts = Product::where('is_validated', true)
            ->with(['category', 'brand'])
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(function($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'category' => $p->category?->name,
                    'brand' => $p->brand?->name,
                    'created_at' => $p->created_at,
                ];
            });

        // Top brands
        $topBrands = \App\Models\Brand::withCount('products')
            ->orderByDesc('products_count')
            ->limit(5)
            ->get()
            ->map(function($b) {
                return [
                    'name' => $b->name,
                    'count' => $b->products_count,
                ];
            });

        $stats = [
            'total_products' => $productsCount,
            'total_categories' => $categoriesCount,
            'total_brands' => $brandsCount,
            'active_alerts' => PriceAlert::whereNull('triggered_at')->count(),
            'total_offers' => Offer::count(),
            'products_by_category' => $rootCategories,
            'recent_products' => $recentProducts,
            'top_brands' => $topBrands,
            'total_users' => User::count(),
        ];

        return response()->json($stats);
    }

    public function fournisseurs(Request $request): JsonResponse
    {
        $fournisseurs = Fournisseur::with(['merchantWebsite', 'subscription'])
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json($fournisseurs);
    }

    public function toggleFournisseur(Request $request, Fournisseur $fournisseur): JsonResponse
    {
        $fournisseur->update(['active' => !$fournisseur->active]);
        return response()->json($fournisseur);
    }
    /** GET /admin/users — list all users */
    public function users(Request $request): JsonResponse
    {
        $users = User::query()
            ->when($request->role, fn ($q, $role) => $q->where('role', $role))
            ->paginate(30);

        return response()->json($users);
    }

    /** PUT /admin/users/{user}/role — change a user's role */
    public function updateRole(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'role' => ['required', 'in:client,merchant,employee,admin'],
        ]);

        $user->update(['role' => $data['role']]);

        return response()->json($user->fresh());
    }

    /** GET /admin/merchants — list merchants with verification status */
    public function merchants(): JsonResponse
    {
        $merchants = Merchant::with('user')
            ->orderBy('is_verified')
            ->paginate(20);

        return response()->json($merchants);
    }

    /** POST /admin/merchants/{merchant}/verify */
    public function verifyMerchant(Merchant $merchant): JsonResponse
    {
        $merchant->update([
            'is_verified' => true,
            'verified_at' => now(),
        ]);

        return response()->json($merchant->fresh());
    }

    /** GET /admin/product-matches — pending match review queue */
    public function productMatches(Request $request): JsonResponse
    {
        $matches = ProductMatch::with('offer', 'product')
            ->where('status', $request->status ?? 'pending')
            ->orderByDesc('confidence_score')
            ->paginate(20);

        return response()->json($matches);
    }

    /** PUT /admin/product-matches/{match} — approve or reject a match */
    public function reviewMatch(Request $request, ProductMatch $productMatch): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
        ]);

        $employee = $request->user()->employee;

        $productMatch->update([
            'status' => $data['status'],
            'reviewed_by' => $employee?->id,
            'reviewed_at' => now(),
        ]);

        // If approved, link the offer to the product
        if ($data['status'] === 'approved') {
            $productMatch->offer->update(['product_id' => $productMatch->product_id]);
        }

        return response()->json($productMatch->fresh());
    }

    /** GET /admin/analytics/clicks — redirect click analytics (Phase 4) */
    public function clickAnalytics(Request $request): JsonResponse
    {
        // Total clicks
        $totalClicks = \App\Models\RedirectClick::count();
        $clicksThisMonth = \App\Models\RedirectClick::whereMonth('clicked_at', now()->month)->count();
        $clicksToday = \App\Models\RedirectClick::whereDate('clicked_at', today())->count();
        
        // Clicks by day (last 30 days)
        $clicksByDay = \App\Models\RedirectClick::select(
            DB::raw('DATE(clicked_at) as date'),
            DB::raw('COUNT(*) as clicks')
        )
            ->where('clicked_at', '>=', now()->subDays(30))
            ->groupBy(DB::raw('DATE(clicked_at)'))
            ->orderBy('date')
            ->get();
        
        // Top offers (by merchant)
        $topOffers = \App\Models\RedirectClick::select(
            'offer_id',
            DB::raw('COUNT(*) as clicks')
        )
            ->with('offer:id,raw_title,merchant_website_id,price')
            ->groupBy('offer_id')
            ->orderByDesc('clicks')
            ->limit(5)
            ->get()
            ->map(fn($c) => [
                'name' => $c->offer?->raw_title ?? 'Unknown Offer',
                'clicks' => $c->clicks
            ]);

        return response()->json([
            'total_clicks' => $totalClicks,
            'clicks_this_month' => $clicksThisMonth,
            'clicks_today' => $clicksToday,
            'clicks_by_day' => $clicksByDay,
            'top_products' => $topOffers,
            'top_merchants' => $topOffers,
        ]);
    }

    public function subscriptions(Request $request): JsonResponse
    {
        $subscriptions = \App\Models\FournisseurSubscription::with('fournisseur')
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json($subscriptions);
    }

    public function alerts(Request $request): JsonResponse
    {
        $query = \App\Models\PriceAlert::with(['product', 'client.user', 'client']);
        
        if ($request->status === 'active') {
            $query->whereNull('triggered_at');
        } elseif ($request->status === 'triggered') {
            $query->whereNotNull('triggered_at');
        }
        
        $alerts = $query->orderByDesc('id')->paginate(20);
        
        return response()->json($alerts);
    }

    public function deleteAlert(\App\Models\PriceAlert $priceAlert): JsonResponse
    {
        $priceAlert->delete();
        return response()->json(null, 204);
    }

    public function getManualProductRequests(): JsonResponse
    {
        $requests = \App\Models\ManualProductRequest::with('fournisseur', 'products')
            ->orderByDesc('created_at')
            ->get();
        return response()->json(['requests' => $requests]);
    }

    public function getManualProducts($requestId): JsonResponse
    {
        $products = \App\Models\ManualProduct::where('request_id', $requestId)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['products' => $products]);
    }

    public function approveManualProduct(\App\Models\ManualProduct $manualProduct): JsonResponse
    {
        $manualProduct->update([
            'status' => 'approved',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        $subscription = $manualProduct->fournisseur->subscription;
        if ($subscription && $subscription->plan === 'premium_manual') {
            Product::create([
                'name' => $manualProduct->name,
                'description' => $manualProduct->description,
                'price' => $manualProduct->price,
                'image_url' => $manualProduct->image_url,
                'reference' => $manualProduct->reference,
                'category_id' => $manualProduct->category_id,
                'brand_id' => $manualProduct->brand_id,
                'is_validated' => true,
                'fournisseur_id' => $manualProduct->fournisseur_id,
            ]);
        }

        return response()->json(['message' => 'Produit approuvé']);
    }

    public function rejectManualProduct(Request $request, \App\Models\ManualProduct $manualProduct): JsonResponse
    {
        $manualProduct->update([
            'status' => 'rejected',
            'rejection_reason' => $request->reason,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return response()->json(['message' => 'Produit rejeté']);
    }
}
