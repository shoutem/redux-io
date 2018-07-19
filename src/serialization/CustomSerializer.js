export default class CustomSerializer {
  constructor(deserialize, serialize) {
    this.deserializeFn = deserialize;
    this.serializeFn = serialize;

    this.serialize = this.serialize.bind(this);
    this.deserialize = this.deserialize.bind(this);
  }

  deserialize(data) {
    return this.deserializeFn(data);
  }

  serialize(data) {
    return this.serializeFn(data);
  }
}
