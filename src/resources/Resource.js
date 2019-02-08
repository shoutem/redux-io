import _ from 'lodash';
import execute from '../actions/execute';

export default class Resource {
  constructor(resourceConfig) {
    this.registerActions = this.registerActions.bind(this);

    const { actions } = resourceConfig;
    this.resourceConfig = _.omit(resourceConfig, 'actions');
    this.actions = actions;

    this.registerActions();
  }

  registerActions() {
    _.mapKeys(this.actions, (actionConfig, actionKey) => {
      this[actionKey] = (argActionConfig, params = {}, options = {}) => {
        const resolvedActionConfig = _.merge(
          {
            name: actionKey,
          },
          this.resourceConfig,
          actionConfig,
          argActionConfig
        );
        return execute(resolvedActionConfig, params, options);
      };
    });
  }
}
