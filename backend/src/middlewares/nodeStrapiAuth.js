// middlewares/nodeStrapiAuth.js
export const nodeStrapiAuth = (req, res, next) => {
  const incomingToken = req.headers['x-node-auth-token'];
  const expectedToken = process.env.NODE_JS_AUTH_STRAPI_TOKEN;
console.log(expectedToken, 'expectedToken');
console.log(incomingToken, 'incomingToken')

  if (!incomingToken || incomingToken !== expectedToken) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }

  next();
};
