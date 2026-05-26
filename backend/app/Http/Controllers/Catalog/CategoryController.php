<?php

namespace App\Http\Controllers\Catalog;
use App\Http\Controllers\Controller;

use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::with('children')  // children already ordered by name via model
            ->whereNull('parent_id')
            ->orderBy('code')                      // root categories keep their manual order
            ->get()
            ->map(function ($category) {
                // Count products in this category and all subcategories
                $categoryIds = $category->children->pluck('id')->prepend($category->id);
                $category->products_count = \App\Models\Product::whereIn('category_id', $categoryIds)
                    ->where('is_validated', true)
                    ->count();
                return $category;
            });

        return response()->json($categories);
    }

    public function show(Category $category): JsonResponse
    {
        return response()->json($category->load('children', 'parent'));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'unique:categories,slug'],
            'description' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'exists:categories,id'],
        ]);

        $category = Category::create($data);

        return response()->json($category, 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'unique:categories,slug,'.$category->id],
            'description' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'exists:categories,id'],
        ]);

        $category->update($data);

        return response()->json($category);
    }

    public function destroy(Category $category): JsonResponse
    {
        $category->delete();

        return response()->json(null, 204);
    }
}
