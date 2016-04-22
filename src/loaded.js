import _ from 'lodash';
import {
  LOAD_SUCCESS,
  middlewareJsonApiSource,
} from './middleware';

export default (item) => ({
  type: LOAD_SUCCESS,
  payload: item,
  meta: {
    schema: _.get(item, 'data.type'),
    source: middlewareJsonApiSource,
  },
});
