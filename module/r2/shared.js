/** @param {string} hexString */
export const hexStringToArrayBuffer = (hexString) => {
  const view = new Uint8Array(hexString.length / 2);

  for (let i = 0; i < hexString.length; i += 2)
    view[i / 2] = parseInt(hexString.substring(i, i + 2), 16);

  return view.buffer;
};

/** @param {ArrayBuffer} arrayBuffer */
export const arrayBufferToHexString = (arrayBuffer) => {
  const view = new Uint8Array(arrayBuffer);

  let hexString = "";
  for (let i = 0; i < view.length; i++) {
    const value = view[i].toString(16);
    hexString += value.length === 1 ? "0" + value : value;
  }

  return hexString;
};

/** @param {string} key */
export const encodeKey = (key) => encodeURIComponent(key);
