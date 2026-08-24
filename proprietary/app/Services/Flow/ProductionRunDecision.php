<?php

namespace App\Services\Flow;

final readonly class ProductionRunDecision
{
    /**
     * @param  list<string>  $reasons
     */
    public function __construct(
        public bool $isProduction,
        public int $score,
        public bool $productionMode,
        public string $ruleset,
        public array $reasons,
        public bool $isManual,
    ) {}

    /** @return array<string, mixed>|null */
    public function initialAudit(): ?array
    {
        if (! $this->isManual) {
            return null;
        }

        return [
            'ruleset' => $this->ruleset,
            'score_at_dispatch' => $this->score,
            'score_before' => $this->score,
            'production_mode_at_dispatch' => $this->productionMode,
            'is_production' => $this->isProduction,
            'dispatch_reasons' => $this->reasons,
            'evaluated' => false,
        ];
    }
}
