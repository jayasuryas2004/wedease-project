# Wedease - Wedding & Event Planning Simplified

A comprehensive digital platform that simplifies wedding and event planning by connecting users with vendors and services like venues, photographers, makeup artists, decorators, and caterers.

## Features

- **Home Page**: Welcome banner, showcase of top services, smooth scroll navigation
- **Vendor Categories**: Venues, Photography, Makeup, Decor, Catering
- **Vendor Details**: Full description, gallery, pricing, reviews, booking
- **User Authentication**: Secure login/register with password encryption
- **Booking System**: Date/time selection, service customization
- **E-Invites**: AI-generated invitations using DALL·E
- **Admin Dashboard**: Vendor management, booking overview (future enhancement)

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **AI Integration**: DALL·E API

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env` file
4. Start the development server: `npm run dev`

## Project Structure

```
wedease-project/
├── public/              # Static assets
│   ├── css/             # Stylesheets
│   ├── js/              # Client-side JavaScript
│   └── images/          # Images and icons
├── views/               # Frontend templates
├── server/              # Backend code
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   └── config/          # Configuration files
├── .env                 # Environment variables
└── package.json         # Project dependencies
```

## License

MIT
