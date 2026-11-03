<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProfileResource;
use App\Models\Profile;
use App\Support\AutoTranslator;
use App\Support\LanguageLevel;
use App\Support\Translations;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    private const TRANSLATABLE = ['role', 'rotating_words', 'hero_bio', 'about_headline', 'about', 'highlights.*.title', 'highlights.*.body', 'languages.*.name', 'location'];

    public function show(): JsonResponse
    {
        return response()->json(new ProfileResource(Profile::current()));
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            ...Translations::rules('role', true, 120),
            'rotating_words' => ['present', 'array'],
            'rotating_words.it' => ['present', 'array', 'max:8'],
            'rotating_words.it.*' => ['nullable', 'string', 'max:60'],
            'rotating_words.en' => ['present', 'array', 'max:8'],
            'rotating_words.en.*' => ['nullable', 'string', 'max:60'],
            ...Translations::rules('hero_bio', true, 600),
            ...Translations::rules('about_headline', false, 200),
            ...Translations::rules('about', true, 3000),
            'highlights' => ['present', 'array', 'max:6'],
            'highlights.*.title.it' => ['required', 'string', 'max:80'],
            'highlights.*.title.en' => ['nullable', 'string', 'max:80'],
            'highlights.*.body.it' => ['required', 'string', 'max:300'],
            'highlights.*.body.en' => ['nullable', 'string', 'max:300'],
            'languages' => ['present', 'array', 'max:8'],
            'languages.*.name.it' => ['required', 'string', 'max:40'],
            'languages.*.name.en' => ['nullable', 'string', 'max:40'],
            'languages.*.level' => ['required', Rule::in(LanguageLevel::CODES)],
            'available' => ['required', 'boolean'],
            ...Translations::rules('location', false, 120),
            'email' => ['nullable', 'email', 'max:255'],
            'github_url' => ['nullable', 'url:https,http', 'max:255'],
            'linkedin_url' => ['nullable', 'url:https,http', 'max:255'],
            'cv_details' => ['nullable', 'array'],
            'cv_details.birth_date' => ['nullable', 'date_format:Y-m-d'],
            'cv_details.nationality' => ['nullable', 'string', 'max:60'],
            'cv_details.gender' => ['nullable', 'string', 'max:30'],
            'cv_details.address' => ['nullable', 'string', 'max:200'],
            'cv_details.phone' => ['nullable', 'string', 'max:40'],
            'cv_details.driving_license' => ['nullable', 'string', 'max:60'],
            'cv_details.privacy_notice' => ['nullable', 'string', 'max:700'],
            'approved' => ['sometimes', 'array'],
            'approved.*' => ['string', 'max:80'],
        ]);
        $approved = $data['approved'] ?? [];
        unset($data['approved']);

        $words = fn (string $locale) => array_values(array_filter(array_map(
            fn ($word) => trim((string) $word),
            $data['rotating_words'][$locale],
        )));

        $profile = Profile::current();
        $clean = [
            ...$data,
            'role' => Translations::clean($data['role']),
            'rotating_words' => ['it' => $words('it'), 'en' => $words('en')],
            'hero_bio' => Translations::clean($data['hero_bio']),
            'about_headline' => Translations::clean($data['about_headline'] ?? []),
            'about' => Translations::clean($data['about']),
            'highlights' => array_map(fn (array $h) => [
                'title' => Translations::clean($h['title']),
                'body' => Translations::clean($h['body']),
            ], $data['highlights']),
            'location' => ($location = Translations::clean($data['location'] ?? [])) === ['it' => '', 'en' => ''] ? null : $location,
            'cv_details' => $this->cleanCvDetails($data['cv_details'] ?? null),
            'languages' => array_map(fn (array $l) => [
                'name' => Translations::clean($l['name']),
                'level' => $l['level'],
            ], $data['languages']),
        ];

        [$clean, $auto, $warning] = app(AutoTranslator::class)->apply(
            $clean,
            $profile->attributesToArray(),
            $profile->auto_translated ?? [],
            self::TRANSLATABLE,
            $approved,
        );
        $profile->update([...$clean, 'auto_translated' => $auto]);

        return response()->json([...(new ProfileResource($profile))->resolve($request), 'translation_warning' => $warning]);
    }

    /**
     * Keeps only the known keys and drops empty values, so an empty form stores null.
     *
     * @param  array<string, mixed>|null  $details
     * @return array<string, string>|null
     */
    private function cleanCvDetails(?array $details): ?array
    {
        $keys = ['birth_date', 'nationality', 'gender', 'address', 'phone', 'driving_license', 'privacy_notice'];
        $clean = [];

        foreach ($keys as $key) {
            $value = trim((string) ($details[$key] ?? ''));

            if ($value !== '') {
                $clean[$key] = $value;
            }
        }

        return $clean === [] ? null : $clean;
    }

    public function uploadPhoto(Request $request): JsonResponse
    {
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120', 'dimensions:min_width=200,min_height=200'],
        ]);

        return $this->replaceFile('photo_path', $request->file('photo')->store('profile', 'public'));
    }

    public function uploadCv(Request $request): JsonResponse
    {
        $request->validate(['cv' => ['required', 'file', 'mimes:pdf', 'max:10240']]);

        return $this->replaceFile('cv_path', $request->file('cv')->store('cv', 'public'));
    }

    public function deletePhoto(): JsonResponse
    {
        return $this->replaceFile('photo_path', null);
    }

    public function deleteCv(): JsonResponse
    {
        return $this->replaceFile('cv_path', null);
    }

    private function replaceFile(string $column, ?string $path): JsonResponse
    {
        $profile = Profile::current();

        if ($profile->{$column}) {
            Storage::disk('public')->delete($profile->{$column});
        }

        $profile->update([$column => $path]);

        return response()->json(new ProfileResource($profile));
    }
}
