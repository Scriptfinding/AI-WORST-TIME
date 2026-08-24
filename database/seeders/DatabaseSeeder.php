<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $localSeeder = __NAMESPACE__.'\\LocalSeeder';
        if (class_exists($localSeeder)) {
            $this->call($localSeeder);
        }
    }
}
