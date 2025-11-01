# Deployment Guide

This guide covers deploying Vault to various platforms.

## Table of Contents

- [Vercel (Recommended)](#vercel)
- [Docker](#docker)
- [Railway](#railway)
- [AWS](#aws)
- [Self-Hosted](#self-hosted)

## Prerequisites

Before deploying, ensure you have:

1. ✅ Supabase project set up with:
   - Database migrations applied
   - pgvector extension enabled
   - Storage bucket created
   - RLS policies enabled

2. ✅ Anthropic API key

3. ✅ Environment variables ready

## Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

### Manual Deployment

1. **Install Vercel CLI**

```bash
npm i -g vercel
```

2. **Build and Test Locally**

```bash
npm run build
npm start
```

3. **Deploy**

```bash
vercel
```

4. **Add Environment Variables**

Go to your project settings in Vercel and add:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
NEXT_PUBLIC_APP_URL
```

5. **Deploy to Production**

```bash
vercel --prod
```

### Configuration

Add `vercel.json` for custom configuration:

```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  },
  "headers": [
    {
      "source": "/api/:path*",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

## Docker

### Build Image

```bash
docker build -t vault:latest .
```

### Run Container

```bash
docker run -d \
  --name vault \
  -p 3000:3000 \
  --env-file .env \
  vault:latest
```

### Docker Compose

```bash
docker-compose up -d
```

### Docker Compose with Custom Network

```yaml
version: '3.8'

services:
  vault:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    networks:
      - vault-network
    restart: unless-stopped

networks:
  vault-network:
    driver: bridge
```

## Railway

1. **Install Railway CLI**

```bash
npm i -g @railway/cli
```

2. **Login**

```bash
railway login
```

3. **Initialize Project**

```bash
railway init
```

4. **Add Environment Variables**

```bash
railway variables set NEXT_PUBLIC_SUPABASE_URL=your_value
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=your_value
railway variables set SUPABASE_SERVICE_ROLE_KEY=your_value
railway variables set ANTHROPIC_API_KEY=your_value
railway variables set NEXT_PUBLIC_APP_URL=your_app_url
```

5. **Deploy**

```bash
railway up
```

## AWS

### Using AWS Amplify

1. **Connect Repository**
   - Go to AWS Amplify Console
   - Connect your GitHub/GitLab repository
   - Select branch

2. **Build Settings**

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

3. **Environment Variables**
   - Add all required environment variables in Amplify settings

4. **Deploy**
   - Amplify will auto-deploy on push

### Using EC2

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - t2.medium or larger
   - Configure security groups (80, 443, 22)

2. **SSH into Instance**

```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

3. **Install Dependencies**

```bash
sudo apt update
sudo apt install -y nodejs npm nginx
```

4. **Clone and Build**

```bash
git clone your-repo
cd Vault
npm install
npm run build
```

5. **Setup PM2**

```bash
npm install -g pm2
pm2 start npm --name "vault" -- start
pm2 startup
pm2 save
```

6. **Configure Nginx**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Self-Hosted

### Requirements

- Linux server (Ubuntu 22.04 recommended)
- Node.js 18+
- Nginx or Apache
- SSL certificate (Let's Encrypt)

### Steps

1. **Clone Repository**

```bash
git clone your-repo
cd Vault
```

2. **Install Dependencies**

```bash
npm install
```

3. **Build Application**

```bash
npm run build
```

4. **Setup Environment**

```bash
cp .env.example .env
nano .env  # Edit with your values
```

5. **Start with PM2**

```bash
npm install -g pm2
pm2 start npm --name vault -- start
pm2 save
```

6. **Setup SSL with Let's Encrypt**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Post-Deployment

### Health Checks

Create a health check endpoint:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

### Monitoring

Recommended tools:
- **Sentry** - Error tracking
- **Vercel Analytics** - Performance monitoring
- **Uptime Robot** - Uptime monitoring
- **PostHog** - Product analytics

### Backup Strategy

1. **Database**: Use Supabase's built-in backups
2. **Storage**: Regular S3 backups
3. **Code**: Git repository

### Scaling

#### Horizontal Scaling
- Use load balancer (Nginx, AWS ALB)
- Multiple app instances with PM2 cluster mode
- Separate API and frontend servers

#### Database Scaling
- Read replicas for heavy read workloads
- Connection pooling (PgBouncer)
- Caching layer (Redis)

#### Storage Scaling
- CDN for static assets
- Separate storage buckets by region

## Troubleshooting

### Build Failures

**Issue**: Build fails with type errors
```bash
npm run type-check
```

**Issue**: Missing environment variables
- Ensure all required env vars are set
- Check `.env.example` for reference

### Runtime Errors

**Issue**: Database connection fails
- Verify Supabase URL and keys
- Check RLS policies
- Ensure pgvector extension is enabled

**Issue**: File uploads fail
- Check storage bucket permissions
- Verify file size limits
- Check CORS settings

### Performance Issues

**Issue**: Slow search responses
- Create vector indexes: `CREATE INDEX ON chunks USING ivfflat (embedding vector_cosine_ops)`
- Increase vector search lists parameter
- Consider upgrading Supabase plan

**Issue**: High memory usage
- Optimize embedding model settings
- Implement chunking for large files
- Add request timeout limits

## Security Checklist

- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] RLS policies active
- [ ] Rate limiting configured
- [ ] CORS properly set
- [ ] API keys rotated regularly
- [ ] Audit logs enabled
- [ ] Backup strategy in place
- [ ] Monitoring alerts set up

## Support

For deployment issues:
- Check [GitHub Issues](your-repo/issues)
- Email support@vault.ai
- Join our Discord community

---

**Need help?** Contact us at support@vault.ai
