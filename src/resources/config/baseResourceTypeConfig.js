const baseResourceTypeConfig = {
  actions: {
    find: {
      request: {
        method: 'GET',
      },
    },
    create: {
      request: {
        method: 'POST',
      },
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
