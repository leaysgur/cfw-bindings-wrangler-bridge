/** @param {string} hexString */
export const hexStringToArrayBuffer = (hexString) => {
  const view = new Uint8Array(hexString.length / 2);

  for (let i = 0; i < hexString.length; i += 2)
    view[i / 2] = parseInt(hexString.substring(i, i + 2), 16);

  return view.buffer;
};

/** @param {string} key */
export const decodeKey = (key) => decodeURIComponent(key);
