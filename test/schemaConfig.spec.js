/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import {
  buildEndpoint,
} from '../src/schemaConfig';

describe('Build endpoint', () => {
  it('static', () => {
    const endpoint = 'http://new.shoutem.com';
    const params = { test: 1 };

    const expectedEndpoint = 'http://new.shoutem.com/?test=1';
    const builtEndpoint = buildEndpoint(endpoint, params);

    expect(builtEndpoint).to.be.equal(expectedEndpoint);
  });

  it('with segment param', () => {
    const endpoint = 'http://new.shoutem.com/{x}';
    const params = { x: 1 };

    const expectedEndpoint = 'http://new.shoutem.com/1';
    const builtEndpoint = buildEndpoint(endpoint, params);

    expect(builtEndpoint).to.be.equal(expectedEndpoint);
  });

  it('with segment param not provided', () => {
    const endpoint = 'http://new.shoutem.com/{x}';

    const expectedEndpoint = 'http://new.shoutem.com/';
    const builtEndpoint = buildEndpoint(endpoint);

    expect(builtEndpoint).to.be.equal(expectedEndpoint);
  });

  it('static with segment param', () => {
    const endpoint = 'http://new.shoutem.com';
    const params = { x: 1 };

    const expectedEndpoint = 'http://new.shoutem.com/?x=1';
    const builtEndpoint = buildEndpoint(endpoint, params);

    expect(builtEndpoint).to.be.equal(expectedEndpoint);
  });

  it('with query params', () => {
    const endpoint = 'http://new.shoutem.com';
    const params = { q1: 1, q2: 2 };

    const expectedEndpoint = 'http://new.shoutem.com/?q1=1&q2=2';
    const builtEndpoint = buildEndpoint(endpoint, params);

    expect(builtEndpoint).to.be.equal(expectedEndpoint);
  });

  it('with query params that require encoding', () => {
    const endpoint = 'http://new.shoutem.com';
    const params = { q1: 'http://www.google.com', q2: 'hello world' };

    const expectedEndpoint = 'http://new.shoutem.com/?q1=http%3A%2F%2Fwww.google.com&q2=hello+world';
    const builtEndpoint = buildEndpoint(endpoint, params);

    expect(builtEndpoint).to.be.equal(expectedEndpoint);
  });
});
