/**
 * ESLint Rule: no-direct-fetch
 * 
 * Proíbe uso direto de fetch() para chamadas de API.
 * Força o uso de @repo/sdk ou core/api.
 * 
 * Adicione ao .eslintrc.js:
 * 
 * rules: {
 *   'local-rules/no-direct-fetch': 'error'
 * }
 * 
 * E configure em eslint.config.js para usar regras locais.
 */

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Proíbe fetch direto para APIs. Use @repo/sdk.',
            category: 'Best Practices',
            recommended: true,
        },
        messages: {
            noDirectFetch:
                'Não use fetch() diretamente para APIs. Use @repo/sdk ou core/api.',
        },
        schema: [],
    },

    create(context) {
        return {
            CallExpression(node) {
                // Check if it's a fetch call
                if (
                    node.callee.type === 'Identifier' &&
                    node.callee.name === 'fetch'
                ) {
                    // Check if the first argument looks like an API call
                    const firstArg = node.arguments[0];
                    if (firstArg) {
                        let urlValue = '';

                        if (firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
                            urlValue = firstArg.value;
                        } else if (firstArg.type === 'TemplateLiteral') {
                            // Check template literal quasis
                            urlValue = firstArg.quasis.map(q => q.value.raw).join('');
                        }

                        // Check if it's an API URL
                        if (urlValue.includes('/api/') || urlValue.includes('/v1/')) {
                            context.report({
                                node,
                                messageId: 'noDirectFetch',
                            });
                        }
                    }
                }
            },
        };
    },
};
