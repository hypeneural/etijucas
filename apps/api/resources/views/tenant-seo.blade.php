<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }}</title>
    <meta name="description" content="{{ $description }}">
    <meta name="robots" content="{{ $robots }}">
    <link rel="canonical" href="{{ $canonicalUrl }}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="{{ $title }}">
    <meta property="og:description" content="{{ $description }}">
    <meta property="og:url" content="{{ $canonicalUrl }}">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; padding: 2rem; background: #f7fafc; color: #0f172a; }
        .container { max-width: 960px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 2rem; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); }
        h1 { margin-top: 0; font-size: 1.8rem; }
        p { line-height: 1.5; }
        .meta { color: #475569; font-size: 0.95rem; margin-bottom: 1.5rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; margin: 1rem 0 2rem; }
        .card { display: block; padding: 0.8rem 1rem; border: 1px solid #e2e8f0; border-radius: 10px; text-decoration: none; color: #0f172a; background: #f8fafc; }
        .card small { display: block; color: #64748b; margin-top: 0.25rem; }
        .muted { color: #64748b; font-size: 0.95rem; }
        footer { margin-top: 2rem; font-size: 0.85rem; color: #64748b; }
    </style>
</head>
<body>
<main class="container">
    <h1>{{ $heading }}</h1>
    <p class="meta">{{ $intro }}</p>

    @if (!$moduleEnabled)
        <p class="muted">Modulo indisponivel para {{ $cityLabel }}. Tente novamente mais tarde.</p>
    @endif

    @if (!empty($publicLinks))
        <section aria-label="Rotas publicas">
            <h2>Paginas publicas</h2>
            <nav class="grid">
                @foreach ($publicLinks as $link)
                    <a class="card" href="{{ rtrim($cityBaseUrl, '/') }}/{{ ltrim($link['href'], '/') }}">{{ $link['label'] }}</a>
                @endforeach
            </nav>
        </section>
    @endif

    @if (!empty($highlights))
        <section aria-label="Destaques">
            <h2>Destaques</h2>
            <div class="grid">
                @foreach ($highlights as $item)
                    <a class="card" href="{{ rtrim($cityBaseUrl, '/') }}/{{ ltrim($item['href'], '/') }}">
                        {{ $item['title'] }}
                        @if (!empty($item['meta']))
                            <small>{{ $item['meta'] }}</small>
                        @endif
                    </a>
                @endforeach
            </div>
        </section>
    @endif

    <footer>
        Conteudo server-rendered para indexacao por cidade.
    </footer>
</main>
</body>
</html>
