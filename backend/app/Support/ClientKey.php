<?php

namespace App\Support;

/**
 * Rate-limit key for a client address. IPv4 is used as it is; IPv6 is reduced to
 * its /64 prefix, because a single subscriber normally controls a whole /64 and
 * could otherwise get a fresh quota for every request.
 */
final class ClientKey
{
    public static function for(?string $ip): string
    {
        if ($ip === null || $ip === '') {
            return 'unknown';
        }

        $packed = @inet_pton($ip);

        if ($packed === false) {
            return $ip;
        }

        if (strlen($packed) === 16) {
            // IPv4-mapped IPv6 (::ffff:a.b.c.d) is an IPv4 client.
            if (str_starts_with($packed, str_repeat("\0", 10)."\xff\xff")) {
                return (string) inet_ntop(substr($packed, 12));
            }

            return bin2hex(substr($packed, 0, 8)).'/64';
        }

        return $ip;
    }
}
