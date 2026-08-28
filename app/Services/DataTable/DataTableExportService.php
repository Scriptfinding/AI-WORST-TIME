<?php

namespace App\Services\DataTable;

use App\Models\DataTableColumn;
use Illuminate\Support\Collection;

final class DataTableExportService
{
    /** @param 'csv'|'json'|'xml' $format */
    public function contentType(string $format): string
    {
        return match ($format) {
            'csv' => 'text/csv; charset=UTF-8',
            'json' => 'application/json; charset=UTF-8',
            'xml' => 'application/xml; charset=UTF-8',
        };
    }

    /**
     * Writes the export directly to the output stream.
     *
     * @param  'csv'|'json'|'xml'  $format
     * @param  iterable<array<string, mixed>>  $rows
     * @param  Collection<int, DataTableColumn>  $columns
     */
    public function write(string $format, iterable $rows, Collection $columns, string $tableName): void
    {
        match ($format) {
            'csv' => $this->writeCsv($rows, $columns),
            'json' => $this->writeJson($rows, $columns),
            'xml' => $this->writeXml($rows, $columns, $tableName),
        };
    }

    /**
     * @param  iterable<array<string, mixed>>  $rows
     * @param  Collection<int, DataTableColumn>  $columns
     */
    private function writeCsv(iterable $rows, Collection $columns): void
    {
        $output = fopen('php://output', 'wb');
        if ($output === false) {
            throw new \RuntimeException('Unable to open the export stream.');
        }

        /** @var list<string> $headers */
        $headers = [
            'id',
            ...$columns->map(fn (DataTableColumn $column): string => $column->name)->values()->all(),
            'created_at',
            'updated_at',
        ];
        fputcsv($output, $headers);
        foreach ($rows as $row) {
            $record = $this->exportRecord($row, $columns);
            fputcsv($output, array_map(
                fn (bool|float|int|string|null $value): float|int|string|null => (
                    is_bool($value) ? ($value ? 'true' : 'false') : $value
                ),
                array_values($record),
            ));
        }
        fclose($output);
    }

    /**
     * @param  iterable<array<string, mixed>>  $rows
     * @param  Collection<int, DataTableColumn>  $columns
     */
    private function writeJson(iterable $rows, Collection $columns): void
    {
        echo '[';
        $first = true;
        foreach ($rows as $row) {
            if (! $first) {
                echo ',';
            }
            echo json_encode(
                $this->exportRecord($row, $columns),
                JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
            );
            $first = false;
        }
        echo ']';
    }

    /**
     * @param  iterable<array<string, mixed>>  $rows
     * @param  Collection<int, DataTableColumn>  $columns
     */
    private function writeXml(iterable $rows, Collection $columns, string $tableName): void
    {
        echo '<?xml version="1.0" encoding="UTF-8"?>';
        echo '<table name="'.$this->xml($tableName).'"><rows>';
        foreach ($rows as $row) {
            echo '<row>';
            foreach ($this->exportRecord($row, $columns) as $name => $value) {
                echo '<field name="'.$this->xml($name).'"';
                if ($value === null) {
                    echo ' null="true"/>';
                } else {
                    $serialized = is_bool($value) ? ($value ? 'true' : 'false') : (string) $value;
                    echo '>'.$this->xml($serialized).'</field>';
                }
            }
            echo '</row>';
        }
        echo '</rows></table>';
    }

    /**
     * @param  array<string, mixed>  $row
     * @param  Collection<int, DataTableColumn>  $columns
     * @return array<string, bool|float|int|string|null>
     */
    private function exportRecord(array $row, Collection $columns): array
    {
        /** @var array{
         *     id: int,
         *     values: array<int|string, bool|float|int|string|null>,
         *     created_at: string,
         *     updated_at: string
         * } $row
         */
        $record = ['id' => $row['id']];
        foreach ($columns as $column) {
            $record[$column->name] = $row['values'][$column->id] ?? null;
        }
        $record['created_at'] = $row['created_at'];
        $record['updated_at'] = $row['updated_at'];

        return $record;
    }

    private function xml(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }
}
