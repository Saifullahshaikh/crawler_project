# Web Scraper Dashboard

A Next.js frontend dashboard that integrates with a Django backend for web scraping operations.

## Architecture

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Django REST API (separate repository)
- **Database**: Managed by Django (PostgreSQL/MySQL recommended)
- **Communication**: RESTful API calls between Next.js and Django

## Features

- 🕷️ **Web Crawling**: Start crawling jobs via Django backend
- 📊 **Real-time Status**: Monitor crawling progress with live updates
- 🔍 **Product Data**: View and analyze scraped product information
- 📈 **Comparison**: Compare products between different crawl sessions
- 💾 **Data Management**: Export data in JSON, CSV, and Excel formats
- 🗄️ **Database Management**: Manage crawl sessions and cleanup old data

## Setup

### Prerequisites

- Node.js 18+ 
- Django backend running (see Django setup below)

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd web-scraper-dashboard
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and set:
\`\`\`env
DJANGO_API_URL="http://localhost:8000/api"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
\`\`\`

4. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

## Django Backend Requirements

Your Django backend should implement the following API endpoints:

### Crawl Sessions
- `POST /api/crawl-sessions/` - Create new crawl session
- `GET /api/crawl-sessions/{id}/` - Get specific session
- `PATCH /api/crawl-sessions/{id}/` - Update session status
- `DELETE /api/crawl-sessions/{id}/` - Delete session
- `GET /api/crawl-sessions/` - List sessions with pagination
- `POST /api/crawl-sessions/cleanup/` - Delete old sessions

### Category Links
- `POST /api/category-links/bulk/` - Save multiple category links
- `GET /api/category-links/` - Get category links with filtering
- `GET /api/category-links/latest/` - Get latest category links

### Products
- `POST /api/products/bulk/` - Save multiple products
- `GET /api/products/` - Get products with filtering
- `GET /api/products/latest/` - Get latest products
- `GET /api/products/comparison/` - Get comparison between crawl sessions

### Crawling
- `POST /api/crawl/start/` - Start actual crawling process

### Export
- `GET /api/export/` - Export data in various formats

## API Integration

The frontend uses the `DjangoApiService` class to communicate with the Django backend. All database operations are handled by Django, ensuring:

- **Data Consistency**: Single source of truth in Django
- **Performance**: Optimized database queries in Django
- **Scalability**: Background task processing with Celery
- **Security**: Centralized authentication and authorization

## Development

### Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── api/               # API routes (proxy to Django)
│   ├── actions/           # Server actions
│   └── pages/             # Page components
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── lib/                  # Utilities and services
│   └── django-api-service.ts  # Django API integration
└── ...
\`\`\`

### Key Components

- **CrawlerForm**: Start new crawling jobs
- **ProductData**: Display scraped product information
- **ProductComparison**: Compare products between crawls
- **CategoryLinks**: Show discovered category URLs
- **DatabaseManager**: Manage crawl sessions and data

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables

\`\`\`env
DJANGO_API_URL="https://your-django-api.com/api"
NEXT_PUBLIC_APP_URL="https://your-nextjs-app.vercel.app"
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
