import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';
import express, { Router, static as createStatic } from 'express';

const { PORT = 3000 } = process.env;

const app = express();

app.use('/', createStatic('./public'));

app.use('/.bot', createProxyMiddleware({ changeOrigin: true, target: 'https://webchat-mockbot3.azurewebsites.net/' }));

app.use(
  ['/v3/directline/conversations', '/v3/directline/conversations/:id'],
  createProxyMiddleware({
    changeOrigin: true,
    onProxyRes: responseInterceptor(async (responseBuffer, { statusCode }) => {
      if (statusCode >= 200 && statusCode < 300) {
        try {
          const json = JSON.parse(responseBuffer.toString('utf8'));

          if (json.streamUrl) {
            json.streamUrl = json.streamUrl.replace(
              /^wss:\/\/directline.botframework.com\/v3\/directline\//,
              `ws://localhost:${PORT}/v3/directline/`
            );

            return JSON.stringify(json);
          }
        } catch (error) {
          console.error(error);
        }
      }

      return responseBuffer;
    }),
    selfHandleResponse: true,
    target: 'https://directline.botframework.com/'
  })
);

app.use(
  '/v3/directline',
  createProxyMiddleware({ changeOrigin: true, target: 'https://directline.botframework.com/' })
);

app
  .listen(PORT, async () => {
    console.log(`Listening to port ${PORT}.`);
  })
  .on(
    'upgrade',
    createProxyMiddleware({
      changeOrigin: true,
      router: {
        '/.bot': 'https://webchat-mockbot3.azurewebsites.net/'
      },
      target: 'https://directline.botframework.com/',
      ws: true
    }).upgrade
  );
