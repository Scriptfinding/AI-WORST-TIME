import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
    {
        ignores: [
            'public/**', 'vendor/**', 'node_modules/**', 'bootstrap/**', 'storage/**',
            // Local CLI flows (gitignored user code)
            'src/flows/**',
            // Generated artifact (built from src/runtime/ fragments)
            'src/sandbox/run-header.js',
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['{resources/js,proprietary/resources/js}/**/*.js'],
        languageOptions: {
            globals: { window: 'readonly', document: 'readonly', console: 'readonly', axios: 'readonly' },
        },
    },
    {
        files: ['src/**/*.js', 'main.js', 'scripts/**/*.mjs'],
        languageOptions: {
            globals: {
                Buffer: 'readonly',
                URL: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                clearInterval: 'readonly',
                clearTimeout: 'readonly',
                console: 'readonly',
                exports: 'writable',
                global: 'readonly',
                module: 'writable',
                process: 'readonly',
                require: 'readonly',
                setInterval: 'readonly',
                setTimeout: 'readonly',
            },
        },
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { caughtErrorsIgnorePattern: '^_' }],
            'no-empty': ['error', { allowEmptyCatch: true }],
            'no-unused-vars': 'off',
        },
    },
    {
        // Runtime fragments share one lexical scope: they are concatenated into
        // src/sandbox/run-header.js and injected inside the async IIFE built by run.js.
        // Cross-fragment symbols are therefore declared as globals, and unused-vars
        // is off because most definitions are consumed by other fragments or by
        // user flow code.
        files: ['src/runtime/**/*.js'],
        languageOptions: {
            globals: {
                // Browser context (inside $page.evaluate callbacks)
                document: 'readonly',
                jQuery: 'readonly',
                navigator: 'readonly',
                window: 'readonly',
                // Provided by the run.js wrapper
                $browser: 'readonly',
                $page: 'readonly',
                $puppeteer: 'readonly',
                _recordingStartTs: 'readonly',
                // Shared across fragments (defined in 01-bootstrap / 02-globals)
                $_appUrl: 'readonly',
                $_watchers: 'readonly',
                $client: 'readonly',
                $json: 'readonly',
                DateTime: 'readonly',
                Duration: 'readonly',
                Interval: 'readonly',
                SCREENSHOT_CPT: 'writable',
                StopRun: 'readonly',
                _artifactExcluded: 'readonly',
                _outputData: 'readonly',
                _pendingCleanup: 'readonly',
                __actionLogsDirty: 'writable',
                __actionLogsPath: 'readonly',
                __channelsJson: 'readonly',
                __downloadingPath: 'readonly',
                __downloadsPath: 'readonly',
                __emitAction: 'readonly',
                __formatActionLabel: 'readonly',
                __internalLoadCookies: 'readonly',
                __internalSaveCookies: 'readonly',
                __internalSelect: 'readonly',
                __internalSleep: 'readonly',
                __activateNamedPage: 'readonly',
                __activateOrCreateNamedPage: 'readonly',
                __getActivePage: 'readonly',
                __getActiveTabName: 'readonly',
                __registerNamedPageInitializer: 'readonly',
                __setNamedPageViewport: 'readonly',
                __requireSandboxModule: 'readonly',
                __resolveArtifactPath: 'readonly',
                __retryOnContextDestroyed: 'readonly',
                __runnerOperations: 'readonly',
                __runtimeSecretsPath: 'readonly',
                __varsJson: 'readonly',
                __watchersJson: 'readonly',
                crypto: 'readonly',
                AbortController: 'readonly',
                exec: 'readonly',
                fetch: 'readonly',
                fs: 'readonly',
                path: 'readonly',
                paths: 'readonly',
                spawn: 'readonly',
                // Runtime API used by other fragments ($breakpoint context, etc.)
                $fillInput: 'readonly',
                $generateResponse: 'readonly',
                $generateResponseError: 'readonly',
                $generateResponseSuccess: 'readonly',
                $getDownloadsPathFile: 'readonly',
                $gotoTab: 'readonly',
                $gotoUrl: 'readonly',
                $bridgeEvaluate: 'readonly',
                $injectScriptLibrary: 'readonly',
                $legend: 'readonly',
                $selectAtIndex: 'readonly',
                $scanDirectory: 'readonly',
                $scanDownloadsDirectory: 'readonly',
                $screenshot: 'readonly',
                $setOutput: 'readonly',
                $sleep: 'readonly',
                $unzipFile: 'readonly',
                $vars: 'readonly',
                $waitForFile: 'readonly',
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true }],
        },
    },
    {
        files: ['{resources/js,proprietary/resources/js}/**/*.{ts,tsx}'],
        plugins: {
            'react-hooks': reactHooks,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,

            'no-undef': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
            }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/ban-ts-comment': 'warn',
            'no-empty': ['error', { allowEmptyCatch: true }],
        },
    },
);