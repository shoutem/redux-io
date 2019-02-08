const baseResourceTypeConfig = {
  actions: {
    find: {
      request: {
        method: 'GET',
      },
      actionTypes: 'LOAD',
    },
    create: {
      request: {
        method: 'POST',
      },
      actionTypes: 'CREATE',
    },
    update: {
      request: {
        method: 'PATCH',
      },
    },
    remove: {
      request: {
        method: 'DELETE',
      },
    },
  },
};

export default Object.freeze(baseResourceTypeConfig);
