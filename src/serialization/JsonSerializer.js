import _ from 'lodash';
import CustomSerializer from './CustomSerializer';
import { normalize } from 'normalizr';
import { normalize as jsonApiNormalize } from '../normalizer';

export default class JsonSerializer extends CustomSerializer {
  constructor(schema) {
    super();

    this.schema = schema;
  }

  deserialize(data) {
    const normalizrResult = normalize(data, this.schema);
    //console.log('normalizr', JSON.stringify(normalizrResult, null, 2));

    const jsonApiEntities = _.mapValues(
      normalizrResult.entities,
      schemaEntites => _.mapValues(
        schemaEntites,
        schemaEntity => jsonApiNormalize(schemaEntity)
      )
    );

    //console.log('jsonApiEntities', JSON.stringify(jsonApiEntities, null, 2));

    const jsonApiResult = {
      result: normalizrResult.result,
      entities: jsonApiEntities,
    };

    return jsonApiResult;
  }

  serialize(data) {
    // TODO: implement serializing data back to json 
  }
}
