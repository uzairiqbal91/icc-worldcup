# ICC Template Generator

A Next.js application for creating professional cricket match templates with dynamic data.

## Features

- **8 Template Types**: Toss, Powerplay, Innings End, Target, Match Result, Playing XI, Milestone, Fall of Wicket
- **Team & Player Management**: Integrated with Supabase database
- **Image Upload & Save**: Upload custom images and save them for reuse
- **Auto-Population**: Playing XI automatically populates with team players
- **Export**: Download templates as high-quality images

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Image Processing**: html2canvas
- **Deployment**: Vercel

## Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## Database Setup

The app requires the following Supabase tables:
- `teams` - Team information
- `players` - Player information  
- `template_images` - Saved template images and logos

## Usage

1. Select a template type
2. Fill in match details
3. Upload or select saved images
4. Download the generated template

---

Built for ICC World Cup content creation.
