export function extendMetaWithResponse(meta) {
  return (action, state, res) => {
    const response = {
      status: res.status,
    }
    return { ... meta, response };
  };
}
