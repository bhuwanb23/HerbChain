"""
HerbChain Server Startup Script
"""
import os
import sys
from pathlib import Path

# Add the current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from app import create_app

def main():
    """Main function to run the server"""
    print("🌿 Starting HerbChain Backend Server...")
    print("=" * 50)
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Create Flask app
    app = create_app()
    
    # Get configuration
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    print(f"🚀 Server starting on {host}:{port}")
    print(f"🔧 Debug mode: {debug}")
    print(f"📊 Admin dashboard: http://{host}:{port}/admin")
    print(f"🏥 Health check: http://{host}:{port}/health")
    print("=" * 50)
    
    try:
        app.run(host=host, port=port, debug=debug)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
