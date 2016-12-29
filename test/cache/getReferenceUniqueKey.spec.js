import { assert } from 'chai';
import { getReferenceUniqueKey } from '../../src/cache/RioCache';
import {
  STATUS,
} from '../../src/status';

describe('getReferenceUniqueKey', () => {
  it('returns key for RIO reference', () => {
    const uniqueID = 1;
    const reference = {};
    reference[STATUS] = { id: uniqueID };

    assert.isOk(getReferenceUniqueKey(reference) === uniqueID, 'unexpected key returned');
  });
  it('returns key for non RIO reference with string identifiers', () => {
    const id1 = '';
    const id2 = 'string';
    const id3 = '2';
    const type1 = '';
    const type2 = 'string';
    const type3 = '2';
    const reference1 = { id: id1, type: type1 };
    const reference2 = { id: id2, type: type2 };
    const reference3 = { id: id3, type: type3 };

    assert.isOk(getReferenceUniqueKey(reference1) === `${id1}.${type1}`, 'unexpected key returned');
    assert.isOk(getReferenceUniqueKey(reference2) === `${id2}.${type2}`, 'unexpected key returned');
    assert.isOk(getReferenceUniqueKey(reference3) === `${id3}.${type3}`, 'unexpected key returned');
  });
  it('returns key for non RIO reference with number identifiers', () => {
    const id1 = 1;
    const id2 = 0;
    const id3 = -1;
    const id4 = 1000000000;
    const type1 = 1;
    const type2 = 0;
    const type3 = -1;
    const type4 = 1000000000;
    const reference1 = { id: id1, type: type1 };
    const reference2 = { id: id2, type: type2 };
    const reference3 = { id: id3, type: type3 };
    const reference4 = { id: id4, type: type4 };

    assert.isOk(getReferenceUniqueKey(reference1) === `${id1}.${type1}`, 'unexpected key returned');
    assert.isOk(getReferenceUniqueKey(reference2) === `${id2}.${type2}`, 'unexpected key returned');
    assert.isOk(getReferenceUniqueKey(reference3) === `${id3}.${type3}`, 'unexpected key returned');
    assert.isOk(getReferenceUniqueKey(reference4) === `${id4}.${type4}`, 'unexpected key returned');
  });
});
