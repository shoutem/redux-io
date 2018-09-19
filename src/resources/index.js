export {
  validateResourceConfig,
  validateResourceTypeConfig,
} from './validation';

export {
  resolveSchemaType,
  resolveResourceType,
  resolveSchema,
  resolveResourceConfig,
  resolveReferenceSchemaType,
  buildEndpoint,
  getResourceType,
} from './resolver';

export {
  baseResourceTypeConfig,
  jsonApiResourceTypeConfig,
  JSON_API_RESOURCE,
} from './config';

export {
  default as Resource,
} from './Resource';
