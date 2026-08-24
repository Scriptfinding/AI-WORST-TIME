<?php

namespace App\Services\Integration\Ai\Vendor\Anthropic;

use App\Contracts\Integration\Ai\AiProviderDriverInterface;
use App\Enums\Integration\IntegrationAiProviderEnum;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class AnthropicDriver implements AiProviderDriverInterface
{
    public function provider(): IntegrationAiProviderEnum
    {
        return IntegrationAiProviderEnum::ANTHROPIC;
    }

    public function listModels(string $apiKey): array
    {
        $models = [];
        $afterId = null;

        do {
            $response = $this->request($apiKey)->get('https://api.anthropic.com/v1/models', array_filter([
                'limit' => 1000,
                'after_id' => $afterId,
            ]));
            $this->ensureSuccess($response);
            $data = $response->json('data');
            foreach (is_array($data) ? $data : [] as $model) {
                if (! is_array($model) || ! is_string($model['id'] ?? null)) {
                    continue;
                }
                $capabilities = is_array($model['capabilities'] ?? null) ? $model['capabilities'] : [];
                $models[] = [
                    'id' => $model['id'],
                    'label' => is_string($model['display_name'] ?? null) ? $model['display_name'] : $model['id'],
                    'capabilities' => [
                        'text' => true,
                        'vision' => $this->supported($capabilities['image_input'] ?? null) ?? true,
                        'structured_output' => $this->supported($capabilities['structured_outputs'] ?? null),
                        'tools' => $this->supported($capabilities['tool_use'] ?? null),
                    ],
                    'context_window' => is_numeric($model['max_input_tokens'] ?? null)
                        ? (int) $model['max_input_tokens']
                        : null,
                ];
            }
            $afterId = $response->json('has_more') ? $response->json('last_id') : null;
        } while (is_string($afterId) && $afterId !== '');

        $sorted = collect($models)->sortBy('label', SORT_NATURAL | SORT_FLAG_CASE)->values()->all();
        /** @var list<array<string, mixed>> $sorted */

        return $sorted;
    }

    public function message(string $apiKey, string $model, array $messages, array $options = []): array
    {
        $normalized = collect($messages)
            ->filter(fn (array $message): bool => ($message['role'] ?? null) !== 'system')
            ->map(function (array $message): array {
                $content = collect(is_array($message['content'] ?? null) ? $message['content'] : [])
                    ->map(function (mixed $part): ?array {
                        if (! is_array($part)) {
                            return null;
                        }
                        if (($part['type'] ?? null) === 'image' && is_string($part['data'] ?? null)) {
                            return [
                                'type' => 'image',
                                'source' => [
                                    'type' => 'base64',
                                    'media_type' => is_string($part['mime_type'] ?? null) ? $part['mime_type'] : 'image/jpeg',
                                    'data' => $part['data'],
                                ],
                            ];
                        }
                        if (($part['type'] ?? null) === 'text' && is_string($part['text'] ?? null)) {
                            return ['type' => 'text', 'text' => $part['text']];
                        }

                        return null;
                    })
                    ->filter()
                    ->values()
                    ->all();

                return [
                    'role' => ($message['role'] ?? null) === 'assistant' ? 'assistant' : 'user',
                    'content' => $content,
                ];
            })
            ->values()
            ->all();

        $responseFormat = is_array($options['response_format'] ?? null) ? $options['response_format'] : [];
        $system = $options['system'] ?? null;
        if (($responseFormat['type'] ?? null) === 'json_object') {
            $jsonInstruction = 'Return only a valid JSON object.';
            $system = is_string($system) && $system !== ''
                ? $system."\n\n".$jsonInstruction
                : $jsonInstruction;
        }

        $payload = array_filter([
            'model' => $model,
            'messages' => $normalized,
            'system' => $system,
            'max_tokens' => $options['max_tokens'] ?? 1024,
            'temperature' => $options['temperature'] ?? null,
            'top_p' => $options['top_p'] ?? null,
        ], fn (mixed $value): bool => $value !== null && $value !== '');
        if (
            ($responseFormat['type'] ?? null) === 'json_schema'
            && is_array($responseFormat['schema'] ?? null)
        ) {
            $payload['output_config'] = [
                'format' => [
                    'type' => 'json_schema',
                    'schema' => $responseFormat['schema'],
                ],
            ];
        }

        $response = $this->request($apiKey)->post('https://api.anthropic.com/v1/messages', $payload);
        for ($attempt = 0; $attempt < 2 && $response->failed(); $attempt++) {
            $removedOption = false;
            foreach (['temperature', 'top_p'] as $samplingOption) {
                if (! array_key_exists($samplingOption, $payload)
                    || ! $this->isUnsupportedOptionError($response, $samplingOption)) {
                    continue;
                }

                unset($payload[$samplingOption]);
                $response = $this->request($apiKey)->post('https://api.anthropic.com/v1/messages', $payload);
                $removedOption = true;

                break;
            }

            if (! $removedOption) {
                break;
            }
        }
        $this->ensureSuccess($response);
        $decoded = $response->json();
        $raw = is_array($decoded) ? $decoded : [];
        $content = is_array($raw['content'] ?? null) ? $raw['content'] : [];
        $text = collect($content)
            ->filter(fn (mixed $part): bool => is_array($part) && ($part['type'] ?? null) === 'text')
            ->pluck('text')
            ->filter(fn (mixed $text): bool => is_string($text))
            ->implode('');

        return [
            'text' => $text,
            'content' => $content,
            'usage' => is_array($raw['usage'] ?? null) ? $raw['usage'] : [],
            'model' => $raw['model'] ?? $model,
            'finishReason' => $raw['stop_reason'] ?? null,
            'raw' => ($options['include_raw'] ?? false) ? $raw : null,
        ];
    }

    private function request(string $apiKey): \Illuminate\Http\Client\PendingRequest
    {
        return Http::acceptJson()
            ->asJson()
            ->withHeaders([
                'x-api-key' => $apiKey,
                'anthropic-version' => '2023-06-01',
            ])
            ->connectTimeout(10)
            ->timeout(120);
    }

    private function supported(mixed $capability): ?bool
    {
        if (is_bool($capability)) {
            return $capability;
        }

        return is_array($capability) && is_bool($capability['supported'] ?? null)
            ? $capability['supported']
            : null;
    }

    private function isUnsupportedOptionError(Response $response, string $option): bool
    {
        if (! $response->failed()) {
            return false;
        }

        $errorMessage = $response->json('error.message', '');
        $detail = is_string($errorMessage) ? strtolower($errorMessage) : '';
        $unsupported = str_contains($detail, 'deprecated')
            || str_contains($detail, 'unsupported')
            || str_contains($detail, 'not supported')
            || str_contains($detail, 'does not support');

        return $unsupported && str_contains($detail, $option);
    }

    private function ensureSuccess(Response $response): void
    {
        if ($response->failed()) {
            $detail = $response->json('error.message');
            $suffix = is_string($detail) && $detail !== '' ? " {$detail}" : '';

            throw new RuntimeException("Anthropic request failed with HTTP {$response->status()}.{$suffix}");
        }
    }
}
