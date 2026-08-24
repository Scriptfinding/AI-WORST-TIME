<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flow_user_cookie_jars', function (Blueprint $table) {
            $table->id();
            $table->string('flow_id', 32);
            $table->foreign('flow_id')->references('id')->on('flows')->cascadeOnDelete();
            $table->string('user_id', 32);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('jar_name');
            $table->text('cookies');
            $table->timestamps();

            $table->unique(['flow_id', 'user_id', 'jar_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flow_user_cookie_jars');
    }
};
