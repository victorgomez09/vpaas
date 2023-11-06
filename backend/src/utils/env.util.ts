export const getSecretKey = () => {
  if (process.env['VPAAS_SECRET_KEY_BETTER']) {
    return process.env['VPAAS_SECRET_KEY_BETTER'];
  }

  return process.env['VPAAS_SECRET_KEY'];
};
