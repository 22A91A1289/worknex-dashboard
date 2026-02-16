# WorkNex Dashboard

Web dashboard for WorkNex - Connecting students with local employers.

## Backend API

The dashboard connects to the backend API hosted on **Vercel**:
- **Production Backend URL:** `https://village-work.vercel.app`

## Environment Variables

You can override the backend URL using environment variables:

- `REACT_APP_API_BASE_URL` - Override the API base URL
- `REACT_APP_SOCKET_URL` - Override the Socket.io URL (defaults to API base URL)

### Example `.env` file:

```env
REACT_APP_API_BASE_URL=https://village-work.vercel.app
```

## Installation

```bash
npm install
```

## Development

```bash
npm start
```

Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

## Build

```bash
npm run build
```

Builds the app for production to the `build` folder.

## Deployment

The dashboard is deployed on **Vercel** at:
- **Production URL:** `https://village-work.vercel.app`

### Vercel Configuration

The `vercel.json` file is configured for Create React App deployment:
- Build command: `npm run build`
- Output directory: `build`
- Framework: `create-react-app`

## API Configuration

The dashboard automatically uses the Vercel backend URL by default. The API service is configured in:
- `src/services/api.js` - REST API client
- `src/services/socket.js` - Socket.io client (Note: Socket.io may not work on Vercel serverless backend)

