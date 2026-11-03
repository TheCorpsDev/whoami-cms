<?php

namespace Tests\Unit;

use App\Support\ClientKey;
use PHPUnit\Framework\TestCase;

class ClientKeyTest extends TestCase
{
    public function test_ipv4_is_used_as_it_is(): void
    {
        $this->assertSame('203.0.113.9', ClientKey::for('203.0.113.9'));
    }

    public function test_ipv6_addresses_of_the_same_64_share_a_key(): void
    {
        $this->assertSame(ClientKey::for('2001:db8:0:1::1'), ClientKey::for('2001:db8:0:1:ffff:ffff:ffff:ffff'));
        $this->assertNotSame(ClientKey::for('2001:db8:0:1::1'), ClientKey::for('2001:db8:0:2::1'));
        $this->assertSame('20010db800000001/64', ClientKey::for('2001:db8:0:1::1'));
    }

    public function test_ipv4_mapped_ipv6_counts_as_ipv4(): void
    {
        $this->assertSame('203.0.113.9', ClientKey::for('::ffff:203.0.113.9'));
    }

    public function test_missing_or_malformed_address_never_throws(): void
    {
        $this->assertSame('unknown', ClientKey::for(null));
        $this->assertSame('not-an-ip', ClientKey::for('not-an-ip'));
    }
}
