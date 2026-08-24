<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>API Documentation - {{ app(\App\Contracts\BrandingProvider::class)->current()['name'] }}</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
    <style>
        /* ── light palette ── */
        [data-theme="light"] {
            --bg: #ffffff;
            --bg-raised: #f8f9fb;
            --bg-input: #f3f4f7;
            --bg-code: #ffffff;
            --bg-table: #f7f7f7;
            --border: #dfe2e8;
            --text: #1e2330;
            --text-muted: #64748b;
            --text-type: #6b7a8d;
            --accent: #4f6df5;
            --op-get-bg: #eff6ff;   --op-get-bd: #bfdbfe;
            --op-post-bg: #f0fdf4;  --op-post-bd: #bbf7d0;
            --op-put-bg: #fffbeb;   --op-put-bd: #fde68a;
            --op-del-bg: #fef2f2;   --op-del-bd: #fecaca;
            --backdrop: rgba(0,0,0,.3);
            --scrollbar-thumb: #c4c9d4;
        }

        /* ── dark palette ── */
        [data-theme="dark"] {
            --bg: #111118;
            --bg-raised: #1a1a24;
            --bg-input: #22222e;
            --bg-code: #1a1a24;
            --bg-table: #1a1a24;
            --border: #2e2e3a;
            --text: #e2e8f0;
            --text-muted: #8b8fa3;
            --text-type: #8b8fa3;
            --accent: #6c8cff;
            --op-get-bg: #3b82f608;   --op-get-bd: #3b82f644;
            --op-post-bg: #22c55e08;  --op-post-bd: #22c55e44;
            --op-put-bg: #f59e0b08;   --op-put-bd: #f59e0b44;
            --op-del-bg: #ef444408;   --op-del-bd: #ef444444;
            --backdrop: rgba(0,0,0,.6);
            --scrollbar-thumb: #2e2e3a;
        }

        * { box-sizing: border-box; }

        body {
            margin: 0;
            background: var(--bg);
            font-family: Inter, -apple-system, sans-serif;
            transition: background .2s;
        }

        /* ── toolbar ── */
        .toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 24px;
            position: sticky;
            top: 0;
            z-index: 100;
            background: var(--bg);
            border-bottom: 1px solid var(--border);
            transition: background .2s, border-color .2s;
        }

        .back-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: var(--text-muted);
            font-size: 13px;
            text-decoration: none;
            transition: color .15s;
        }
        .back-link:hover { color: var(--text); }
        .back-link svg { width: 14px; height: 14px; }

        /* ── theme switcher ── */
        .theme-switcher {
            display: flex;
            align-items: center;
            gap: 2px;
            padding: 3px;
            border-radius: 8px;
            background: var(--bg-input);
            border: 1px solid var(--border);
            transition: background .2s, border-color .2s;
        }
        .theme-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 26px;
            border: none;
            border-radius: 6px;
            background: transparent;
            color: var(--text-muted);
            cursor: pointer;
            transition: all .15s;
        }
        .theme-btn svg { width: 14px; height: 14px; }
        .theme-btn:hover { color: var(--text); }
        .theme-btn.active {
            background: var(--bg-raised);
            color: var(--text);
            box-shadow: 0 1px 3px rgba(0,0,0,.1);
        }
        [data-theme="dark"] .theme-btn.active {
            background: var(--border);
        }

        /* hide default topbar */
        .swagger-ui .topbar { display: none !important; }

        /* layout */
        .swagger-ui { max-width: 1200px; margin: 0 auto; padding: 0 20px 60px; }

        /* ── global text ── */
        .swagger-ui,
        .swagger-ui p,
        .swagger-ui span,
        .swagger-ui li,
        .swagger-ui td,
        .swagger-ui th,
        .swagger-ui label,
        .swagger-ui .info .title,
        .swagger-ui .info hgroup.main a,
        .swagger-ui .opblock-tag,
        .swagger-ui .opblock-tag small,
        .swagger-ui .opblock .opblock-summary-description,
        .swagger-ui .opblock .opblock-summary-operation-id,
        .swagger-ui .opblock .opblock-summary-path,
        .swagger-ui .opblock .opblock-summary-path span,
        .swagger-ui .tab li,
        .swagger-ui .parameter__name,
        .swagger-ui .parameter__type,
        .swagger-ui .parameter__in,
        .swagger-ui .parameter__deprecated,
        .swagger-ui .response-col_status,
        .swagger-ui .response-col_description,
        .swagger-ui .response-col_links,
        .swagger-ui .responses-header td,
        .swagger-ui table thead tr th,
        .swagger-ui table thead tr td,
        .swagger-ui .model-title,
        .swagger-ui .model,
        .swagger-ui .model span,
        .swagger-ui .model .property,
        .swagger-ui .model .property.primitive,
        .swagger-ui .prop-type,
        .swagger-ui .prop-format,
        .swagger-ui .renderedMarkdown p,
        .swagger-ui .markdown p,
        .swagger-ui .opblock-description-wrapper p { color: var(--text); }

        .swagger-ui .info .description p,
        .swagger-ui .info .description div,
        .swagger-ui .opblock-description-wrapper p,
        .swagger-ui .opblock-external-docs-wrapper p,
        .swagger-ui .parameter__name.required span { color: var(--text-muted); }

        .swagger-ui .parameter__name.required::after { color: #f87171; }

        /* ── links ── */
        .swagger-ui a, .swagger-ui a span { color: var(--accent); }

        /* ── backgrounds ── */
        .swagger-ui .scheme-container {
            background: var(--bg-raised);
            border-bottom: 1px solid var(--border);
            box-shadow: none;
        }
        .swagger-ui .opblock .opblock-section-header {
            background: var(--bg-raised);
            border-bottom: 1px solid var(--border);
            box-shadow: none;
        }
        .swagger-ui .opblock-body pre.microlight,
        .swagger-ui .highlight-code,
        .swagger-ui .example.microlight,
        .swagger-ui pre.example { background: var(--bg-code) !important; color: var(--text) !important; }
        .swagger-ui .opblock-body pre {
            background: var(--bg-code) !important;
            color: var(--text) !important;
            border: 1px solid var(--border);
            border-radius: 4px;
            margin-bottom: 12px;
        }
        .swagger-ui .responses-inner { background: var(--bg-table); }
        .swagger-ui .response-control-media-type__accept-message { color: var(--accent); }

        /* dropdowns & select */
        .swagger-ui .opblock-body select,
        .swagger-ui .scheme-container select,
        .swagger-ui .response-control-media-type--accept-controller select {
            background: var(--bg-code);
            border: 1px solid var(--border);
            color: var(--text);
        }

        /* example value containers */
        .swagger-ui .opblock-body .opblock-section .response-col_description .highlight-code,
        .swagger-ui .opblock-body .opblock-section .response-col_description .microlight {
            background: var(--bg-code) !important;
            border: 1px solid var(--border);
            border-radius: 4px;
        }
        .swagger-ui .example-value-raw,
        .swagger-ui .body-param__example {
            background: var(--bg-code) !important;
            border: 1px solid var(--border);
            border-radius: 4px;
        }

        /* type & format labels (toned down) */
        .swagger-ui .prop-type { color: var(--text-type) !important; }
        .swagger-ui .prop-format { color: var(--text-muted) !important; }
        .swagger-ui .parameter__type { color: var(--text-type) !important; }
        .swagger-ui .parameter__in { color: var(--text-muted) !important; }
        .swagger-ui .model .property.primitive { color: var(--text-type) !important; }

        /* operation blocks */
        .swagger-ui .opblock {
            background: var(--bg-raised);
            border: 1px solid var(--border);
            box-shadow: none;
            margin-bottom: 12px;
        }
        .swagger-ui .opblock-body { background: var(--bg) !important; }
        .swagger-ui .opblock.opblock-get { border-color: var(--op-get-bd); background: var(--op-get-bg); }
        .swagger-ui .opblock.opblock-get .opblock-summary { border-color: var(--op-get-bd); }
        .swagger-ui .opblock.opblock-post { border-color: var(--op-post-bd); background: var(--op-post-bg); }
        .swagger-ui .opblock.opblock-post .opblock-summary { border-color: var(--op-post-bd); }
        .swagger-ui .opblock.opblock-put { border-color: var(--op-put-bd); background: var(--op-put-bg); }
        .swagger-ui .opblock.opblock-put .opblock-summary { border-color: var(--op-put-bd); }
        .swagger-ui .opblock.opblock-delete { border-color: var(--op-del-bd); background: var(--op-del-bg); }
        .swagger-ui .opblock.opblock-delete .opblock-summary { border-color: var(--op-del-bd); }

        /* tag header */
        .swagger-ui .opblock-tag { border-bottom: 1px solid var(--border); }

        /* response wrapper & copy */
        .swagger-ui .responses-wrapper,
        .swagger-ui .response-col_description .response-col_description__inner,
        .swagger-ui .opblock-section .response-col_description { background: transparent; }
        .swagger-ui .copy-to-clipboard { background: var(--bg-raised); border: 1px solid var(--border); border-radius: 4px; }
        .swagger-ui .copy-to-clipboard button { background: transparent; color: var(--text-muted); }

        /* ── models ── */
        .swagger-ui section.models {
            border: 1px solid var(--border);
            background: var(--bg-raised);
        }
        .swagger-ui section.models.is-open h4 { border-bottom: 1px solid var(--border); }
        .swagger-ui .model-container { background: var(--bg-raised); }
        .swagger-ui .model-box { background: var(--bg); border-color: var(--border); }

        /* ── tables ── */
        .swagger-ui .table-container { background: var(--bg-table); }
        .swagger-ui table tbody tr td { border-bottom: 1px solid var(--border); padding: 10px 0; }
        .swagger-ui .responses-table tbody tr td { border-bottom: none; padding: 12px 0; }

        /* ── inputs ── */
        .swagger-ui input[type=text],
        .swagger-ui input[type=password],
        .swagger-ui input[type=search],
        .swagger-ui input[type=email],
        .swagger-ui input[type=file],
        .swagger-ui textarea,
        .swagger-ui select {
            background: var(--bg-input);
            border: 1px solid var(--border);
            color: var(--text);
            border-radius: 4px;
        }
        .swagger-ui input::placeholder,
        .swagger-ui textarea::placeholder { color: var(--text-muted); }

        /* ── buttons ── */
        .swagger-ui .btn {
            background: var(--bg-input);
            border: 1px solid var(--border);
            color: var(--text);
            box-shadow: none;
        }
        .swagger-ui .btn:hover { background: var(--bg-raised); }
        .swagger-ui .btn.execute {
            background: var(--accent);
            border-color: var(--accent);
            color: #fff;
        }
        .swagger-ui .btn.btn-clear { background: transparent; border-color: var(--border); }
        .swagger-ui .btn.authorize {
            color: var(--accent);
            border-color: var(--accent);
            background: transparent;
        }
        .swagger-ui .btn.authorize svg { fill: var(--accent); }

        /* auth dialog */
        .swagger-ui .dialog-ux .modal-ux {
            background: var(--bg);
            border: 1px solid var(--border);
        }
        .swagger-ui .dialog-ux .modal-ux-header { border-bottom: 1px solid var(--border); }
        .swagger-ui .dialog-ux .modal-ux-header h3 { color: var(--text); }
        .swagger-ui .dialog-ux .modal-ux-content p,
        .swagger-ui .dialog-ux .modal-ux-content h4 { color: var(--text); }
        .swagger-ui .dialog-ux .backdrop-ux { background: var(--backdrop); }

        /* auth lock icon */
        .swagger-ui .authorization__btn svg { fill: var(--text-muted); }
        .swagger-ui .authorization__btn.locked svg { fill: var(--accent); }

        /* tab active */
        .swagger-ui .tab li.active { color: var(--text); }
        .swagger-ui .tab li { color: var(--text-muted); }

        /* response codes */
        .swagger-ui .responses-table .response-col_status { color: var(--text); }
        .swagger-ui .response-col_description__inner p { color: var(--text-muted); }

        /* expand arrows */
        .swagger-ui svg.arrow,
        .swagger-ui button.model-box-control svg { fill: var(--text-muted); }

        /* loading */
        .swagger-ui .loading-container .loading::after { color: var(--text-muted); }

        /* scrollbar */
        .swagger-ui ::-webkit-scrollbar { width: 6px; height: 6px; }
        .swagger-ui ::-webkit-scrollbar-track { background: var(--bg); }
        .swagger-ui ::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 3px; }

        .onboarding-overlay {
            position: fixed;
            inset: 0;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: var(--backdrop);
            backdrop-filter: blur(4px);
        }
        .onboarding-overlay[hidden] { display: none; }
        .onboarding-dialog {
            width: min(520px, 100%);
            overflow: hidden;
            border: 1px solid var(--border);
            border-radius: 12px;
            background: var(--bg-raised);
            box-shadow: 0 20px 50px rgba(0, 0, 0, .3);
            color: var(--text);
        }
        .onboarding-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            padding: 14px 20px;
            border-bottom: 1px solid var(--border);
        }
        .onboarding-title { margin: 0; font-size: 15px; }
        .onboarding-caption { margin-top: 3px; color: var(--text-muted); font-size: 12px; }
        .onboarding-close {
            border: 0;
            background: transparent;
            color: var(--text-muted);
            cursor: pointer;
            font-size: 20px;
            line-height: 1;
        }
        .onboarding-body { padding: 20px; }
        .onboarding-marketing {
            margin: 0 auto 18px;
            max-width: 500px;
            color: var(--text);
            font-size: clamp(20px, 3vw, 26px);
            font-weight: 700;
            letter-spacing: -.035em;
            line-height: 1.16;
            text-align: center;
        }
        .onboarding-media {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 28px;
            height: 116px;
            margin-bottom: 18px;
            overflow: hidden;
            border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
            border-radius: 12px;
            background:
                radial-gradient(circle at 28% 20%, color-mix(in srgb, var(--accent) 30%, transparent), transparent 34%),
                var(--bg);
        }
        .onboarding-media::before {
            content: '';
            position: absolute;
            width: 170px;
            border-top: 1px dashed var(--accent);
            opacity: .5;
        }
        .onboarding-node {
            z-index: 1;
            display: grid;
            place-items: center;
            width: 42px;
            height: 42px;
            border: 1px solid var(--border);
            border-radius: 14px;
            background: var(--bg-raised);
            color: var(--accent);
            font-weight: 700;
            box-shadow: 0 8px 24px color-mix(in srgb, var(--accent) 18%, transparent);
        }
        .onboarding-node:nth-child(2) {
            width: 58px;
            height: 58px;
            border-color: var(--accent);
            transform: rotate(-5deg);
        }
        .onboarding-body p {
            margin: 0;
            color: var(--text-muted);
            font-size: 14px;
            line-height: 1.6;
        }
        .onboarding-body ul {
            display: grid;
            gap: 10px;
            margin: 18px 0;
            padding-left: 20px;
            color: var(--text);
            font-size: 13px;
            line-height: 1.5;
        }
        .onboarding-next {
            padding: 12px 14px;
            border: 1px solid var(--border);
            border-radius: 8px;
            background: var(--bg);
            color: var(--text-muted);
            font-size: 13px;
            line-height: 1.5;
        }
        .onboarding-next strong { color: var(--text); }
        .onboarding-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 12px 20px;
            border-top: 1px solid var(--border);
        }
        .onboarding-disable {
            border: 0;
            background: transparent;
            color: var(--text-muted);
            cursor: pointer;
            font-size: 12px;
        }
        .onboarding-disable:hover { color: var(--text); text-decoration: underline; }
        .onboarding-primary {
            padding: 8px 14px;
            border: 0;
            border-radius: 7px;
            background: var(--accent);
            color: #fff;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
        }
    </style>
    <script>
        (function() {
            var stored = localStorage.getItem('swagger-theme') || 'system';
            var resolved = stored;
            if (stored === 'system') {
                resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            document.documentElement.setAttribute('data-theme', resolved);
        })();
    </script>
</head>
<body>
    <div
        id="page-onboarding"
        class="onboarding-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        @if ($onboardingVersion >= 3 || $onboardingDisabled) hidden @endif
    >
        <div class="onboarding-dialog">
            <div class="onboarding-header">
                <div>
                    <h2 id="onboarding-title" class="onboarding-title">Use the API documentation</h2>
                    <div class="onboarding-caption">First visit guide</div>
                </div>
                <button type="button" class="onboarding-close" aria-label="Close">&times;</button>
            </div>
            <div class="onboarding-body">
                <h3 class="onboarding-marketing">
                    Connect Puppetflow to any tool and let your automations travel further.
                </h3>
                <div class="onboarding-media" aria-hidden="true">
                    <span class="onboarding-node">API</span>
                    <span class="onboarding-node">↗</span>
                    <span class="onboarding-node">{ }</span>
                </div>
                <p>This interactive reference explains how to connect external tools to Puppetflow.</p>
                <ul>
                    <li>Browse endpoints grouped by resource</li>
                    <li>Review request parameters and response schemas</li>
                    <li>Authorize with an API key and try requests</li>
                </ul>
                <div class="onboarding-next">
                    <strong>Suggested first step:</strong> Create an API key from your profile, then use Authorize above.
                </div>
            </div>
            <div class="onboarding-footer">
                <button type="button" class="onboarding-disable">Don't show these messages</button>
                <button type="button" class="onboarding-primary">Got it</button>
            </div>
        </div>
    </div>

    <div class="toolbar">
        <a href="{{ route('profile') }}" class="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to profile
        </a>
        <div class="theme-switcher">
            <button class="theme-btn" data-set-theme="light" title="Light">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            </button>
            <button class="theme-btn" data-set-theme="system" title="System">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            </button>
            <button class="theme-btn" data-set-theme="dark" title="Dark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            </button>
        </div>
    </div>

    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
        SwaggerUIBundle({
            url: "{{ route('api.docs.spec') }}",
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
            layout: 'BaseLayout',
        });

        (function() {
            var stored = localStorage.getItem('swagger-theme') || 'system';
            var btns = document.querySelectorAll('.theme-btn');
            var mq = window.matchMedia('(prefers-color-scheme: dark)');

            function resolve(pref) {
                if (pref === 'system') return mq.matches ? 'dark' : 'light';
                return pref;
            }

            function apply(pref) {
                stored = pref;
                localStorage.setItem('swagger-theme', pref);
                document.documentElement.setAttribute('data-theme', resolve(pref));
                btns.forEach(function(b) {
                    b.classList.toggle('active', b.getAttribute('data-set-theme') === pref);
                });
            }

            btns.forEach(function(b) {
                b.addEventListener('click', function() {
                    apply(b.getAttribute('data-set-theme'));
                });
            });

            mq.addEventListener('change', function() {
                if (stored === 'system') {
                    document.documentElement.setAttribute('data-theme', resolve('system'));
                }
            });

            apply(stored);
        })();

        (function() {
            var onboarding = document.getElementById('page-onboarding');
            if (!onboarding || onboarding.hidden) return;

            var completed = false;
            function persistOnboarding(key, version) {
                if (completed) return;
                completed = true;
                onboarding.hidden = true;

                fetch("{{ route('profile.onboarding') }}", {
                    method: 'PATCH',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({ key: key, version: version }),
                }).catch(function() {});
            }

            function completeOnboarding() {
                persistOnboarding('api.docs', 3);
            }

            onboarding.querySelector('.onboarding-close').addEventListener('click', completeOnboarding);
            onboarding.querySelector('.onboarding-primary').addEventListener('click', completeOnboarding);
            onboarding.querySelector('.onboarding-disable').addEventListener('click', function() {
                persistOnboarding('onboarding.disabled', 1);
            });
            onboarding.addEventListener('click', function(event) {
                if (event.target === onboarding) completeOnboarding();
            });
            document.addEventListener('keydown', function(event) {
                if (event.key === 'Escape') completeOnboarding();
            });
            onboarding.querySelector('.onboarding-primary').focus();
        })();
    </script>
</body>
</html>
