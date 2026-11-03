<?php

return [

    /*
     * Bcrypt hash of the only admin password. Generate it with
     * `php artisan admin:hash-password` and paste it into the .env file:
     * the password can be changed only from there.
     */
    'admin_password_hash' => env('ADMIN_PASSWORD_HASH'),

    // Failed logins allowed per IP before the form is locked.
    'login_max_attempts' => (int) env('ADMIN_LOGIN_MAX_ATTEMPTS', 5),
    'login_decay_minutes' => (int) env('ADMIN_LOGIN_DECAY_MINUTES', 15),

    // Where contact form messages are forwarded. Empty = stored only in the admin.
    'contact_notify_email' => env('CONTACT_NOTIFY_EMAIL'),
    'contact_max_per_hour' => (int) env('CONTACT_MAX_PER_HOUR', 5),
    'contact_max_global_per_hour' => (int) env('CONTACT_MAX_GLOBAL_PER_HOUR', 60),

];
