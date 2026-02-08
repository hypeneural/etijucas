const API_PREFIX_PATTERN = /(?:^|\/)(api|v1)(?:\/|$)/i;

function extractLiteralString(node) {
    if (!node) {
        return null;
    }

    if (node.type === 'Literal' && typeof node.value === 'string') {
        return node.value;
    }

    if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
        return node.quasis.map((quasi) => quasi.value.cooked ?? quasi.value.raw).join('');
    }

    return null;
}

const noDirectFetchRule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Block direct fetch calls to API routes. Use apiClient/reportService.',
        },
        messages: {
            noDirectFetch:
                'Direct fetch() to API routes is blocked in reports module. Use apiClient/reportService.',
        },
        schema: [],
    },

    create(context) {
        return {
            CallExpression(node) {
                if (node.callee.type !== 'Identifier' || node.callee.name !== 'fetch') {
                    return;
                }

                const urlLiteral = extractLiteralString(node.arguments[0]);
                if (!urlLiteral) {
                    return;
                }

                if (API_PREFIX_PATTERN.test(urlLiteral)) {
                    context.report({
                        node,
                        messageId: 'noDirectFetch',
                    });
                }
            },
        };
    },
};

export default noDirectFetchRule;
