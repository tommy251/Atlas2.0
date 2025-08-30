
## Local Setup
### Backend
1. Navigate to backend: `cd backend`
2. Install dependencies: `pip install -r requirements.txt`
3. Create `.env` in `backend`:
   ```env
   MONGO_URL=mongodb://your-mongodb-uri
   DB_NAME=atlas2
   SECRET_KEY=your-secure-jwt-secret
   FRONTEND_URL=http://localhost:3000