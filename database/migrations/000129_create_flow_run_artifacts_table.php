<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flow_run_artifacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flow_run_id')->constrained('flow_runs')->cascadeOnDelete();
            $table->string('type');
            $table->string('relative_path');
            $table->text('storage_path');
            $table->string('disk');
            $table->unsignedBigInteger('size_bytes');
            $table->string('mime_type')->nullable();
            $table->string('checksum_sha256', 64)->nullable();
            $table->string('status');
            $table->timestamps();

            $table->unique(
                ['flow_run_id', 'type', 'relative_path'],
                'flow_run_artifacts_run_type_path_unique',
            );
            $table->index(
                ['flow_run_id', 'type', 'status'],
                'flow_run_artifacts_run_type_status_index',
            );
        });

        Schema::create('stored_uploads', function (Blueprint $table) {
            $table->id();
            $table->string('path')->unique();
            $table->text('storage_path');
            $table->string('disk');
            $table->unsignedBigInteger('size_bytes');
            $table->string('mime_type')->nullable();
            $table->string('checksum_sha256', 64);
            $table->string('status');
            $table->timestamps();

            $table->index(['disk', 'status']);
        });

        Schema::create('storage_deletions', function (Blueprint $table) {
            $table->id();
            $table->string('disk');
            $table->text('storage_path');
            $table->unsignedInteger('attempts')->default(0);
            $table->text('last_error')->nullable();
            $table->timestamps();

            $table->index(['attempts', 'created_at']);
        });

        $this->indexLegacyUploads();
    }

    /**
     * Copy files stored by the previous public "uploads" disk into the new
     * local storage root and index them so UploadStorage::find() keeps
     * resolving avatars, icons, cookie state and whitelabel assets.
     */
    private function indexLegacyUploads(): void
    {
        $legacyRoot = config('filesystems.disks.uploads.root', public_path('uploads'));
        if (! is_string($legacyRoot) || $legacyRoot === '' || ! is_dir($legacyRoot)) {
            return;
        }
        $legacyRoot = rtrim((string) (realpath($legacyRoot) ?: $legacyRoot), DIRECTORY_SEPARATOR);
        $localRoot = config('filesystems.disks.puppetflow-local.root');
        if (
            is_string($localRoot)
            && rtrim((string) (realpath($localRoot) ?: $localRoot), DIRECTORY_SEPARATOR) === $legacyRoot
        ) {
            return;
        }

        $disk = Storage::disk('puppetflow-local');
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($legacyRoot, FilesystemIterator::SKIP_DOTS),
        );

        /** @var SplFileInfo $file */
        foreach ($iterator as $file) {
            if (! $file->isFile() || $file->isLink() || str_starts_with($file->getFilename(), '.')) {
                continue;
            }

            $path = str_replace(
                DIRECTORY_SEPARATOR,
                '/',
                ltrim(substr($file->getPathname(), strlen($legacyRoot)), DIRECTORY_SEPARATOR),
            );
            if ($path === '' || DB::table('stored_uploads')->where('path', $path)->exists()) {
                continue;
            }

            try {
                $storagePath = 'uploads/'.$path;
                if (! $disk->exists($storagePath)) {
                    $stream = fopen($file->getPathname(), 'rb');
                    if (! is_resource($stream)) {
                        throw new RuntimeException('Unable to read the legacy upload.');
                    }
                    try {
                        $disk->put($storagePath, $stream);
                    } finally {
                        fclose($stream);
                    }
                }

                $size = $disk->size($storagePath);
                $checksum = hash('sha256', (string) $disk->get($storagePath));
                $mimeType = $disk->mimeType($storagePath);

                DB::table('stored_uploads')->insert([
                    'path' => $path,
                    'storage_path' => $storagePath,
                    'disk' => 'puppetflow-local',
                    'size_bytes' => $size,
                    'mime_type' => is_string($mimeType) ? $mimeType : null,
                    'checksum_sha256' => $checksum,
                    'status' => 'ready',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } catch (\Throwable $exception) {
                Log::warning('Unable to index a legacy upload during migration.', [
                    'path' => $path,
                    'error' => $exception->getMessage(),
                ]);
            }
        }
    }

    public function down(): void
    {
        if (
            Schema::hasTable('storage_deletions')
            && DB::table('storage_deletions')->exists()
        ) {
            throw new RuntimeException('Complete pending storage deletions before rolling back.');
        }

        $workspaceRoot = config('filesystems.disks.run-artifacts-workspace.root');
        $localRoot = config('filesystems.disks.puppetflow-local.root');
        $customLocalStorageExists = Schema::hasTable('flow_run_artifacts')
            && DB::table('flow_run_artifacts')->where('disk', 'puppetflow-local')->exists()
            && (
                ! is_string($workspaceRoot)
                || ! is_string($localRoot)
                || rtrim((string) (realpath($workspaceRoot) ?: $workspaceRoot), DIRECTORY_SEPARATOR)
                    !== rtrim((string) (realpath($localRoot) ?: $localRoot), DIRECTORY_SEPARATOR)
            );
        if (
            $customLocalStorageExists
            || (
                Schema::hasTable('flow_run_artifacts')
                && DB::table('flow_run_artifacts')
                    ->whereNotIn('disk', [
                        'puppetflow-local',
                        'run-artifacts-workspace',
                    ])
                    ->exists()
            )
        ) {
            throw new RuntimeException(
                'Migrate every artifact back to local storage before rolling back.',
            );
        }

        if (
            Schema::hasTable('stored_uploads')
            && DB::table('stored_uploads')->exists()
        ) {
            throw new RuntimeException('Remove or explicitly preserve every stored upload before rolling back.');
        }

        Schema::dropIfExists('storage_deletions');
        Schema::dropIfExists('stored_uploads');
        Schema::dropIfExists('flow_run_artifacts');
    }
};
