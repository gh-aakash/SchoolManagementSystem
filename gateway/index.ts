import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());

// NO express.json() here! It breaks proxying of POST/PUT bodies.
// Middleware like express.json() consumes the request stream, 
// preventing http-proxy-middleware from successfully forwarding it.

// Routes mapping
const routes: Record<string, string> = {
    '/api/auth': process.env.IDENTITY_SERVICE_URL || 'http://localhost:8001',
    '/api/identity': process.env.IDENTITY_SERVICE_URL || 'http://localhost:8001',
    '/api/sis': process.env.SIS_SERVICE_URL || 'http://localhost:8002',
    '/api/finance': process.env.FINANCE_SERVICE_URL || 'http://localhost:8003',
    '/api/engagement': process.env.ENGAGEMENT_SERVICE_URL || 'http://localhost:8004',
    '/api/academic': process.env.ACADEMIC_SERVICE_URL || 'http://localhost:8005',
};

// Proxy setup
Object.entries(routes).forEach(([path, target]) => {
    app.use(path, createProxyMiddleware({
        target,
        changeOrigin: true,
        timeout: 60000,
        proxyTimeout: 60000,
        pathRewrite: {
            [`^${path}`]: '', // Remove the path prefix when forwarding
        },
    }));
});

app.get('/health', (req, res) => {
    res.json({ status: 'Gateway is running' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`API Gateway running on http://localhost:${PORT}`);
});
