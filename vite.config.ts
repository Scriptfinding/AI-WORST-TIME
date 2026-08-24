import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/App/app.tsx'],
            refresh: true,
        }),
        react({
            babel: {
                plugins: [
                    ['babel-plugin-styled-components', {
                        displayName: true,
                        fileName: true,
                    }],
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
            '@proprietary': path.resolve(__dirname, 'proprietary/resources/js'),
        },
    },
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
