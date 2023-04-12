import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';
import express, { static as createStatic } from 'express';

const { PORT = 3000 } = process.env;

const app = express();

app.use('/', createStatic('./public'));

app.use(
  '/.bot',
  createProxyMiddleware({ target: 'https://webchat-mockbot3.azurewebsites.net/', changeOrigin: true, ws: true })
);

app.use(
  '/v3/directline',
  createProxyMiddleware({
    target: 'https://directline.botframework.com/',
    changeOrigin: true,
    onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
      if (req.method === 'POST' && req.url === '/v3/directline/conversations') {
        const body = responseBuffer.toString('utf8');
        const json = JSON.parse(body);

        json.streamUrl = json.streamUrl.replace(/^wss:\/\/directline.botframework.com\/v3\/directline\//, 'ws://localhost:3000/v3/directline/');

        return JSON.stringify(json);
      }

      return responseBuffer;
    }),
    selfHandleResponse: true,
    ws: true
  })
);

app.listen(PORT, () => {
  console.log(`Listening to port ${PORT}`);
});
