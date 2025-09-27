# 🌿 HerbChain Backend Server

A comprehensive Flask-based backend server for the HerbChain application with database management, logging, and admin dashboard.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Initialize Database
```bash
python init_db.py
```

### 3. Run Server
```bash
python run_server.py
```

### 4. Access Admin Dashboard
Open your browser and go to: `http://localhost:5000/admin`

## 📁 Project Structure

```
backend/server/
├── app.py                 # Main Flask application
├── init_db.py            # Database initialization
├── run_server.py         # Server startup script
├── run_tests.py          # Test runner
├── config/
│   └── logging.py        # Logging configuration
├── models/
│   ├── __init__.py       # Models package
│   └── farmers/          # Farmer-related models
│       ├── __init__.py
│       ├── farmer_profile.py
│       ├── herb_batch.py
│       ├── payment.py
│       ├── training_content.py
│       ├── training_progress.py
│       └── README.md
├── routes/
│   ├── __init__.py
│   └── admin.py          # Admin dashboard routes
├── templates/
│   └── db_admin.html     # Admin dashboard template
├── tests/
│   ├── __init__.py       # Tests package
│   └── db_test.py        # Database testing utilities
└── logs/                 # Log files (created automatically)
```

## 🗄️ Database Models

### Farmer Profile
- Personal information and farm details
- Authentication and preferences
- GPS location and farming type

### Herb Batches
- Batch registration with AI detection
- Species identification and validation
- QR codes and status tracking

### Payments & Incentives
- Payment tracking and processing
- Multiple payment types
- Transaction references

### Training Content
- Training modules and materials
- Multi-language support
- Difficulty levels and categories

### Training Progress
- Farmer progress tracking
- Completion status and scores
- Learning analytics

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:

```env
# Flask Configuration
SECRET_KEY=your-secret-key-here
FLASK_ENV=development
FLASK_DEBUG=True

# Database Configuration
DATABASE_URL=sqlite:///herbchain.db
# For PostgreSQL: postgresql://username:password@localhost/herbchain
# For MySQL: mysql://username:password@localhost/herbchain

# Server Configuration
HOST=0.0.0.0
PORT=5000

# Logging
LOG_LEVEL=INFO
```

## 📊 Admin Dashboard Features

### Overview Tab
- Database statistics and metrics
- System health monitoring
- Real-time data visualization

### Farmers Management
- View all registered farmers
- Search and filter capabilities
- Farmer profile management

### Herb Batches
- Batch tracking and validation
- Status management
- Quality control tools

### Payments
- Payment processing and tracking
- Financial analytics
- Transaction management

### Training Management
- Content creation and editing
- Progress monitoring
- Learning analytics

### System Logs
- Real-time log viewing
- Error tracking and debugging
- System monitoring

### Database Tools
- Backup and restore functionality
- Database reset (with confirmation)
- Data export capabilities

## 🧪 Testing

### Run All Tests
```bash
python run_tests.py
```

### Test Individual Components
```python
from tests.db_test import DatabaseTester

tester = DatabaseTester()
tester.setup_test_db()
tester.test_farmer_creation()
tester.cleanup_test_db()
```

### Performance Testing
```python
from tests.db_test import run_performance_test
run_performance_test()
```

## 📝 Logging

The application includes comprehensive logging:

- **Application Logs**: `logs/herbchain.log`
- **Database Logs**: `logs/database.log`
- **API Logs**: `logs/api.log`
- **Module-specific Logs**: Individual log files for each module

### Log Levels
- `DEBUG`: Detailed information for debugging
- `INFO`: General information about application flow
- `WARNING`: Warning messages for potential issues
- `ERROR`: Error messages for failed operations

## 🔌 API Endpoints

### Core Endpoints
- `GET /` - Root endpoint with server information
- `GET /health` - Health check endpoint
- `GET /api/v1/ping` - Ping endpoint

### Admin Endpoints
- `GET /admin` - Admin dashboard
- `GET /admin/api/stats` - Database statistics
- `GET /admin/api/farmers` - Farmers list
- `GET /admin/api/batches` - Herb batches list
- `GET /admin/api/payments` - Payments list
- `GET /admin/api/training` - Training content list
- `GET /admin/api/logs` - System logs
- `POST /admin/api/backup` - Create database backup
- `POST /admin/api/reset` - Reset database
- `GET /admin/api/health` - Database health check

## 🛠️ Development

### Adding New Models
1. Create model file in appropriate directory
2. Add to `models/__init__.py`
3. Update admin routes if needed
4. Add tests in `templates/db_test.py`

### Adding New Routes
1. Create route file in `routes/` directory
2. Register blueprint in `app.py`
3. Add logging and error handling
4. Update admin dashboard if needed

### Database Migrations
```bash
# Initialize migrations
flask db init

# Create migration
flask db migrate -m "Description of changes"

# Apply migration
flask db upgrade
```

## 🚀 Production Deployment

### Environment Setup
1. Set production environment variables
2. Use PostgreSQL or MySQL for production
3. Configure proper logging levels
4. Set up monitoring and alerting

### Security Considerations
1. Change default secret key
2. Use HTTPS in production
3. Implement proper authentication
4. Regular security updates

### Performance Optimization
1. Use connection pooling
2. Implement caching
3. Optimize database queries
4. Monitor performance metrics

## 📚 Documentation

- **Models Documentation**: `models/farmers/README.md`
- **API Documentation**: Available at `/admin` dashboard
- **Logging Documentation**: `config/logging.py`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is part of the HerbChain application.

## 🆘 Support

For support and questions:
- Check the logs in the `logs/` directory
- Use the admin dashboard for monitoring
- Review the test files for examples
- Check the model documentation

---

**Happy Coding! 🌿**
