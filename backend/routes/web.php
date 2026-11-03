<?php

use App\Http\Controllers\Admin;
use App\Http\Middleware\EnsureAdmin;
use Illuminate\Support\Facades\Route;

/*
 * Admin API. It lives in the web group for the session cookie and CSRF
 * protection; the React SPA sends the XSRF-TOKEN cookie back as a header.
 */
Route::prefix('api/admin')->group(function () {
    Route::get('/me', [Admin\AuthController::class, 'me']);
    Route::post('/login', [Admin\AuthController::class, 'login']);
    Route::post('/logout', [Admin\AuthController::class, 'logout']);

    Route::middleware(EnsureAdmin::class)->group(function () {
        Route::get('/profile', [Admin\ProfileController::class, 'show']);
        Route::put('/profile', [Admin\ProfileController::class, 'update']);
        Route::post('/profile/photo', [Admin\ProfileController::class, 'uploadPhoto']);
        Route::delete('/profile/photo', [Admin\ProfileController::class, 'deletePhoto']);
        Route::post('/profile/cv', [Admin\ProfileController::class, 'uploadCv']);
        Route::delete('/profile/cv', [Admin\ProfileController::class, 'deleteCv']);

        $lists = [
            'experiences' => Admin\ExperienceController::class,
            'projects' => Admin\ProjectController::class,
            'education' => Admin\EducationController::class,
            'certifications' => Admin\CertificationController::class,
            'skill-groups' => Admin\SkillGroupController::class,
        ];

        foreach ($lists as $uri => $controller) {
            Route::get("/$uri", [$controller, 'index']);
            Route::post("/$uri", [$controller, 'store']);
            Route::put("/$uri/reorder", [$controller, 'reorder']);
            Route::put("/$uri/{id}", [$controller, 'update'])->whereNumber('id');
            Route::delete("/$uri/{id}", [$controller, 'destroy'])->whereNumber('id');
        }

        Route::get('/messages', [Admin\MessageController::class, 'index']);
        Route::put('/messages/{id}/read', [Admin\MessageController::class, 'markRead'])->whereNumber('id');
        Route::delete('/messages/{id}', [Admin\MessageController::class, 'destroy'])->whereNumber('id');

        Route::get('/backup', [Admin\BackupController::class, 'info']);
        Route::get('/backup/download', [Admin\BackupController::class, 'download']);
        Route::post('/backup/restore', [Admin\BackupController::class, 'restore']);
    });
});
