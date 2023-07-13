/** @param {string} hex */
export const hexToArrayBuffer = (hex) => {
  const view = new Uint8Array(hex.length / 2);

  for (let i = 0; i < hex.length; i += 2)
    view[i / 2] = parseInt(hex.substring(i, i + 2), 16);

  return view.buffer;
};

/** @param {ArrayBuffer} arrayBuffer */
export const arrayBufferToHex = (arrayBuffer) => {
  const view = new Uint8Array(arrayBuffer);

  let result = "";
  for (let i = 0; i < view.length; i++) {
    const value = view[i].toString(16);
    result += value.length === 1 ? "0" + value : value;
  }

  return result;
};
