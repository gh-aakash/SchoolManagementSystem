import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Routes mapping
const routes: Record<string, string> = {
    '/api/auth': 'http://localhost:8001',
    '/api/identity': 'http://localhost:8001',
    '/api/sis': 'http://localhost:8002',
    '/api/finance': 'http://localhost:8003',
    '/api/engagement': 'http://localhost:8004',
    '/api/academic': 'http://localhost:8005',
};

// Proxy setup
Object.entries(routes).forEach(([path, target]) => {
    app.use(path, createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: {
            [`^${path}`]: '', // Remove the path prefix when forwarding
        },
    }));
});

app.get('/health', (req, res) => {
    res.json({ status: 'Gateway is running' });
});

app.listen(PORT, () => {
    console.log(`API Gateway running on http://localhost:${PORT}`);
});
