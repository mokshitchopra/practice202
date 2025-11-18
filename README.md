# Campus Marketplace

A full-stack marketplace application for buying and selling textbooks, gadgets, and essentials within campus.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL

## Prerequisites

Before running the application, make sure you have the following installed:

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **Python** (v3.8 or higher) - [Download here](https://www.python.org/downloads/)
3. **PostgreSQL** - [Download here](https://www.postgresql.org/download/)
4. **AWS Account** (for S3 file storage) - Optional for local development

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd team-project-cmpe202-03-fall2025-royal-challengers
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Note**: It's recommended to use a virtual environment:

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Set Up PostgreSQL Database

1. Create a PostgreSQL database:
   ```sql
   CREATE DATABASE campus_marketplace;
   ```

2. Create a `.env` file in the `backend` directory with the following variables:

```env
# Database Configuration
db_host=localhost
db_port=5432
db_name=campus_marketplace
db_user=postgres
db_password=your_password_here
db_driver=postgresql

# Security Configuration
secret_key=your-secret-key-here-change-in-production
algorithm=HS256
access_token_expire_minutes=30
refresh_token_expire_days=7

# Application Configuration
app_name=Campus Marketplace
debug=true
allowed_origins=http://localhost:5173,http://localhost:3000

# AWS S3 Configuration
aws_access_key_id=your_aws_access_key
aws_secret_access_key=your_aws_secret_key
aws_region=us-east-1
s3_bucket_name=your-bucket-name
s3_base_url=https://your-bucket-name.s3.us-east-1.amazonaws.com

# File Upload Configuration
max_upload_size=10485760
allowed_image_extensions=jpg,jpeg,png,gif,webp

# Logging Configuration
log_level=INFO
log_format=json
log_to_file=false
log_file_path=logs/app.log
log_max_size_mb=10
log_backup_count=5
log_to_console=true
```

**Important**: Replace all placeholder values with your actual configuration:
- Database credentials should match your PostgreSQL setup
- `secret_key` should be a long, random string (you can generate one with `openssl rand -hex 32`)
- AWS credentials are required for file uploads. For local testing, you may need to modify the code to skip S3 uploads or use a local file storage solution.

#### Run the Backend Server

From the `backend` directory:

```bash
# Using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or using Python
python main.py
```

The backend API will be available at `http://localhost:8000`

- API Documentation (Swagger): `http://localhost:8000/docs`
- Alternative API Docs (ReDoc): `http://localhost:8000/redoc`

### 3. Frontend Setup

#### Install Node Dependencies

```bash
cd frontend
npm install
```

#### Configure Environment Variables (Optional)

Create a `.env` file in the `frontend` directory if you want to override the API URL:

```env
VITE_API_BASE_URL=http://localhost:8000
```

**Note**: The frontend defaults to `http://localhost:8000` if this variable is not set.

#### Run the Frontend Development Server

From the `frontend` directory:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (default Vite port)

### 4. Running Both Servers

You'll need to run both servers simultaneously:

1. **Terminal 1 - Backend**:
   ```bash
   cd backend
   python main.py
   # or: uvicorn main:app --reload
   ```

2. **Terminal 2 - Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

Then open your browser and navigate to `http://localhost:5173`

## Building for Production

### Frontend Build

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist`

### Frontend Preview Production Build

```bash
cd frontend
npm run preview
```

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Verify database credentials in `.env` file
- Check that the database exists: `psql -U postgres -l`

### CORS Issues

- Ensure `allowed_origins` in backend `.env` includes your frontend URL
- Default setup includes `http://localhost:5173` (Vite default port)

### Port Already in Use

- Backend: Change port in `main.py` or use: `uvicorn main:app --port 8001`
- Frontend: Vite will automatically use the next available port, or configure in `vite.config.ts`

### AWS S3 Issues (Local Development)

If you don't have AWS credentials set up, file uploads will fail. You may need to:
- Set up AWS credentials and S3 bucket
- Or modify the file upload route to use local storage for development

## Project Structure

```
.
├── backend/          # FastAPI backend
│   ├── app/         # Application code
│   ├── main.py      # Entry point
│   └── requirements.txt
├── frontend/        # React frontend
│   ├── src/         # Source code
│   ├── package.json
│   └── vite.config.ts
└── design/          # Design documents
```

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)


