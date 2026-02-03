<div class="space-y-4">
    <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <h3 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Autor</h3>
        <p class="text-gray-900 dark:text-white">
            @if($comment->is_anon)
                <span class="text-gray-500 italic">Anônimo</span>
            @else
                {{ $comment->user?->nome ?? 'Usuário removido' }}
            @endif
        </p>
    </div>

    <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <h3 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Comentário</h3>
        <p class="text-gray-900 dark:text-white whitespace-pre-wrap">{{ $comment->texto }}</p>
    </div>

    @if($comment->image_url)
        <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <h3 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Imagem</h3>
            <img src="{{ $comment->image_url }}" alt="Imagem do comentário" class="max-w-full h-auto rounded">
        </div>
    @endif

    <div class="grid grid-cols-2 gap-4">
        <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <h3 class="font-semibold text-gray-700 dark:text-gray-300 mb-1">Likes</h3>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ $comment->likes_count ?? 0 }}</p>
        </div>
        <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <h3 class="font-semibold text-gray-700 dark:text-gray-300 mb-1">Nível</h3>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ $comment->depth ?? 0 }}</p>
        </div>
    </div>

    <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <h3 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Data</h3>
        <p class="text-gray-900 dark:text-white">{{ $comment->created_at?->format('d/m/Y H:i:s') }}</p>
    </div>
</div>