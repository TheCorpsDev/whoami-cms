<?php

use App\Http\Controllers\Public\ContactController;
use App\Http\Controllers\Public\PortfolioController;
use Illuminate\Support\Facades\Route;

Route::get('/portfolio', [PortfolioController::class, 'show']);
Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:contact');
