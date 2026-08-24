<?php

namespace App\Services\Integration\Ai\Vendor\Mistral;

use App\Contracts\Integration\Ai\AiProviderDriverInterface;
use App\Enums\Integration\IntegrationAiProviderEnum;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class MistralDriver implements AiProviderDriverInterface
{
    public function provider(): IntegrationAiProviderEnum
    {
        return IntegrationAiProviderEnum::MISTRAL;
    }

    public function listModels(string $apiKey): array
    {
        $response = $this->request($apiKey)->get('https://api.mistral.ai/v1/models');
        $this->ensureSuccess($response);

        $data = $response->json('data');

        $models = collect(is_array($data) ? $data : [])
            ->filter(fn (mixed $model): bool => is_array($model) && is_string($model['id'] ?? null))
            ->map(function (array $model): array {
                $capabilities = is_array($model['capabilities'] ?? null) ? $model['capabilities'] : [];

                return [
                    'id' => $model['id'],
                    'label' => $model['id'],
                    'capabilities' => [
                        'text' => is_bool($capabilities['completion_chat'] ?? null)
                            ? $capabilities['completion_chat']
                            : null,
                        'vision' => is_bool($capabilities['vision'] ?? null) ? $capabilities['vision'] : null,
                        'structured_output' => null,
                        'tools' => is_bool($capabilities['function_calling'] ?? null)
                            ? $capabilities['function_calling']
                            : null,
                    ],
                    'context_window' => is_numeric($model['max_context_length'] ?? null)
                        ? (int) $model['max_context_length']
                        : null,
                ];
            })
            ->sortBy('label', SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->all();
        /** @var list<array<string, mixed>> $models */

        return $models;
    }

    public function message(string $apiKey, string $model, array $messages, array $options = []): array
    {
        $normalized = collect($messages)->map(function (array $message): array {
            $content = collect(is_array($message['content'] ?? null) ? $message['content'] : [])
                ->map(function (mixed $part): ?array {
                    if (! is_array($part)) {
                        return null;
                    }
                    if (($part['type'] ?? null) === 'image' && is_string($part['data'] ?? null)) {
                        $mime = is_string($part['mime_type'] ?? null) ? $part['mime_type'] : 'image/jpeg';

                        return ['type' => 'image_url', 'image_url' => "data:{$mime};base64,{$part['data']}"];
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
                'role' => in_array($message['role'] ?? null, ['user', 'assistant', 'system'], true)
                    ? $message['role']
                    : 'user',
                'content' => $content,
            ];
        })->values()->all();

        if (is_string($options['system'] ?? null) && $options['system'] !== '') {
            array_unshift($normalized, ['role' => 'system', 'content' => [['type' => 'text', 'text' => $options['system']]]]);
        }

        $payload = array_filter([
            'model' => $model,
            'messages' => $normalized,
            'temperature' => $options['temperature'] ?? null,
            'top_p' => $options['top_p'] ?? null,
            'max_tokens' => $options['max_tokens'] ?? null,
        ], fn (mixed $value): bool => $value !== null && $value !== '');
        $responseFormat = is_array($options['response_format'] ?? null) ? $options['response_format'] : [];
        if (
            ($responseFormat['type'] ?? null) === 'json_schema'
            && is_array($responseFormat['schema'] ?? null)
        ) {
            $payload['response_format'] = [
                'type' => 'json_schema',
                'json_schema' => [
                    'schema' => $responseFormat['schema'],
                    'name' => is_string($responseFormat['name'] ?? null)
                        ? $responseFormat['name']
                        : 'response',
                    'strict' => true,
                ],
            ];
        } elseif (($responseFormat['type'] ?? null) === 'json_object') {
            $payload['response_format'] = ['type' => 'json_object'];
        }

        $response = $this->request($apiKey)->post('https://api.mistral.ai/v1/chat/completions', $payload);
        $this->ensureSuccess($response);
        $decoded = $response->json();
        $raw = is_array($decoded) ? $decoded : [];
        $choices = is_array($raw['choices'] ?? null) ? $raw['choices'] : [];
        $choice = is_array($choices[0] ?? null) ? $choices[0] : [];
        $message = is_array($choice['message'] ?? null) ? $choice['message'] : [];
        $content = $message['content'] ?? '';
        $text = is_string($content) ? $content : '';

        return [
            'text' => $text,
            'content' => is_array($content) ? $content : [['type' => 'text', 'text' => $text]],
            'usage' => is_array($raw['usage'] ?? null) ? $raw['usage'] : [],
            'model' => $raw['model'] ?? $model,
            'finishReason' => $choice['finish_reason'] ?? null,
            'raw' => ($options['include_raw'] ?? false) ? $raw : null,
        ];
    }

    private function request(string $apiKey): \Illuminate\Http\Client\PendingRequest
    {
        return Http::acceptJson()
            ->asJson()
            ->withToken($apiKey)
            ->connectTimeout(10)
            ->timeout(120);
    }

    private function ensureSuccess(Response $response): void
    {
        if ($response->failed()) {
            $detail = $response->json('error.message');
            $suffix = is_string($detail) && $detail !== '' ? " {$detail}" : '';

            throw new RuntimeException("Mistral request failed with HTTP {$response->status()}.{$suffix}");
        }
    }
}
