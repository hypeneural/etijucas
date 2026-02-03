#!/usr/bin/env node
/**
 * make-crud.js
 *
 * Scaffold a full CRUD feature (backend + frontend) with minimal boilerplate.
 *
 * Usage:
 *   pnpm make:crud --feature=forum --model=Topic --fields="title:string, content:text, user_id:foreign:users"
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const readline = require('readline');

const ROOT = path.join(__dirname, '..');
const API_ROOT = path.join(ROOT, 'apps', 'api');
const WEB_ROOT = path.join(ROOT, 'apps', 'web');

const FEATURES_YAML = path.join(ROOT, 'contracts', 'features.yaml');
const OPENAPI_YAML = path.join(ROOT, 'contracts', 'openapi.yaml');
const API_ROUTES = path.join(API_ROOT, 'routes', 'api.php');

const FRONT_FEATURES = path.join(WEB_ROOT, 'src', 'features');
const STUBS_DIR = path.join(ROOT, 'tools', 'stubs');

function parseArgs(argv) {
    const args = {};
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (!arg.startsWith('--')) {
            continue;
        }
        const raw = arg.slice(2);
        if (raw.includes('=')) {
            const [key, value] = raw.split('=');
            args[key] = value;
        } else {
            const next = argv[i + 1];
            if (next && !next.startsWith('--')) {
                args[raw] = next;
                i++;
            } else {
                args[raw] = true;
            }
        }
    }
    return args;
}

function prompt(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

function toKebab(str) {
    return str
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[_\s]+/g, '-')
        .toLowerCase();
}

function toSnake(str) {
    return str
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[-\s]+/g, '_')
        .toLowerCase();
}

function toCamel(str) {
    const s = str
        .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
        .replace(/^(.)/, (m) => m.toLowerCase());
    return s;
}

function toPascal(str) {
    const camel = toCamel(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function pluralize(str) {
    if (/(s|x|z|ch|sh)$/i.test(str)) {
        return `${str}es`;
    }
    if (str.endsWith('y') && !/[aeiou]y$/i.test(str)) {
        return `${str.slice(0, -1)}ies`;
    }
    return `${str}s`;
}

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`  ✅ Created: ${path.relative(ROOT, dirPath)}`);
    }
}

function writeFileSafe(filePath, content, force = false) {
    if (fs.existsSync(filePath) && !force) {
        console.log(`  ⚠️  Skipped (exists): ${path.relative(ROOT, filePath)}`);
        return false;
    }
    fs.writeFileSync(filePath, content);
    console.log(`  ✅ Created: ${path.relative(ROOT, filePath)}`);
    return true;
}

function loadStub(relativePath) {
    const fullPath = path.join(STUBS_DIR, relativePath);
    return fs.readFileSync(fullPath, 'utf8');
}

function renderTemplate(template, variables) {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
        const token = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(token, value);
    }
    return result;
}

function parseFields(input) {
    if (!input) {
        return [];
    }

    return input
        .split(',')
        .map((raw) => raw.trim())
        .filter(Boolean)
        .map((raw) => {
            const parts = raw.split(':').map((p) => p.trim());
            let name = parts[0];
            let nullable = false;
            if (name.endsWith('?')) {
                nullable = true;
                name = name.slice(0, -1);
            }

            let type = parts[1] || 'string';
            if (type.endsWith('?')) {
                nullable = true;
                type = type.slice(0, -1);
            }

            const meta = parts.slice(2);

            return {
                raw,
                name,
                snake: toSnake(name),
                camel: toCamel(name),
                pascal: toPascal(name),
                type: type.toLowerCase(),
                nullable,
                meta,
            };
        });
}

function inferForeignTable(field) {
    const base = field.snake.endsWith('_id') ? field.snake.slice(0, -3) : field.snake;
    return pluralize(base);
}

function buildMigrationFields(fields, useUuids, useSoftDeletes) {
    const lines = [];

    if (useUuids) {
        lines.push("$table->uuid('id')->primary();");
    } else {
        lines.push("$table->id();");
    }

    for (const field of fields) {
        let line = null;

        if (field.type === 'foreign') {
            const table = field.meta[0] || inferForeignTable(field);
            const foreignMethod = useUuids ? 'foreignUuid' : 'foreignId';
            line = `$table->${foreignMethod}('${field.snake}')`;
            if (field.nullable) {
                line += '->nullable()';
            }
            line += `->constrained('${table}')`;
            line += field.nullable ? '->nullOnDelete()' : '->cascadeOnDelete()';
        } else if (field.type === 'string') {
            line = `$table->string('${field.snake}')`;
        } else if (field.type === 'text') {
            line = `$table->text('${field.snake}')`;
        } else if (field.type === 'integer' || field.type === 'int') {
            line = `$table->integer('${field.snake}')`;
        } else if (field.type === 'biginteger' || field.type === 'bigint') {
            line = `$table->bigInteger('${field.snake}')`;
        } else if (field.type === 'boolean' || field.type === 'bool') {
            line = `$table->boolean('${field.snake}')`;
            if (!field.nullable) {
                line += '->default(false)';
            }
        } else if (field.type === 'date') {
            line = `$table->date('${field.snake}')`;
        } else if (field.type === 'datetime') {
            line = `$table->dateTime('${field.snake}')`;
        } else if (field.type === 'timestamp') {
            line = `$table->timestamp('${field.snake}')`;
        } else if (field.type === 'json') {
            line = `$table->json('${field.snake}')`;
        } else if (field.type === 'uuid') {
            line = `$table->uuid('${field.snake}')`;
        } else if (field.type === 'decimal') {
            const precision = Number(field.meta[0] || 10);
            const scale = Number(field.meta[1] || 2);
            line = `$table->decimal('${field.snake}', ${precision}, ${scale})`;
        } else {
            line = `$table->string('${field.snake}')`;
        }

        if (line && field.nullable && field.type !== 'foreign' && field.type !== 'boolean') {
            line += '->nullable()';
        }

        if (line) {
            lines.push(`${line};`);
        }
    }

    if (useSoftDeletes) {
        lines.push('$table->softDeletes();');
    }
    lines.push('$table->timestamps();');

    return lines.map((l) => `            ${l}`).join('\n');
}

function buildFillable(fields) {
    return fields.map((field) => `        '${field.snake}',`).join('\n');
}

function buildCasts(fields) {
    const lines = [];
    for (const field of fields) {
        if (field.type === 'boolean' || field.type === 'bool') {
            lines.push(`        '${field.snake}' => 'boolean',`);
        } else if (field.type === 'integer' || field.type === 'int') {
            lines.push(`        '${field.snake}' => 'integer',`);
        } else if (field.type === 'biginteger' || field.type === 'bigint') {
            lines.push(`        '${field.snake}' => 'integer',`);
        } else if (field.type === 'decimal' || field.type === 'float') {
            lines.push(`        '${field.snake}' => 'float',`);
        } else if (field.type === 'json') {
            lines.push(`        '${field.snake}' => 'array',`);
        } else if (field.type === 'date' || field.type === 'datetime' || field.type === 'timestamp') {
            lines.push(`        '${field.snake}' => 'datetime',`);
        }
    }
    if (lines.length === 0) {
        return '        //';
    }
    return lines.join('\n');
}

function buildValidationRules(fields, isUpdate) {
    const lines = [];
    let needsRule = false;

    for (const field of fields) {
        const rules = [];
        if (isUpdate) {
            rules.push('sometimes');
            if (field.nullable) {
                rules.push('nullable');
            }
        } else {
            rules.push(field.nullable ? 'nullable' : 'required');
        }

        if (field.type === 'string' || field.type === 'text') {
            rules.push('string');
        } else if (field.type === 'integer' || field.type === 'int' || field.type === 'biginteger' || field.type === 'bigint') {
            rules.push('integer');
        } else if (field.type === 'decimal' || field.type === 'float') {
            rules.push('numeric');
        } else if (field.type === 'boolean' || field.type === 'bool') {
            rules.push('boolean');
        } else if (field.type === 'uuid') {
            rules.push('uuid');
        } else if (field.type === 'date' || field.type === 'datetime' || field.type === 'timestamp') {
            rules.push('date');
        } else if (field.type === 'json') {
            rules.push('array');
        } else if (field.type === 'foreign') {
            rules.push('uuid');
            const table = field.meta[0] || inferForeignTable(field);
            rules.push(`Rule::exists('${table}', 'id')`);
            needsRule = true;
        } else if (field.type === 'enum') {
            const values = field.meta[0] ? field.meta[0].split('|').map((v) => v.trim()) : [];
            if (values.length > 0) {
                rules.push(`Rule::in(${JSON.stringify(values)})`);
                needsRule = true;
            } else {
                rules.push('string');
            }
        } else {
            rules.push('string');
        }

        const ruleLines = rules.map((rule) => `                '${rule}',`).join('\n');
        lines.push(`            '${field.camel}' => [\n${ruleLines}\n            ],`);
    }

    return { rules: lines.join('\n'), needsRule };
}

function buildPrepareForValidation(fields) {
    if (fields.length === 0) {
        return '        //';
    }
    const lines = [];
    lines.push('        $data = [];');
    for (const field of fields) {
        lines.push(`        if ($this->has('${field.camel}')) {`);
        lines.push(`            $data['${field.snake}'] = $this->input('${field.camel}');`);
        lines.push('        }');
    }
    lines.push('');
    lines.push('        if (!empty($data)) {');
    lines.push('            $this->merge($data);');
    lines.push('        }');
    return lines.join('\n');
}

function buildStoreMapping(fields) {
    if (fields.length === 0) {
        return '            //';
    }
    const lines = [];
    for (const field of fields) {
        const key = field.snake;
        const val = `$validated['${field.camel}']`;
        if (field.nullable) {
            lines.push(`            '${key}' => array_key_exists('${field.camel}', $validated) ? ${val} : null,`);
        } else {
            lines.push(`            '${key}' => ${val},`);
        }
    }
    return lines.join('\n');
}

function buildUpdateMapping(fields) {
    if (fields.length === 0) {
        return '        //';
    }
    const lines = [];
    for (const field of fields) {
        lines.push(`        if (array_key_exists('${field.camel}', $validated)) {`);
        lines.push(`            $updateData['${field.snake}'] = $validated['${field.camel}'];`);
        lines.push('        }');
    }
    return lines.join('\n');
}

function buildResourceFields(fields) {
    const lines = [];
    for (const field of fields) {
        const key = field.camel;
        let value = `$this->${field.snake}`;
        if (field.type === 'date' || field.type === 'datetime' || field.type === 'timestamp') {
            value = `$this->${field.snake}?->toIso8601String()`;
        }
        lines.push(`            '${key}' => ${value},`);
    }
    return lines.join('\n');
}

function buildZodFields(fields) {
    const lines = [];
    for (const field of fields) {
        let zod = 'z.string()';
        if (field.type === 'text' || field.type === 'string') {
            zod = 'z.string()';
        } else if (field.type === 'boolean' || field.type === 'bool') {
            zod = 'z.boolean()';
        } else if (field.type === 'integer' || field.type === 'int' || field.type === 'biginteger' || field.type === 'bigint') {
            zod = 'z.number()';
        } else if (field.type === 'decimal' || field.type === 'float') {
            zod = 'z.number()';
        } else if (field.type === 'uuid') {
            zod = 'z.string().uuid()';
        } else if (field.type === 'foreign') {
            zod = 'z.string().uuid()';
        } else if (field.type === 'json') {
            zod = 'z.any()';
        } else if (field.type === 'enum') {
            const values = field.meta[0] ? field.meta[0].split('|').map((v) => v.trim()) : [];
            if (values.length > 0) {
                zod = `z.enum(${JSON.stringify(values)})`;
            } else {
                zod = 'z.string()';
            }
        } else {
            zod = 'z.string()';
        }

        if (field.nullable) {
            zod = `${zod}.optional()`;
        }

        lines.push(`  ${field.camel}: ${zod},`);
    }
    return lines.join('\n');
}

function buildFormFields(fields) {
    const lines = [];
    for (const field of fields) {
        let control = '<Input {...field} />';
        if (field.type === 'text') {
            control = '<Textarea {...field} />';
        } else if (field.type === 'boolean' || field.type === 'bool') {
            control = '<Switch checked={field.value} onCheckedChange={field.onChange} />';
        } else if (field.type === 'integer' || field.type === 'int' || field.type === 'decimal' || field.type === 'float') {
            control = '<Input type="number" {...field} />';
        }

        lines.push(`          <FormField
            control={form.control}
            name="${field.camel}"
            render={({ field }) => (
              <FormItem>
                <FormLabel>${field.pascal}</FormLabel>
                <FormControl>
                  ${control}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />`);
    }
    return lines.join('\n\n');
}

function updateFeaturesYaml(feature, model, table, routeSegment, authRequired) {
    if (!fs.existsSync(FEATURES_YAML)) {
        console.log('⚠️  contracts/features.yaml not found. Skipping update.');
        return;
    }

    const original = fs.readFileSync(FEATURES_YAML, 'utf8');
    const lines = original.split('\n');
    let headerEnd = 0;
    while (headerEnd < lines.length) {
        const line = lines[headerEnd].trim();
        if (line.startsWith('#') || line === '') {
            headerEnd += 1;
        } else {
            break;
        }
    }
    const header = lines.slice(0, headerEnd).join('\n').trimEnd();
    const body = lines.slice(headerEnd).join('\n');

    const data = yaml.parse(body) || {};
    data.features = data.features || {};

    if (!data.features[feature]) {
        data.features[feature] = {
            screens: [
                `${model}ListPage`,
                `${model}CreatePage`,
                `${model}EditPage`,
            ],
            api: [
                `GET /api/v1/${routeSegment}`,
                `POST /api/v1/${routeSegment}`,
                `GET /api/v1/${routeSegment}/{id}`,
                `PUT /api/v1/${routeSegment}/{id}`,
                `DELETE /api/v1/${routeSegment}/{id}`,
            ],
            tables: [table],
            permissions: {
                read: 'public',
                write: authRequired ? 'auth:sanctum' : 'public',
                mod: null,
            },
            offline: false,
        };
    }

    const output = `${header}\n${yaml.stringify(data, { indent: 2 })}`;
    fs.writeFileSync(FEATURES_YAML, output.trimEnd() + '\n');
    console.log(`  ✅ Updated: ${path.relative(ROOT, FEATURES_YAML)}`);
}

function updateOpenApi(routeSegment, featureTitle) {
    if (!fs.existsSync(OPENAPI_YAML)) {
        console.log('⚠️  contracts/openapi.yaml not found. Skipping update.');
        return;
    }

    const content = fs.readFileSync(OPENAPI_YAML, 'utf8');
    const listPath = `/api/v1/${routeSegment}`;
    const itemPath = `/api/v1/${routeSegment}/{id}`;

    if (content.includes(`  ${listPath}:`) || content.includes(`  ${itemPath}:`)) {
        console.log('  ⚠️  OpenAPI already has these paths. Skipping.');
        return;
    }

    const block = `
  ${listPath}:
    get:
      tags: [${featureTitle}]
      summary: List items
      responses:
        '200':
          description: List response
    post:
      tags: [${featureTitle}]
      summary: Create item
      responses:
        '201':
          description: Created

  ${itemPath}:
    get:
      tags: [${featureTitle}]
      summary: Get item
      responses:
        '200':
          description: Item response
    put:
      tags: [${featureTitle}]
      summary: Update item
      responses:
        '200':
          description: Updated
    delete:
      tags: [${featureTitle}]
      summary: Delete item
      responses:
        '200':
          description: Deleted
`;

    const marker = '\ncomponents:';
    if (!content.includes(marker)) {
        console.log('⚠️  Could not find "components:" in openapi.yaml. Skipping update.');
        return;
    }

    const updated = content.replace(marker, `${block}${marker}`);
    fs.writeFileSync(OPENAPI_YAML, updated);
    console.log(`  ✅ Updated: ${path.relative(ROOT, OPENAPI_YAML)}`);
}

function updateApiRoutes(routeSegment, feature, model, authRequired) {
    if (!fs.existsSync(API_ROUTES)) {
        console.log('⚠️  routes/api.php not found. Skipping update.');
        return;
    }

    const content = fs.readFileSync(API_ROUTES, 'utf8');
    const routePrefix = feature;

    const modelKebab = toKebab(model);
    const modelPlural = pluralize(modelKebab);
    const routeIsFeature = routeSegment === feature;
    const listPath = routeIsFeature ? '/' : modelPlural;
    const itemPath = routeIsFeature ? `/{${modelKebab}}` : `${modelPlural}/{${modelKebab}}`;

    const snippet = `
    // Generated CRUD: ${feature} ${model}
    Route::prefix('${routePrefix}')->group(function () {
        Route::get('${listPath}', [\\App\\Http\\Controllers\\Api\\${toPascal(feature)}\\${model}Controller::class, 'index']);
        Route::get('${itemPath}', [\\App\\Http\\Controllers\\Api\\${toPascal(feature)}\\${model}Controller::class, 'show']);
        Route::post('${listPath}', [\\App\\Http\\Controllers\\Api\\${toPascal(feature)}\\${model}Controller::class, 'store']);
        Route::put('${itemPath}', [\\App\\Http\\Controllers\\Api\\${toPascal(feature)}\\${model}Controller::class, 'update']);
        Route::delete('${itemPath}', [\\App\\Http\\Controllers\\Api\\${toPascal(feature)}\\${model}Controller::class, 'destroy']);
    });
`;

    if (content.includes(`Route::prefix('${routePrefix}')`) && content.includes(`${model}Controller`)) {
        console.log('  ⚠️  routes/api.php already references this feature/controller. Skipping.');
        return;
    }

    const marker = authRequired
        ? "Route::middleware('auth:sanctum')->group(function () {"
        : "Route::prefix('v1')->group(function () {";

    if (!content.includes(marker)) {
        console.log('⚠️  Could not find route group marker in api.php. Skipping.');
        return;
    }

    const updated = content.replace(marker, `${marker}\n${snippet}`);
    fs.writeFileSync(API_ROUTES, updated);
    console.log(`  ✅ Updated: ${path.relative(ROOT, API_ROUTES)}`);
}

async function main() {
    const args = parseArgs(process.argv.slice(2));

    const force = Boolean(args.force);
    const backend = args.backend !== 'false';
    const frontend = args.frontend !== 'false';
    const authRequired = args.auth !== 'false';
    const useUuids = args.uuids !== 'false';
    const useSoftDeletes = args['soft-deletes'] !== 'false';

    const featureInput = args.feature || await prompt('Feature (kebab-case): ');
    const modelInput = args.model || await prompt('Model (PascalCase): ');
    const fieldsInput = args.fields || await prompt('Fields (e.g. title:string, content:text, user_id:foreign:users): ');

    const feature = toKebab(featureInput.trim());
    const model = toPascal(modelInput.trim());
    const fields = parseFields(fieldsInput);

    if (!feature || !model) {
        console.log('❌ Missing required inputs.');
        process.exit(1);
    }

    const modelKebab = toKebab(model);
    const modelPlural = pluralize(modelKebab);
    const table = toSnake(pluralize(model));

    const routeSegment = feature === modelKebab || feature === modelPlural
        ? feature
        : `${feature}/${modelPlural}`;

    console.log(`\n🚀 Creating CRUD for ${model} (${feature})\n`);

    if (backend) {
        console.log('📦 Backend');

        const modelPath = path.join(API_ROOT, 'app', 'Models', `${model}.php`);
        const migrationName = `${new Date().toISOString().slice(0, 19).replace(/[-T:]/g, '_')}_create_${table}_table.php`;
        const migrationPath = path.join(API_ROOT, 'database', 'migrations', migrationName);
        const controllerDir = path.join(API_ROOT, 'app', 'Http', 'Controllers', 'Api', toPascal(feature));
        const controllerPath = path.join(controllerDir, `${model}Controller.php`);
        const requestDir = path.join(API_ROOT, 'app', 'Http', 'Requests', toPascal(feature));
        const storeRequestPath = path.join(requestDir, `Store${model}Request.php`);
        const updateRequestPath = path.join(requestDir, `Update${model}Request.php`);
        const resourceDir = path.join(API_ROOT, 'app', 'Http', 'Resources', toPascal(feature));
        const resourcePath = path.join(resourceDir, `${model}Resource.php`);
        const collectionPath = path.join(resourceDir, `${model}Collection.php`);
        const policyPath = path.join(API_ROOT, 'app', 'Policies', `${model}Policy.php`);
        const testDir = path.join(API_ROOT, 'tests', 'Feature', toPascal(feature));
        const testPath = path.join(testDir, `${model}Test.php`);

        const domainDir = path.join(API_ROOT, 'app', 'Domains', toPascal(feature));
        const domainReadmePath = path.join(domainDir, 'README.php');
        const domainRoutesPath = path.join(domainDir, 'routes.php');

        ensureDir(path.dirname(modelPath));
        ensureDir(path.dirname(migrationPath));
        ensureDir(controllerDir);
        ensureDir(requestDir);
        ensureDir(resourceDir);
        ensureDir(path.dirname(policyPath));
        ensureDir(testDir);
        ensureDir(domainDir);

        const migrationFields = buildMigrationFields(fields, useUuids, useSoftDeletes);
        const fillable = buildFillable(fields);
        const casts = buildCasts(fields);
        const storeRules = buildValidationRules(fields, false);
        const updateRules = buildValidationRules(fields, true);
        const prepare = buildPrepareForValidation(fields);
        const storeMapping = buildStoreMapping(fields);
        const updateMapping = buildUpdateMapping(fields);
        const resourceFields = buildResourceFields(fields);

        const hasUserOwner = fields.some((field) => field.snake === 'user_id');
        const policyRule = hasUserOwner ? 'return $user->id === $' + toCamel(model) + '->user_id;' : 'return true;';

        writeFileSafe(
            modelPath,
            renderTemplate(loadStub('backend/model.stub.php'), {
                Model: model,
                softDeletesUse: useSoftDeletes ? 'use Illuminate\\\\Database\\\\Eloquent\\\\SoftDeletes;' : '',
                hasSoftDeletesTrait: useSoftDeletes ? ', SoftDeletes' : '',
                hasUuidsTrait: useUuids ? ', HasUuids' : '',
                uuidConfig: useUuids ? "    protected $keyType = 'string';\n    public $incrementing = false;\n" : '',
                fillable: fillable || '        //',
                casts: casts,
            }),
            force
        );

        writeFileSafe(
            migrationPath,
            renderTemplate(loadStub('backend/migration.stub.php'), {
                table,
                migrationFields,
            }),
            force
        );

        writeFileSafe(
            controllerPath,
            renderTemplate(loadStub('backend/controller.stub.php'), {
                Feature: toPascal(feature),
                Model: model,
                model: toCamel(model),
                storeMapping,
                updateMapping,
            }),
            force
        );

        writeFileSafe(
            storeRequestPath,
            renderTemplate(loadStub('backend/store-request.stub.php'), {
                Feature: toPascal(feature),
                Model: model,
                rules: storeRules.rules,
                ruleUse: storeRules.needsRule ? 'use Illuminate\\\\Validation\\\\Rule;' : '',
                prepare,
            }),
            force
        );

        writeFileSafe(
            updateRequestPath,
            renderTemplate(loadStub('backend/update-request.stub.php'), {
                Feature: toPascal(feature),
                Model: model,
                rules: updateRules.rules,
                ruleUse: updateRules.needsRule ? 'use Illuminate\\\\Validation\\\\Rule;' : '',
                prepare,
            }),
            force
        );

        writeFileSafe(
            resourcePath,
            renderTemplate(loadStub('backend/resource.stub.php'), {
                Feature: toPascal(feature),
                Model: model,
                resourceFields: resourceFields || '            //',
            }),
            force
        );

        writeFileSafe(
            collectionPath,
            renderTemplate(loadStub('backend/collection.stub.php'), {
                Feature: toPascal(feature),
                Model: model,
            }),
            force
        );

        writeFileSafe(
            policyPath,
            renderTemplate(loadStub('backend/policy.stub.php'), {
                Model: model,
                model: toCamel(model),
                policyUpdateRule: policyRule,
                policyDeleteRule: policyRule,
            }),
            force
        );

        writeFileSafe(
            testPath,
            renderTemplate(loadStub('backend/test.stub.php'), {
                Feature: toPascal(feature),
                Model: model,
                model: toCamel(model),
                modelPlural: modelPlural,
                routeSegment,
            }),
            force
        );

        writeFileSafe(
            domainReadmePath,
            renderTemplate(loadStub('backend/domain-readme.stub.php'), {
                Feature: toPascal(feature),
            }),
            force
        );

        writeFileSafe(
            domainRoutesPath,
            renderTemplate(loadStub('backend/domain-routes.stub.php'), {
                Feature: toPascal(feature),
                Model: model,
                featurePrefix: feature,
                routeListPath: routeSegment === feature ? '/' : modelPlural,
                routeItemPath: routeSegment === feature ? `/{${modelKebab}}` : `${modelPlural}/{${modelKebab}}`,
            }),
            force
        );

        updateApiRoutes(routeSegment, feature, model, authRequired);
    }

    if (frontend) {
        console.log('\n📦 Frontend');

        const featureDir = path.join(FRONT_FEATURES, feature);
        const apiDir = path.join(featureDir, 'api');
        const componentsDir = path.join(featureDir, 'components');
        const pagesDir = path.join(featureDir, 'pages');

        ensureDir(featureDir);
        ensureDir(apiDir);
        ensureDir(componentsDir);
        ensureDir(pagesDir);

        const schemaPath = path.join(featureDir, 'schema.ts');
        const hooksPath = path.join(apiDir, `${toCamel(model)}.ts`);
        const formPath = path.join(componentsDir, `${model}Form.tsx`);
        const listPagePath = path.join(pagesDir, `${model}ListPage.tsx`);
        const createPagePath = path.join(pagesDir, `${model}CreatePage.tsx`);
        const editPagePath = path.join(pagesDir, `${model}EditPage.tsx`);
        const apiIndexPath = path.join(apiDir, 'index.ts');

        const zodFields = buildZodFields(fields) || '  //';
        const formFields = buildFormFields(fields) || '        {/* TODO: Add fields */}';

        writeFileSafe(
            schemaPath,
            renderTemplate(loadStub('frontend/schema.stub.ts'), {
                Model: model,
                zodFields,
            }),
            force
        );

        writeFileSafe(
            hooksPath,
            renderTemplate(loadStub('frontend/hooks.stub.ts'), {
                Model: model,
                model: toCamel(model),
                feature,
                modelPlural,
            }),
            force
        );

        writeFileSafe(
            formPath,
            renderTemplate(loadStub('frontend/form.stub.tsx'), {
                Model: model,
                formFields,
            }),
            force
        );

        writeFileSafe(
            listPagePath,
            renderTemplate(loadStub('frontend/list-page.stub.tsx'), {
                Model: model,
                modelPlural,
                model: toCamel(model),
            }),
            force
        );

        writeFileSafe(
            createPagePath,
            renderTemplate(loadStub('frontend/create-page.stub.tsx'), {
                Model: model,
                model: toCamel(model),
            }),
            force
        );

        writeFileSafe(
            editPagePath,
            renderTemplate(loadStub('frontend/edit-page.stub.tsx'), {
                Model: model,
                model: toCamel(model),
            }),
            force
        );

        if (!fs.existsSync(apiIndexPath)) {
            writeFileSafe(apiIndexPath, `export * from './${toCamel(model)}';\n`, force);
        } else {
            const apiIndexContent = fs.readFileSync(apiIndexPath, 'utf8');
            const exportLine = `export * from './${toCamel(model)}';`;
            if (!apiIndexContent.includes(exportLine)) {
                fs.writeFileSync(apiIndexPath, `${apiIndexContent.trimEnd()}\n${exportLine}\n`);
                console.log(`  ✅ Updated: ${path.relative(ROOT, apiIndexPath)}`);
            }
        }
    }

    console.log('\n🧾 Contracts');
    updateFeaturesYaml(feature, model, table, routeSegment, authRequired);
    updateOpenApi(routeSegment, toPascal(feature));

    console.log('\n✅ CRUD scaffolding complete!');
    console.log('Next steps:');
    console.log('1. Review apps/api/routes/api.php and adjust route placement/guards');
    console.log('2. Implement real logic in generated Controller/Requests/Resources');
    console.log('3. Wire frontend pages into apps/web/src/App.tsx');
}

main();
