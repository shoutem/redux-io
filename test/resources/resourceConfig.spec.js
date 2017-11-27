/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import {
  buildEndpoint,
} from '../../src/resources';

describe('Build endpoint', () => {
  it('static', () => {
    const endpoint = 'http://new.shoutem.com';
    const params = { test: 1 };

    const expectedEndpoint = 'http://new.shoutem.com';
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
    const endpoint = 'http://new.shoutem.com{/x}';

    const expectedEndpoint = 'http://new.shoutem.com';
    const builtEndpoint = buildEndpoint(endpoint);

    expect(builtEndpoint).to.be.equal(expectedEndpoint);
  });

  it('static with segment param', () => {
    const endpoint = 'http://new.shoutem.com';
    const params = { x: 1 };

    const expectedEndpoint = 'http://new.shoutem.com';
    const builtEndpoint = buildEndpoint(endpoint, params);

    expect(builtEndpoint).to.be.equal(expectedEndpoint);
  });

  it('with query params', () => {
    const endpoint = 'http://new.shoutem.com{?q1,q2}';
    const params = { q1: 1, q2: 2 };

    const expectedEndpoint = 'http://new.shoutem.com?q1=1&q2=2';
    const builtEndpoint = buildEndpoint(endpoint, params);

    expect(builtEndpoint).to.be.equal(expectedEndpoint);
  });

  it('with query params not provided', () => {
    const endpoint = 'http://new.shoutem.com{?q1,q2}';

    const expectedEndpoint = 'http://new.shoutem.com';
    const builtEndpoint = buildEndpoint(endpoint);

    expect(builtEndpoint).to.be.equal(expectedEndpoint);
  });

  it('with spread query params', () => {
    const endpoint = 'http://new.shoutem.com{?q*}';
    const params = {
      q: {
        q1: 1,
        q2: 2,
      },
    };

    const expectedEndpoint = 'http://new.shoutem.com?q1=1&q2=2';
    const builtEndpoint = buildEndpoint(endpoint, params);

    expect(builtEndpoint).to.be.equal(expectedEndpoint);
  });
});
