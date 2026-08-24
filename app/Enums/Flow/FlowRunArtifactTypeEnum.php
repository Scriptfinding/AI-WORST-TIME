<?php

namespace App\Enums\Flow;

enum FlowRunArtifactTypeEnum: string
{
    case SCREENSHOTS = 'screenshots';
    case DOWNLOADS = 'downloads';
    case DOWNLOADING = 'downloading';
    case RECORDING = 'recording';
    case TMP = 'tmp';

    public function isExportable(): bool
    {
        return $this === self::SCREENSHOTS || $this === self::DOWNLOADS || $this === self::RECORDING;
    }

    /** @return list<self|string> */
    public static function getExportables(bool $asStrings = false): array
    {
        return [
            $asStrings ? self::SCREENSHOTS->value : self::SCREENSHOTS,
            $asStrings ? self::DOWNLOADS->value : self::DOWNLOADS,
            $asStrings ? self::RECORDING->value : self::RECORDING,
        ];
    }

    /**
     * Types listable via /artifacts/{type} (recording has its own /recording route).
     *
     * @return list<self|string>
     */
    public static function getArtifactApiTypes(bool $asStrings = false): array
    {
        return [
            $asStrings ? self::SCREENSHOTS->value : self::SCREENSHOTS,
            $asStrings ? self::DOWNLOADS->value : self::DOWNLOADS,
        ];
    }

    /** @return list<string> */
    public static function getStringList(): array
    {
        return array_map(fn (self $type) => $type->value, self::cases());
    }
}
