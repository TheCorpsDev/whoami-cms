<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProfileResource;
use App\Models\Certification;
use App\Models\Education;
use App\Models\Experience;
use App\Models\Profile;
use App\Models\Project;
use App\Models\SkillGroup;
use Illuminate\Http\JsonResponse;

class PortfolioController extends Controller
{
    /**
     * Everything the public site renders, in both languages, in one request.
     */
    public function show(): JsonResponse
    {
        $hidden = ['visible', 'position', 'auto_translated', 'created_at', 'updated_at'];
        $list = fn (string $model) => $model::query()->visible()->ordered()->get()->makeHidden($hidden)->values();

        return response()->json([
            'profile' => new ProfileResource(Profile::current()),
            'skill_groups' => $list(SkillGroup::class),
            'experiences' => $list(Experience::class),
            'projects' => $list(Project::class),
            'education' => $list(Education::class),
            'certifications' => $list(Certification::class),
        ])->header('Cache-Control', 'no-cache');
    }
}
