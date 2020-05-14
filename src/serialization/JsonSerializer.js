import _ from 'lodash';
import CustomSerializer from './CustomSerializer';
import { normalize } from 'vedrani-json-api-normalizr';
import { normalize as jsonApiNormalize } from '../normalizer';

export default class JsonSerializer extends CustomSerializer {
  constructor(schema) {
    super();

    this.schema = schema;
  }

  deserialize(data) {
    const normalizrResult = normalize(data, this.schema);

    const jsonApiEntities = _.mapValues(
      normalizrResult.entities,
      schemaEntites => _.mapValues(
        schemaEntites,
        schemaEntity => jsonApiNormalize(schemaEntity)
      )
    );

    const jsonApiResult = {
      result: normalizrResult.result,
      entities: jsonApiEntities,
    };

    return jsonApiResult;
  }

  serialize() {
    // TODO: implement serializing data back to json
  }
}
