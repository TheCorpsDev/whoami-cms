<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin \App\Models\Profile
 */
class ProfileResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'name' => $this->name,
            'role' => $this->role,
            'rotating_words' => $this->rotating_words,
            'hero_bio' => $this->hero_bio,
            'about_headline' => $this->about_headline ?? ['it' => '', 'en' => ''],
            'about' => $this->about,
            'highlights' => $this->highlights,
            'languages' => $this->languages,
            'available' => $this->available,
            'location' => $this->location,
            'email' => $this->email,
            'github_url' => $this->github_url,
            'linkedin_url' => $this->linkedin_url,
            // Relative URLs: Nginx serves /storage straight from the volume.
            'photo_url' => $this->photo_path ? '/storage/'.$this->photo_path : null,
            'cv_url' => $this->cv_path ? '/storage/'.$this->cv_path : null,
            // Only the admin needs to know which English texts are still to review.
            'auto_translated' => $this->when($request->is('api/admin/*'), fn () => $this->auto_translated ?? []),
            'cv_size' => $this->cv_path && Storage::disk('public')->exists($this->cv_path) ? Storage::disk('public')->size($this->cv_path) : null,
        ];
    }
}
