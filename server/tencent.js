const serverless = require('serverless-http');
const app = require('./app');

const handler = serverless(app);

exports.mainHandler = async (event, context) => {
  // Tencent SCF API Gateway event format
  const { httpMethod, path: urlPath, body, headers, queryString } = event;

  // Build a mock request object for Koa
  const req = {
    method: httpMethod,
    url: urlPath + (queryString ? '?' + new URLSearchParams(queryString).toString() : ''),
    headers: headers || {},
    body: body ? (typeof body === 'string' ? JSON.parse(body) : body) : {},
  };

  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      headers: {},
      body: '',
      setHeader(key, value) {
        this.headers[key] = value;
      },
      end(data) {
        if (data) this.body = data;
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: this.body,
        });
      },
      write(data) {
        this.body += data;
      },
    };

    app.callback()(req, res).then(() => {
      resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        body: typeof res.body === 'string' ? res.body : JSON.stringify(res.body),
      });
    }).catch(reject);
  });
};
