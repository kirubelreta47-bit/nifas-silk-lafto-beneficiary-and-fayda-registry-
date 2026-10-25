# Nifas Silk-Lafto Fayda Registry - Backend API

Production-ready Node.js + Express backend with PostgreSQL database support.

## Endpoints

### Beneficiaries
- `GET /api/beneficiaries` - List beneficiaries with optional search and filters (`search`, `woreda`, `healthStatus`, `category`)
- `POST /api/beneficiaries` - Register a new beneficiary (with duplicate Fayda ID prevention)
- `PUT /api/beneficiaries/:id` - Update existing beneficiary
- `DELETE /api/beneficiaries/:id` - Remove beneficiary record

### Dynamic Custom Fields (Admin Form Builder)
- `GET /api/custom-fields` - Retrieve custom form schema fields
- `POST /api/custom-fields` - Add new dynamic custom field
- `DELETE /api/custom-fields/:id` - Delete custom field
- `PUT /api/custom-fields/reorder` - Reorder field appearance

### System & Auth
- `GET /api/health` - Health check & database connection status
- `POST /api/auth/login` - Administrator and Woreda officer authentication
- `GET /api/auth/me` - Validate current session token
- `POST /api/auth/logout` - Logout session
- `POST /api/reset-demo` - Reset database to official sample dataset

---

## Deploying on Render (Web Service)

When creating a new **Web Service** on [Render](https://render.com):

1. **Repository**: Connect your GitHub repository.
2. **Root Directory**: Set to `backend` (Important!).
3. **Runtime**: `Node`
4. **Build Command**: `npm install`
5. **Start Command**: `node server.js`
6. **Environment Variables**:
   - `DATABASE_URL`: Your PostgreSQL connection string (from Render Postgres, Neon, Supabase, or AWS RDS).
   - `CORS_ORIGIN`: Your frontend URL (e.g., `https://your-frontend.vercel.app` or `*`).
   - `AUTH_SECRET`: Any random 32+ character secure secret key.
