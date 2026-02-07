<x-filament-panels::page>
    <div class="space-y-6">
        <div class="rounded-xl border border-gray-200 bg-white p-4">
            <h3 class="text-sm font-semibold text-gray-900">Rollout em massa</h3>
            <p class="mt-1 text-xs text-gray-500">
                Aplica estado on/off de um modulo para multiplas cidades.
            </p>

            <div class="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                    <label class="mb-1 block text-xs font-medium text-gray-700">Modulo (key)</label>
                    <input
                        type="text"
                        wire:model.defer="module"
                        class="w-full rounded-lg border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                        placeholder="forum"
                    />
                </div>

                <div>
                    <label class="mb-1 block text-xs font-medium text-gray-700">Estado</label>
                    <select
                        wire:model.defer="state"
                        class="w-full rounded-lg border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                        <option value="on">on</option>
                        <option value="off">off</option>
                    </select>
                </div>

                <div>
                    <label class="mb-1 block text-xs font-medium text-gray-700">Somente cidades (CSV)</label>
                    <input
                        type="text"
                        wire:model.defer="cities"
                        class="w-full rounded-lg border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                        placeholder="tijucas-sc,outra-cidade"
                    />
                </div>

                <div>
                    <label class="mb-1 block text-xs font-medium text-gray-700">Exceto cidades (CSV)</label>
                    <input
                        type="text"
                        wire:model.defer="except"
                        class="w-full rounded-lg border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                        placeholder="cidade-excecao"
                    />
                </div>
            </div>

            <div class="mt-3 flex items-center gap-2">
                <input id="dry-run" type="checkbox" wire:model.defer="dryRun" class="rounded border-gray-300">
                <label for="dry-run" class="text-xs text-gray-700">Dry-run</label>
            </div>

            <div class="mt-4">
                <x-filament::button wire:click="runRollout">
                    Executar rollout
                </x-filament::button>
            </div>
        </div>

        <div class="rounded-xl border border-gray-200 bg-white p-4">
            <h3 class="text-sm font-semibold text-gray-900">Rollback</h3>
            <p class="mt-1 text-xs text-gray-500">
                Reverte um rollout anterior usando o rollout_id auditado.
            </p>

            <div class="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                    type="text"
                    wire:model.defer="rollbackId"
                    class="w-full rounded-lg border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="uuid-do-rollout"
                />
                <x-filament::button color="gray" wire:click="runRollback">
                    Executar rollback
                </x-filament::button>
            </div>
        </div>

        @if ($output)
            <div class="rounded-xl border border-gray-200 bg-gray-900 p-4">
                <pre class="overflow-x-auto text-xs text-gray-100">{{ $output }}</pre>
            </div>
        @endif
    </div>
</x-filament-panels::page>
