"""
HerbChain Database Tests Runner
"""
import os
import sys
from pathlib import Path

# Add the current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

def main():
    """Run database tests"""
    print("🧪 Running HerbChain Database Tests...")
    print("=" * 50)
    
    try:
        from tests.db_test import DatabaseTester, run_performance_test
        
        # Run basic tests
        tester = DatabaseTester()
        tester.run_all_tests()
        
        # Run performance tests
        run_performance_test()
        
        print("\n🎉 All tests completed successfully!")
        
    except Exception as e:
        print(f"❌ Tests failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
