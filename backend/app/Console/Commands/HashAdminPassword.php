<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class HashAdminPassword extends Command
{
    protected $signature = 'admin:hash-password';

    protected $description = 'Genera il valore di ADMIN_PASSWORD_HASH per il file .env';

    public function handle(): int
    {
        $password = (string) $this->secret('Nuova password admin (almeno 12 caratteri)');

        if (mb_strlen($password) < 12) {
            $this->error('La password deve avere almeno 12 caratteri.');

            return self::FAILURE;
        }

        if ($password !== (string) $this->secret('Ripeti la password')) {
            $this->error('Le due password non coincidono.');

            return self::FAILURE;
        }

        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

        $this->line('Copia questa riga nel file .env (gli apici singoli servono per i caratteri $):');
        $this->newLine();
        $this->line("ADMIN_PASSWORD_HASH='$hash'");

        return self::SUCCESS;
    }
}
