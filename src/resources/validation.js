import ZSchema from 'z-schema';

const validator = new ZSchema();
const resourceDefinition = {
  type: 'object',
  properties: {
    schema: {
      type: ['object', 'string'],
    },
    request: {
      type: 'object',
      properties: {
        endpoint: {
          type: 'string',
        },
        headers: {
          type: 'object',
        },
        method: {
          type: 'string',
        },
        types: {
          type: 'array',
        },
        resourceType: {
          type: 'string',
        },
        body: {
          type: ['object', 'string'],
        },
      },
      additionalProperties: false,
      required: [
        'endpoint',
        'headers',
      ],
    },
    actions: {
      type: 'object',
    },
  },
  additionalProperties: false,
  required: [
    'schema',
  ],
};

/**
 * Validates resource configuration using ZSchema library and json-schema convention.
 * Returns useful errors to enable developer easier fixing invalid resource configuration.
 * @param config
 */
export default function validateResourceConfig(config) {
  const validResult = validator.validate(config, resourceDefinition);
  if (!validResult) {
    const validationErrorsMsg = JSON.stringify(validator.getLastErrors());
    const configMsg = JSON.stringify(config);
    throw new Error(
      `Resource configuration is invalid. Error: ${validationErrorsMsg}.`
      + ` Invalid resource config: ${configMsg}`
    );
  }
}
