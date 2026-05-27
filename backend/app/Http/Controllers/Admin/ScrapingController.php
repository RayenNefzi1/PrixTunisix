<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ScrapingScript;
use App\Models\ScrapingLog;
use App\Models\MerchantWebsite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessTimedOutException;

class ScrapingController extends Controller
{
    private $logPath;

    public function __construct()
    {
        $scraperPath = base_path('../scraper');
        $this->logPath = file_exists($scraperPath) 
            ? $scraperPath . '/scrapy_log.txt' 
            : storage_path('logs/scrapy_log.txt');
    }

    public function index(): JsonResponse
    {
        try {
            $scripts = ScrapingScript::with('merchantWebsite')
                ->orderByDesc('id')
                ->get();

            $websites = MerchantWebsite::where('is_active', true)->get();

            return response()->json([
                'scripts' => $scripts,
                'websites' => $websites,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('ScrapingController@index error: ' . $e->getMessage() . ' trace: ' . $e->getTraceAsString());
            return response()->json([
                'error' => $e->getMessage(),
                'file' => basename($e->getFile()),
                'line' => $e->getLine()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'merchant_website_id' => 'required|exists:merchant_websites,id',
            'name' => 'required|string|max:255',
            'target_url' => 'required|url',
            'frequency' => 'required|in:hourly,daily,weekly,manual',
            'frequency_minutes' => 'nullable|integer|min:15',
        ]);

        $script = ScrapingScript::create($validated);

        return response()->json($script, 201);
    }

    public function update(Request $request, ScrapingScript $scrapingScript): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'target_url' => 'sometimes|url',
            'frequency' => 'sometimes|in:hourly,daily,weekly,manual',
            'frequency_minutes' => 'nullable|integer|min:15',
        ]);

        $scrapingScript->update($validated);

        return response()->json($scrapingScript);
    }

    public function destroy(ScrapingScript $scrapingScript): JsonResponse
    {
        $scrapingScript->delete();

        return response()->json(null, 204);
    }

    public function toggleStatus(ScrapingScript $scrapingScript): JsonResponse
    {
        $newStatus = $scrapingScript->status === 'active' ? 'inactive' : 'active';
        $scrapingScript->update(['status' => $newStatus]);

        return response()->json($scrapingScript);
    }

    public function runScript(ScrapingScript $scrapingScript): JsonResponse
    {
        $merchantWebsite = $scrapingScript->merchantWebsite;
        
        if (!$merchantWebsite) {
            return response()->json(['error' => 'Merchant website not found'], 404);
        }

        $log = ScrapingLog::create([
            'scraping_script_id' => $scrapingScript->id,
            'started_at' => now(),
            'records_collected' => 0,
            'errors_count' => 0,
            'result' => 'running',
        ]);

        try {
            $spider = $this->getSpiderName($merchantWebsite->name);
            
            if (!$spider) {
                throw new \Exception("No spider found for merchant: {$merchantWebsite->name}");
            }

            $result = $this->runSpiderSync($spider);

            $log->update([
                'ended_at' => now(),
                'records_collected' => $result['records'],
                'errors_count' => $result['errors'],
                'error_details' => $result['error_details'],
                'result' => $result['success'] ? 'success' : 'failed',
            ]);

            $scrapingScript->update(['last_run' => now()]);

            // Check for products with no offers or out of stock
            $noOffers = \App\Models\Product::whereDoesntHave('offers', function($q) {
                $q->where('is_available', true);
            })->count();
            
            $outOfStock = \App\Models\Offer::where('is_available', false)->count();

            $notification = null;
            if ($noOffers > 0 || $outOfStock > 0) {
                $notification = [
                    'no_offers' => $noOffers,
                    'out_of_stock' => $outOfStock,
                ];
            }

            return response()->json([
                'message' => "Scraping completed! Collected {$result['records']} records.",
                'log_id' => $log->id,
                'records' => $result['records'],
                'errors' => $result['errors'],
                'script' => $scrapingScript->name,
                'notification' => $notification,
            ]);

        } catch (\Exception $e) {
            $log->update([
                'ended_at' => now(),
                'errors_count' => 1,
                'error_details' => json_encode([$e->getMessage()]),
                'result' => 'failed',
            ]);

            return response()->json([
                'error' => $e->getMessage(),
                'message' => 'Scraping failed. Check logs for details.',
            ], 500);
        }
    }

    public function stopScript(ScrapingScript $scrapingScript): JsonResponse
    {
        $scrapingScript->update(['active' => false]);
        
        return response()->json([
            'message' => 'Scraping stopped',
            'script' => $scrapingScript->name,
        ]);
    }

    public function runAll(Request $request): JsonResponse
    {
        $merchantIds = $request->input('merchant_ids', []);
        
        $results = [];
        $scripts = ScrapingScript::where('status', 'active');
        
        if (!empty($merchantIds)) {
            $scripts = $scripts->whereIn('merchant_website_id', $merchantIds);
        }
        
        $scripts = $scripts->get();

        foreach ($scripts as $script) {
            $merchant = $script->merchantWebsite;
            
            $log = ScrapingLog::create([
                'scraping_script_id' => $script->id,
                'started_at' => now(),
                'records_collected' => 0,
                'errors_count' => 0,
                'result' => 'running',
            ]);

            try {
                $spider = $this->getSpiderName($merchant->name);
                
                if (!$spider) {
                    throw new \Exception("No spider found for merchant: {$merchant->name}");
                }

                $result = $this->runSpiderSync($spider);

                $log->update([
                    'ended_at' => now(),
                    'records_collected' => $result['records'],
                    'errors_count' => $result['errors'],
                    'error_details' => $result['error_details'],
                    'result' => $result['success'] ? 'success' : 'failed',
                ]);

                $script->update(['last_run' => now()]);

                $results[] = [
                    'script_id' => $script->id,
                    'merchant' => $merchant->name,
                    'records' => $result['records'],
                    'errors' => $result['errors'],
                    'status' => $result['success'] ? 'success' : 'failed',
                ];

            } catch (\Exception $e) {
                $log->update([
                    'ended_at' => now(),
                    'errors_count' => 1,
                    'error_details' => json_encode([$e->getMessage()]),
                    'result' => 'failed',
                ]);

                $results[] = [
                    'script_id' => $script->id,
                    'merchant' => $merchant->name ?? 'Unknown',
                    'records' => 0,
                    'errors' => 1,
                    'status' => 'failed',
                    'error' => $e->getMessage(),
                ];
            }
        }

        $totalRecords = collect($results)->sum('records');
        $totalErrors = collect($results)->sum('errors');
        $successful = collect($results)->where('status', 'success')->count();

        return response()->json([
            'message' => "Scraping complete: $successful/{$scripts->count()} successful",
            'total_records' => $totalRecords,
            'total_errors' => $totalErrors,
            'results' => $results,
        ]);
    }

    public function logs(ScrapingScript $scrapingScript): JsonResponse
    {
        try {
            $logs = ScrapingLog::where('scraping_script_id', $scrapingScript->id)
                ->orderByDesc('started_at')
                ->limit(50)
                ->get();

            return response()->json($logs);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('ScrapingController@logs error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage(), 'file' => basename($e->getFile()), 'line' => $e->getLine()], 500);
        }
    }

    public function allLogs(Request $request): JsonResponse
    {
        try {
            $query = ScrapingLog::query()
                ->orderByDesc('started_at');


            if ($request->script_id) {
                $query->where('scraping_script_id', $request->script_id);
            }

            $logs = $query->limit(100)->get();

            return response()->json($logs);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('ScrapingController@allLogs error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function stats(): JsonResponse
    {
        try {
            $totalScripts = ScrapingScript::count();
            $activeScripts = ScrapingScript::where('active', true)->count();
            
            $last24h = ScrapingLog::where('started_at', '>=', now()->subDay())->get();
            $totalRecords = $last24h->sum('records_collected');
            $totalErrors = $last24h->sum('errors_count');
            $successfulRuns = $last24h->where('result', 'success')->count();
            $failedRuns = $last24h->where('result', 'failed')->count();

            return response()->json([
                'total_scripts' => $totalScripts,
                'active_scripts' => $activeScripts,
                'last_24h' => [
                    'total_records' => $totalRecords,
                    'total_errors' => $totalErrors,
                    'successful_runs' => $successfulRuns,
                    'failed_runs' => $failedRuns,
                ],
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('ScrapingController@stats error: ' . $e->getMessage() . ' trace: ' . $e->getTraceAsString());
            return response()->json([
                'error' => $e->getMessage(),
                'file' => basename($e->getFile()),
                'line' => $e->getLine()
            ], 500);
        }
    }

    private function getSpiderName(string $merchantName): ?string
    {
        $name = strtolower(str_replace([' ', '-', '_'], '', $merchantName));
        
        $spiders = [
            'mytek' => 'mytek',
            'tunisianet' => 'tunisianet',
            'sfaxcomputer' => 'sfax',
            'tunisiatech' => 'tunisiatech',
            'tunsiatech' => 'tunisiatech',
            'tunisiteck' => 'tunisiatech',
            'zoominformatique' => 'zoom',
            'zoom' => 'zoom',
            'khadraouitek' => 'khadraoui',
            'khadraoui' => 'khadraoui',
        ];

        return $spiders[$name] ?? null;
    }

    private function runSpiderSync(string $spider): array
    {
        // Try multiple possible scraper paths
        $possiblePaths = [
            dirname(base_path()) . '/scraper',
            base_path() . '/../scraper',
            base_path() . '/scraper',
            '/app/scraper',
        ];
        
        $scraperPath = null;
        foreach ($possiblePaths as $path) {
            if (is_dir($path)) {
                $scraperPath = $path;
                break;
            }
        }
        
        if (!$scraperPath) {
            $pathsChecked = implode(', ', $possiblePaths);
            Log::error("Scraper directory not found. Checked: $pathsChecked");
            return [
                'success' => false,
                'records' => 0,
                'errors' => 1,
                'error_details' => json_encode(["Scraper not deployed. Checked paths: $pathsChecked"]),
            ];
        }
        
        $logFile = $scraperPath . '/scrapy_log.txt';
        
        Log::info("Starting scraper: $spider at path: $scraperPath");
        
        // Clear previous log
        if (file_exists($logFile)) {
            unlink($logFile);
        }
        
        // Check if python and scrapy are available
        $pythonCheck = shell_exec("which python3 || which python");
        Log::info("Python path: " . ($pythonCheck ?? 'not found'));
        
        if (!$pythonCheck) {
            Log::error("Python not found on server");
            return [
                'success' => false,
                'records' => 0,
                'errors' => 1,
                'error_details' => json_encode(["Python not installed on server"]),
            ];
        }
        
        // Run spider 
        $command = "cd \"$scraperPath\" && python3 -m scrapy crawl $spider --loglevel=INFO 2>&1";
        
        Log::info("Running command: $command");
        
        $output = shell_exec($command);
        
        // Write output to log file for debugging
        file_put_contents($logFile, $output ?? 'No output');
        
        Log::info("Command output length: " . strlen($output ?? ''));
        
        $records = 0;
        $errors = 0;
        $newProducts = 0;
        
        if ($output) {
            // Count scraped items
            $scrapedMatches = [];
            if (preg_match_all('/DEBUG: OK product#(\d+)/', $output, $scrapedMatches)) {
                $records = count($scrapedMatches[0]);
            }

            // Count new products
            $newMatches = [];
            if (preg_match_all('/NEW \[([^\]]+)\]/', $output, $newMatches)) {
                $newProducts = count($newMatches[0]);
            }

            // Count errors
            $errorMatches = [];
            if (preg_match_all('/ERROR/', $output, $errorMatches)) {
                $errors = count($errorMatches[0]);
            }
            
            // Also check for scrapy errors
            if (preg_match('/Traceback/', $output)) {
                $errors = 1;
                Log::error("Scraper error: " . substr($output, 0, 500));
            }

            Log::info("Scraper finished: $spider, records: $records, new: $newProducts, errors: $errors");
        }

        return [
            'success' => $records > 0 || $newProducts > 0,
            'records' => $newProducts > 0 ? $newProducts : $records,
            'errors' => $errors,
            'error_details' => $errors > 0 ? json_encode(["Spider completed with errors"]) : ($records === 0 ? json_encode([$output]) : null),
        ];
    }
}