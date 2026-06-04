<?php

namespace App\Http\Controllers\Catalog;
use App\Http\Controllers\Controller;

use App\Models\Offer;
use App\Models\RedirectClick;
use App\Models\MerchantClick;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OfferController extends Controller
{
    /** GET /offers/{offer}/price-history — Phase 3 of sequence diagram */
    public function priceHistory(Offer $offer): JsonResponse
    {
        $history = $offer->priceHistory()
            ->select('price', 'recorded_at')
            ->orderBy('recorded_at')
            ->get();

        return response()->json($history);
    }

    /**
     * GET /offers/{offer}/redirect — Phase 4 of sequence diagram
     * Logs click, returns merchant URL for frontend redirect.
     */
    public function redirect(Request $request, Offer $offer): JsonResponse
    {
        RedirectClick::create([
            'offer_id' => $offer->id,
            'user_id' => optional($request->user())->id,
            'ip_address' => $request->ip(),
            'clicked_at' => now(),
        ]);

        // Get fournisseur directly from merchant_website_id
        $fournisseur = \App\Models\Fournisseur::where('merchant_website_id', $offer->merchant_website_id)->first();
        
        if ($fournisseur) {
            MerchantClick::create([
                'fournisseur_id' => $fournisseur->id,
                'product_id' => $offer->product_id,
                'referrer' => $request->headers->get('referer', 'direct'),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'clicked_at' => now(),
            ]);
        }

        return response()->json([
            'url' => $offer->merchant_url,
        ]);
    }
    
    /**
     * GET /offers/{offer}/go — Direct redirect with click tracking
     * This endpoint redirects to the merchant URL while tracking the click
     */
    public function go(Request $request, Offer $offer)
    {
        RedirectClick::create([
            'offer_id' => $offer->id,
            'user_id' => optional($request->user())->id,
            'ip_address' => $request->ip(),
            'clicked_at' => now(),
        ]);
        
        $fournisseur = \App\Models\Fournisseur::where('merchant_website_id', $offer->merchant_website_id)->first();
        
        if ($fournisseur) {
            MerchantClick::create([
                'fournisseur_id' => $fournisseur->id,
                'product_id' => $offer->product_id,
                'referrer' => $request->headers->get('referer', 'direct'),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'clicked_at' => now(),
            ]);
        }
        
        return redirect($offer->merchant_url);
    }

    /**
     * GET /offers/{offer}/merchant-phone — Get merchant phone for manual products
     */
    public function merchantPhone(Offer $offer): JsonResponse
    {
        // Check if it's a manual product (has fournisseur but no merchant_website)
        $fournisseur = $offer->fournisseur;
        
        if (!$fournisseur || $offer->merchant_website_id) {
            // Not a manual product - redirect normally
            return response()->json([
                'url' => $offer->merchant_url,
            ]);
        }

        // Log click for manual product
        RedirectClick::create([
            'offer_id' => $offer->id,
            'user_id' => null,
            'ip_address' => request()->ip(),
            'clicked_at' => now(),
        ]);

        return response()->json([
            'phone' => $fournisseur->company_phone,
            'name' => $fournisseur->company_name,
        ]);
    }
}
