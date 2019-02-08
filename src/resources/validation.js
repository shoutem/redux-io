import ZSchema from 'z-schema';

const validator = new ZSchema();
const resourceSchema = {
  type: 'object',
  properties: {
    schema: {
      type: ['object', 'string'],
    },
    type: {
      type: 'string',
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
        body: {
          type: ['object', 'string'],
        },
      },
      additionalProperties: true,
      required: [
        'endpoint',
        'headers',
      ],
    },
    actions: {
      type: 'object',
    },
    actionTypes: {
      type: 'string',
    },
    item: {
      type: ['object', 'null'],
    },
    tag: {
      type: 'string',
    },
    serializer: {
      type: 'object',
    },
    standardizer: {
      type: 'object',
    },
  },
  additionalProperties: true,
  required: [
    'schema',
  ],
};

const resourceTypeSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
    },
    request: {
      type: 'object',
      properties: {
        headers: {
          type: 'object',
        },
        method: {
          type: 'string',
        },
        types: {
          type: 'array',
        },
      },
      additionalProperties: false,
    },
    actions: {
      type: 'object',
    },
    actionTypes: {
      type: 'string',
    },
    item: {
      type: ['object', 'null'],
    },
    tag: {
      type: 'string',
    },
    serializer: {
      type: 'object',
    },
    standardizer: {
      type: 'object',
    },
  },
  additionalProperties: false,
  required: [
    'type',
  ],
};

/**
 * Validates configuration based on schema using ZSchema library and json-schema convention.
 * Returns useful errors to enable developer easier fixing invalid resource configuration.
 * @param config
 */
export function validateConfig(config, schema, throwException = true) {
  const validResult = validator.validate(config, schema);

  if (throwException && !validResult) {
    const validationErrorsMsg = JSON.stringify(validator.getLastErrors());
    const configMsg = JSON.stringify(config);
    throw new Error(
      `Resource configuration is invalid. Error: ${validationErrorsMsg}.`
      + ` Invalid resource config: ${configMsg}`
    );
  }

  return validResult;
}

/**
 * Validates resource configuration
 * @param config
 */
export function validateResourceConfig(config, throwException = true) {
  return validateConfig(config, resourceSchema, throwException);
}

/**
 * Validates resourceType configuration
 * @param config
 */
export function validateResourceTypeConfig(config, throwException = true) {
  return validateConfig(config, resourceTypeSchema, throwException);
}
