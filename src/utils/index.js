const response = (res, { status = 200, message = "", data = [] }) => {
  return res.status(status).json({
    status,
    message,
    data,
  });
};

const validateUUID = (uuid) => {
  const regexExp =
    /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
  return regexExp.test(uuid);
};

module.exports = {
  response,
  validateUUID,
};
