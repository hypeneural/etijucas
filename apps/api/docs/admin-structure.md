# Estrutura do Admin (Filament)

## Objetivo
Padronizar a organizacao do painel administrativo para facilitar escalabilidade e manutencao.

## Estrutura de pastas

```
app/Filament/Admin/
  Pages/
  Resources/
  Widgets/
```

### Padrao de Resource

```
app/Filament/Admin/Resources/<Module>Resource.php
app/Filament/Admin/Resources/<Module>Resource/Pages/
app/Filament/Admin/Resources/<Module>Resource/RelationManagers/  (quando necessario)
```

### Padrao de dominio

```
app/Domain/<Modulo>/Enums/
app/Domain/<Modulo>/...
```

## Navigation Groups

1) Acesso & Usuarios
2) Moderacao
3) Conteudo
4) Sistema & Auditoria

Use `protected static ?string $navigationGroup` e `protected static ?int $navigationSort` em cada Resource/Page.

## Convencoes de permissao

- Padrao do Shield: `view`, `view_any`, `create`, `update`, `delete`, etc.
- Permissoes custom para modulos fora do Filament: `module.action`.
- Admin (role) e o super-admin do Shield.
- Moderador nao recebe permissoes de gerenciamento de roles globais.

## Boas praticas

- Sempre usar `with()` e `withCount()` para evitar N+1.
- Definir filtros e ordenacao no nivel de Resource.
- Preferir enums para status e tipos.
- Manter a regra de acesso no Model/Policies (evitar if admin espalhado).

## Como adicionar novo modulo

1) Criar enums e modelos em `app/Domain/<Modulo>` e `app/Models`.
2) Criar migration com indices adequados.
3) Criar Resource + Pages em `app/Filament/Admin/Resources`.
4) Ajustar navigation group e sort.
5) Registrar/gerar permissoes com Shield.
6) (Opcional) adicionar widgets ao Dashboard.

## Exemplo rapido

```
php artisan make:filament-resource Evento --panel=admin
```

Ajuste o arquivo gerado para usar o namespace `App\Filament\Admin\Resources`.
