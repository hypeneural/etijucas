**Denuncias**
Documento de especificacao e melhorias para o modulo de denuncias cidadas.

**Objetivo**
Definir o que precisa melhorar, como estruturar a base de dados e quais endpoints garantem envio seguro e simples para o usuario logado, com foco em localizacao e upload de fotos.

**Estado Atual**
- OpenAPI define `POST /api/v1/reports` e `GET /api/v1/users/me/reports` em `contracts/openapi.yaml`, com imagens em base64 no JSON.
- Frontend usa `ENDPOINTS.reports.myReports = /reports/me` em `apps/web/src/api/config.ts`.
- DTO atual usa `fotos?: string[]` em `apps/web/src/types/api.types.ts`, sem upload binario.

**Melhorias Prioritarias**
- Alinhar caminho do endpoint de "minhas denuncias" entre frontend e backend.
- Trocar upload de imagens em base64 por `multipart/form-data`.
- Limitar a 3 imagens, com compressao para economizar storage.
- Garantir fluxo simples e seguro para usuario logado, com idempotencia e rate limit.
- Unificar modelo de dados e status, incluindo historico basico de mudancas.

**Base De Dados**
Tabela `reports`
| Campo | Tipo | Notas |
| --- | --- | --- |
| id | uuid | PK |
| user_id | uuid | FK users |
| category_id | uuid | FK report_categories |
| bairro_id | uuid | FK bairros, opcional |
| title | string | resumo curto |
| description | text | descricao completa |
| status | string | `recebido`, `em_analise`, `resolvido`, `rejeitado` |
| protocol | string | ex: ETJ-000123 |
| address_text | string | endereco digitado pelo usuario |
| address_source | string | `gps`, `manual`, `mapa` |
| latitude | decimal(10,7) | opcional |
| longitude | decimal(10,7) | opcional |
| location_accuracy_m | integer | opcional |
| created_at | timestamp | |
| updated_at | timestamp | |
| resolved_at | timestamp | opcional |

Tabela `report_categories`
| Campo | Tipo | Notas |
| --- | --- | --- |
| id | uuid | PK |
| name | string | ex: Buraco, Iluminacao |
| slug | string | unico |
| icon | string | nome do icon |
| color | string | hex ou token |
| active | boolean | default true |
| sort_order | integer | |

Tabela `report_status_history` (opcional, mas recomendado)
| Campo | Tipo | Notas |
| --- | --- | --- |
| id | uuid | PK |
| report_id | uuid | FK reports |
| status | string | mesmo enum |
| note | string | observacao interna |
| created_at | timestamp | |
| created_by | uuid | admin ou sistema |

Imagens
- Usar `media` do Spatie Media Library para anexos.
- Colecao `report_images` associada ao modelo Report.
- Armazenar metadados: tamanho original, mime, largura, altura.

Indices recomendados
- `reports(user_id, created_at)`
- `reports(status, created_at)`
- `reports(bairro_id)`
- `reports(category_id)`

**Endpoints**
Recomendacao de padronizacao
- Escolher um caminho unico para "minhas denuncias" e alinhar front e OpenAPI.
- Sugestao: manter `/api/v1/reports/me` por consistencia com `apps/web/src/api/config.ts`.

Lista de endpoints
| Metodo | Path | Auth | Uso |
| --- | --- | --- | --- |
| POST | `/api/v1/reports` | auth | Criar denuncia |
| GET | `/api/v1/reports/me` | auth | Listar minhas denuncias |
| GET | `/api/v1/reports/{id}` | auth | Detalhe da denuncia (somente dono) |
| POST | `/api/v1/reports/{id}/media` | auth | Adicionar imagens (separado) |
| DELETE | `/api/v1/reports/{id}/media/{mediaId}` | auth | Remover imagem |
| PATCH | `/api/v1/reports/{id}/status` | admin | Atualizar status |
| GET | `/api/v1/report-categories` | public | Listar categorias |

Payload de criacao (multipart)
- `title`, `description`, `category_id`, `bairro_id` opcional
- `address_text` opcional
- `latitude`, `longitude`, `location_accuracy_m` opcionais
- `images[]` (ate 3 arquivos)
- Header `Idempotency-Key` obrigatorio para suportar offline

**Fluxo Do Usuario**
1. Escolhe categoria.
2. Informa localizacao.
3. Escreve descricao.
4. Adiciona ate 3 imagens.
5. Confirma e envia.
6. Recebe protocolo e status `recebido`.

**Localizacao**
- Permitir 3 modos: GPS, mapa (pin), endereco digitado.
- Sempre salvar `address_text` (mesmo quando houver lat/lng).
- Quando lat/lng existir, salvar `location_accuracy_m`.
- Se o usuario digitar endereco, opcionalmente geocodificar no backend (ex: Nominatim ou Google), sem bloquear o envio.

**Integracao Geocoding No Wizard**
Regra de ouro: nunca chamar o provedor direto do front com a key solta. Use um backend-proxy com debounce, cache e rate limit.

Arquitetura simples e robusta
- Backend-proxy para `autocomplete` e `reverse`.
- Debounce no autocomplete entre 250 e 350ms.
- Cache curto por query entre 5 e 30 minutos.
- Rate limit leve por IP ou sessao.
- Normalizacao do payload em um modelo interno unico.

Fluxo do wizard
1. Usar minha localizacao.
2. Captura `navigator.geolocation` e a precisao.
3. Chama `reverse` no backend e preenche o endereco.
4. Campo de busca chama `autocomplete` com bias na posicao atual (se existir).
5. Selecionou sugestao, fixa o pin e mostra o endereco final.
6. Pin arrastavel, no `dragend` chama `reverse` e atualiza o endereco.
7. Edicao manual sempre disponivel.

Qualidade da localizacao
- Precisa: GPS + reverse com boa confianca.
- Aproximada: autocomplete ou geocode sem alta confianca.
- Manual: usuario editou o endereco.

**Imagens (3 fotos, ate 15MB)**
- Limite: 3 imagens por denuncia.
- Tamanho bruto: permitir ate 15MB por imagem.
- Compressao no cliente: reduzir dimensao maxima (ex: 1920px) e qualidade (ex: 0.75).
- Compressao no servidor: gerar conversoes (`thumb`, `web`) e descartar EXIF.
- Armazenamento: manter original apenas se necessario; caso contrario, manter somente a versao otimizada.

**Seguranca E Anti-Abuso**
- Auth obrigatorio via Sanctum.
- Rate limit por usuario e por IP (ex: 5/min, 30/dia).
- Idempotency-Key para evitar duplicacao.
- Validacao forte de campos e arquivos.
- Sanitizar texto (XSS) e remover EXIF das fotos.
- Auditoria basica: `report_status_history` para rastrear mudancas.

**Acompanhamento Do Usuario**
- Tela "Minhas Denuncias" deve listar apenas `reports.user_id = auth_user`.
- Exibir status e historico basico.
- Permitir cancelamento enquanto status = `recebido` (opcional).

**Ajustes Necessarios No Front**
- Trocar `CreateReportDTO.fotos: string[]` por `File[]` ou `Blob[]`.
- Enviar `FormData` no `report.service.ts`.
- Alinhar path de "minhas denuncias" com o backend.

**Ajustes Necessarios No Back**
- Criar `Report` model + migration.
- Implementar upload via Media Library.
- Implementar endpoints listados e policies.
- Atualizar `contracts/openapi.yaml` para `multipart/form-data`.

**Criterios De Aceite**
- Usuario logado consegue enviar denuncia em menos de 1 minuto.
- Maximo de 3 imagens, com compressao automatica.
- Relatorio aparece em "Minhas Denuncias" com status correto.
- Envio offline reprocessa com Idempotency-Key sem duplicar.
