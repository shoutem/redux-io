import {
  toSerializableFormat,
} from './toSerializableFormat';
import {
  fromSerializableFormat,
} from './fromSerializableFormat';

export default class RioStateSerializer {
  constructor() {
    this.serialize = this.serialize.bind(this);
    this.deserialize = this.deserialize.bind(this);
  }

  serialize(state) {
    return toSerializableFormat(state);
  }

  deserialize(state) {
    return fromSerializableFormat(state);
  }
}
