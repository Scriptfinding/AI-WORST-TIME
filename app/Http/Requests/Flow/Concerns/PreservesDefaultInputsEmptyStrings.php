<?php

namespace App\Http\Requests\Flow\Concerns;

trait PreservesDefaultInputsEmptyStrings
{
    /**
     * The global ConvertEmptyStringsToNull middleware recursively turns ""
     * into null. Flow inputs must keep empty strings (a blank text input is
     * "" and not null), so restore them from the untouched raw JSON payload.
     */
    protected function prepareForValidation(): void
    {
        if (! $this->isJson()) {
            return;
        }

        $raw = json_decode($this->getContent(), true);
        if (is_array($raw) && array_key_exists('default_inputs', $raw)) {
            $this->merge(['default_inputs' => $raw['default_inputs']]);
        }
    }
}
