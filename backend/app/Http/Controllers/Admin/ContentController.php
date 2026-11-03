<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\AutoTranslator;
use App\Support\Translations;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * CRUD and ordering shared by every sortable list edited from the admin.
 */
abstract class ContentController extends Controller
{
    /** @return class-string<Model> */
    abstract protected function model(): string;

    /** @return array<string, mixed> */
    abstract protected function rules(?Model $item): array;

    /** @return list<string> */
    protected function translatable(): array
    {
        return [];
    }

    public function index(): JsonResponse
    {
        return response()->json($this->model()::query()->ordered()->get());
    }

    public function store(Request $request): JsonResponse
    {
        [$data, $warning] = $this->payload($request, null);
        $item = $this->model()::query()->create($data);

        return response()->json([...$item->fresh()->toArray(), 'translation_warning' => $warning], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $item = $this->model()::query()->findOrFail($id);
        [$data, $warning] = $this->payload($request, $item);
        $item->update($data);

        return response()->json([...$item->fresh()->toArray(), 'translation_warning' => $warning]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->model()::query()->findOrFail($id)->delete();

        return response()->json(null, 204);
    }

    public function reorder(Request $request): JsonResponse
    {
        $ids = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ])['ids'];

        DB::transaction(function () use ($ids) {
            foreach (array_values($ids) as $index => $id) {
                $this->model()::query()->whereKey($id)->update(['position' => $index + 1]);
            }
        });

        return $this->index();
    }

    /**
     * Validated attributes with the English texts filled in by DeepL where
     * needed, plus a warning when the translation could not run.
     *
     * @return array{0: array<string, mixed>, 1: string|null}
     */
    protected function payload(Request $request, ?Model $item): array
    {
        $data = $request->validate([
            ...$this->rules($item),
            'approved' => ['sometimes', 'array'],
            'approved.*' => ['string', 'max:80'],
        ]);
        $approved = $data['approved'] ?? [];
        unset($data['approved']);

        foreach ($this->translatable() as $field) {
            if (array_key_exists($field, $data)) {
                $data[$field] = Translations::clean($data[$field]);
            }
        }

        [$data, $auto, $warning] = app(AutoTranslator::class)->apply(
            $data,
            $item?->attributesToArray() ?? [],
            $item?->auto_translated ?? [],
            $this->translatable(),
            $approved,
        );
        $data['auto_translated'] = $auto;

        return [$data, $warning];
    }

    /** @return array<string, array<int, string>> */
    protected static function tags(string $field): array
    {
        return [
            $field => ['present', 'array', 'max:30'],
            "$field.*" => ['string', 'max:60'],
        ];
    }

    /** @return array<int, string> */
    protected static function month(bool $required = false): array
    {
        return [$required ? 'required' : 'nullable', 'string', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'];
    }
}
