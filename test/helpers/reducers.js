export function reducerNormal(state = {}, action) {
  switch (action.type) {
    case 'test':
      return { ...state, data: action.payload };
    default:
      return state;
  }
}

export function reducerOther(state = {}, action) {
  switch (action.type) {
    case 'test':
      return { ...state, dataOther: action.payload };
    default:
      return state;
  }
}

export function reducerSquare(state = {}, action) {
  switch (action.type) {
    case 'test':
      return { ...state, data: action.payload * action.payload };
    default:
      return state;
  }
}

export function reducerSquareArray(state = {}, action) {
  switch (action.type) {
    case 'test':
      return { ...state, data: action.payload.map(x => x * x) };
    default:
      return state;
  }
}
