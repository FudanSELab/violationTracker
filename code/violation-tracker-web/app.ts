// Import the express in typescript file
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

import path from 'path';
import fs from 'fs';
import config from './config.json';
// Initialize the express engine
const app: express.Application = express();

// 转发代理
app.use(
  '/api',
  createProxyMiddleware({
    target: config.baseUrl,
    changeOrigin: true,
    pathRewrite: {
      '^/api': '',
    },
  }),
);

const PUBLIC_DIR = path.join(__dirname, 'public');
// 访问静态资源
app.use(express.static(PUBLIC_DIR));

app.use('*', (_req, _res) => {
  const html = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf-8');
  _res.send(html);
});
