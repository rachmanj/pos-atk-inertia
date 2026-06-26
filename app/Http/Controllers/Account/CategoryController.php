<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $categories = Category::when($request->q, function ($query) use ($request) {
            $query->where('name', 'like', '%' . $request->q . '%');
        })
            ->latest()
            ->paginate(10);

        $categories->appends([
            'q' => $request->q,
        ]);

        return Inertia::render('Account/Categories/Index', [
            'categories' => $categories,
        ]);
    }

    public function create()
    {
        return Inertia::render('Account/Categories/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:categories',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $imageName = null;

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $image->storeAs('categories', $image->hashName(), 'public');
            $imageName = $image->hashName();
        }

        Category::create([
            'name' => $request->name,
            'image' => $imageName,
        ]);

        return redirect()->route('account.categories.index');
    }

    public function edit($id)
    {
        $category = Category::findOrFail($id);

        return Inertia::render('Account/Categories/Edit', [
            'category' => $category,
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $id,
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $category = Category::findOrFail($id);

        if (!$request->hasFile('image')) {
            $category->update([
                'name' => $request->name,
            ]);
        } else {
            if ($category->image) {
                Storage::disk('public')->delete('categories/' . basename($category->image));
            }

            $image = $request->file('image');
            $image->storeAs('categories', $image->hashName(), 'public');

            $category->update([
                'name' => $request->name,
                'image' => $image->hashName(),
            ]);
        }

        return redirect()->route('account.categories.index');
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);

        if ($category->image) {
            Storage::disk('public')->delete('categories/' . basename($category->image));
        }

        $category->delete();

        return redirect()->route('account.categories.index');
    }
}
