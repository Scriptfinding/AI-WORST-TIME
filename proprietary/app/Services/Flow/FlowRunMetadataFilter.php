<?php

namespace App\Services\Flow;

use App\Database\DatabaseDialect;
use App\Database\SqlExpression;
use App\Models\FlowRun;
use Illuminate\Database\Eloquent\Builder;

final class FlowRunMetadataFilter
{
    private const OPERATORS = [
        'contains',
        'equals',
        'not_equals',
        'starts_with',
        'ends_with',
        'gt',
        'gte',
        'lt',
        'lte',
        'exists',
    ];

    public function __construct(private readonly DatabaseDialect $dialect) {}

    /**
     * @param  Builder<FlowRun>  $query
     */
    public function applyPresence(Builder $query, mixed $presence): void
    {
        if (! in_array($presence, ['any', 'none'], true)) {
            return;
        }

        $hasMeta = $this->dialect->jsonObjectIsNotEmpty('flow_runs.meta');
        if ($presence === 'any') {
            $query->whereRaw($hasMeta->sql, $hasMeta->bindings);

            return;
        }

        $query->where(function (Builder $metaQuery) use ($hasMeta): void {
            $metaQuery
                ->whereNull('flow_runs.meta')
                ->orWhereRaw("NOT ({$hasMeta->sql})", $hasMeta->bindings);
        });
    }

    /**
     * @param  Builder<FlowRun>  $query
     * @param  array<array-key, mixed>  $filters
     */
    public function applyFilters(Builder $query, array $filters, mixed $predicate = 'and'): void
    {
        $filters = $this->normalize($filters);
        if ($filters === []) {
            return;
        }

        $useOr = $predicate === 'or';
        $query->where(function (Builder $metaQuery) use ($filters, $useOr): void {
            foreach ($filters as $index => $filter) {
                $clause = function (Builder $clauseQuery) use ($filter): void {
                    $this->applyClause(
                        $clauseQuery,
                        $filter['key'],
                        $filter['value'] ?? '',
                        $filter['operator'],
                    );
                };

                if ($index > 0 && $useOr) {
                    $metaQuery->orWhere($clause);
                } else {
                    $metaQuery->where($clause);
                }
            }
        });
    }

    /**
     * @param  array<array-key, mixed>  $filters
     * @return list<array{key: non-empty-string, value?: string, operator: string}>
     */
    public function normalize(array $filters): array
    {
        $normalized = [];

        foreach ($filters as $filter) {
            if (! is_array($filter)) {
                continue;
            }

            $key = $filter['key'] ?? null;
            if (! is_string($key) || $key === '') {
                continue;
            }

            $operator = $filter['operator'] ?? '';
            $operator = is_string($operator) && in_array($operator, self::OPERATORS, true)
                ? $operator
                : 'contains';
            $value = $filter['value'] ?? null;
            if ($operator !== 'exists' && ! is_scalar($value)) {
                continue;
            }

            $entry = [
                'key' => $key,
                'operator' => $operator,
            ];
            if ($operator !== 'exists') {
                $entry['value'] = (string) $value;
            }

            $normalized[] = $entry;
        }

        return $normalized;
    }

    /**
     * @param  Builder<FlowRun>  $query
     */
    private function applyClause(Builder $query, string $key, string $value, string $operator): void
    {
        $sources = [
            $this->dialect->jsonScalar('flow_runs.meta', $key),
            $this->dialect->jsonScalar('flow_runs.output', $key),
            $this->dialect->jsonScalar('flow_runs.input', $key),
        ];

        foreach ($sources as $index => $source) {
            [$sql, $bindings] = $this->comparison($source, $operator, $value);

            if ($index === 0) {
                $query->whereRaw($sql, $bindings);
            } else {
                $query->orWhereRaw($sql, $bindings);
            }
        }
    }

    /**
     * @return array{string, list<mixed>}
     */
    private function comparison(SqlExpression $expression, string $operator, string $value): array
    {
        if ($operator === 'exists') {
            return [
                "{$expression->sql} IS NOT NULL",
                $expression->bindings,
            ];
        }

        [$sqlOperator, $comparisonValue] = match ($operator) {
            'equals' => ['=', $value],
            'not_equals' => ['!=', $value],
            'starts_with' => ['LIKE', $value.'%'],
            'ends_with' => ['LIKE', '%'.$value],
            'gt' => ['>', $value],
            'gte' => ['>=', $value],
            'lt' => ['<', $value],
            'lte' => ['<=', $value],
            default => ['LIKE', '%'.$value.'%'],
        };

        return [
            "{$expression->sql} {$sqlOperator} ?",
            [...$expression->bindings, $comparisonValue],
        ];
    }
}
