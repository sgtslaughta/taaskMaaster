#!/usr/bin/env python3
"""
TaaskMaaster Test Runner

This script runs the comprehensive test suite for the TaaskMaaster project.
It provides different test modes and detailed reporting.
"""

import argparse
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, List

# Import our logger
from tests.logger import setup_logging


class TestRunner:
    """Main test runner class."""

    def __init__(self):
        self.project_root = Path(__file__).parent
        self.tests_dir = self.project_root / "tests"
        self.results = {"passed": 0, "failed": 0, "skipped": 0, "errors": []}

        # Setup logging
        self.logger = setup_logging()
        self.logger.logger.info(
            "TestRunner initialized",
            extra={
                "project_root": str(self.project_root),
                "tests_dir": str(self.tests_dir),
            },
        )

    def run_command(
        self, command: List[str], timeout: int = 300
    ) -> Dict[str, Any]:
        """Run a command and return results."""
        self.logger.logger.debug(f"Executing command: {' '.join(command)}")

        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=self.project_root,
            )

            command_result = {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode,
            }

            # Log command execution
            self.logger.log_command_execution(
                command=command,
                success=command_result["success"],
                stdout=command_result["stdout"],
                stderr=command_result["stderr"],
            )

            return command_result

        except subprocess.TimeoutExpired:
            error_result = {
                "success": False,
                "stdout": "",
                "stderr": "Command timed out",
                "returncode": -1,
            }
            self.logger.log_command_execution(
                command=command, success=False, stderr="Command timed out"
            )
            return error_result

        except Exception as e:
            error_result = {
                "success": False,
                "stdout": "",
                "stderr": str(e),
                "returncode": -1,
            }
            self.logger.log_command_execution(
                command=command, success=False, stderr=str(e)
            )
            return error_result

    def check_prerequisites(self) -> bool:
        """Check if prerequisites are met."""
        self.logger.logger.info("Checking prerequisites...")
        print("🔍 Checking prerequisites...")

        checks = []

        # Check Python version
        major = sys.version_info.major
        minor = sys.version_info.minor
        micro = sys.version_info.micro
        python_version = f"{major}.{minor}.{micro}"
        if major >= 3 and minor >= 9:
            checks.append(("✅", f"Python {python_version} (>= 3.9)"))
            self.logger.logger.info(
                f"Python version check passed: {python_version}"
            )
        else:
            checks.append(("❌", f"Python {python_version} (requires >= 3.9)"))
            self.logger.logger.error(
                f"Python version check failed: {python_version}"
            )
            return False

        # Check if pytest is available
        result = self.run_command(
            [sys.executable, "-m", "pytest", "--version"]
        )
        if result["success"]:
            version_line = result["stdout"].strip().split("\n")[0]
            checks.append(("✅", f"pytest {version_line}"))
            self.logger.logger.info(f"pytest check passed: {version_line}")
        else:
            checks.append(("❌", "pytest not available"))
            self.logger.logger.error("pytest check failed")
            return False

        # Check if requests is available
        try:
            import requests

            checks.append(("✅", f"requests {requests.__version__}"))
            self.logger.logger.info(
                f"requests check passed: {requests.__version__}"
            )
        except ImportError:
            checks.append(("❌", "requests not available"))
            self.logger.logger.error("requests check failed")
            return False

        # Check if Docker is running
        result = self.run_command(["docker", "info"])
        if result["success"]:
            checks.append(("✅", "Docker is running"))
            self.logger.logger.info("Docker check passed")
        else:
            checks.append(("❌", "Docker is not running"))
            self.logger.logger.error("Docker check failed")
            return False

        # Check if Docker Compose is available
        compose_cmd = self._get_docker_compose_cmd()
        result = self.run_command(compose_cmd + ["--version"])
        if result["success"]:
            version_line = result["stdout"].strip().split("\n")[0]
            checks.append(("✅", f"Docker Compose {version_line}"))
            self.logger.logger.info(
                f"Docker Compose check passed: {version_line}"
            )
        else:
            checks.append(("❌", "Docker Compose not available"))
            self.logger.logger.error("Docker Compose check failed")
            return False

        # Check if Docker images can be built
        checks.append(("⏳", "Checking Docker build capability..."))

        # Display all checks
        print("  Prerequisites:")
        for status, message in checks:
            print(f"    {status} {message}")

        print("✅ All prerequisites met!")
        self.logger.logger.info("All prerequisites met successfully")
        return True

    def check_docker_build(self) -> bool:
        """Check if Docker images can be built successfully."""
        self.logger.logger.info("Checking Docker build capability...")
        print("\n🔨 Checking Docker build capability...")

        # Determine Docker Compose command
        compose_cmd = self._get_docker_compose_cmd()

        # Check if images already exist
        result = self.run_command(
            ["docker", "images", "-q", "taaskmaaster-backend"]
        )
        if result["success"] and result["stdout"].strip():
            print("✅ Backend image already exists")
            self.logger.logger.info("Backend image already exists")
        else:
            print("⏳ Backend image needs to be built...")
            self.logger.logger.info("Building backend image...")
            build_result = self.run_command(
                compose_cmd + ["build", "backend"], timeout=300
            )
            if not build_result["success"]:
                print("❌ Backend build failed:")
                print(build_result["stderr"])
                self.logger.logger.error(
                    "Backend build failed",
                    extra={"stderr": build_result["stderr"]},
                )
                return False
            print("✅ Backend image built successfully")
            self.logger.logger.info("Backend image built successfully")

        result = self.run_command(
            ["docker", "images", "-q", "taaskmaaster-frontend"]
        )
        if result["success"] and result["stdout"].strip():
            print("✅ Frontend image already exists")
            self.logger.logger.info("Frontend image already exists")
        else:
            print("⏳ Frontend image needs to be built...")
            self.logger.logger.info("Building frontend image...")
            build_result = self.run_command(
                compose_cmd + ["build", "frontend"], timeout=300
            )
            if not build_result["success"]:
                print("❌ Frontend build failed:")
                print(build_result["stderr"])
                self.logger.logger.error(
                    "Frontend build failed",
                    extra={"stderr": build_result["stderr"]},
                )
                return False
            print("✅ Frontend image built successfully")
            self.logger.logger.info("Frontend image built successfully")

        return True

    def _get_docker_compose_cmd(self) -> list:
        """Get the appropriate Docker Compose command."""
        # Try docker compose first
        result = self.run_command(["docker", "compose", "version"])
        if result["success"]:
            return ["docker", "compose"]

        # Try docker-compose as a fallback
        result = self.run_command(["docker-compose", "--version"])
        if result["success"]:
            return ["docker-compose"]

        # If neither works, default to docker compose and let it fail
        return ["docker", "compose"]

    def _ensure_services_running(self) -> bool:
        """Ensure that Docker services are running."""
        self.logger.logger.info("Ensuring services are running...")

        compose_cmd = self._get_docker_compose_cmd()

        # Check if services are already running
        result = self.run_command(compose_cmd + ["ps", "-q"])
        if result["success"] and result["stdout"].strip():
            self.logger.logger.info("Services are already running")
            return True

        # Start services
        self.logger.logger.info("Starting services...")
        result = self.run_command(compose_cmd + ["up", "-d"])
        if not result["success"]:
            self.logger.logger.error(
                "Failed to start services", extra={"stderr": result["stderr"]}
            )
            return False

        # Wait for services to be ready
        self.logger.logger.info("Waiting for services to be ready...")
        import time

        time.sleep(15)  # Give services time to start

        # Verify services are running
        result = self.run_command(compose_cmd + ["ps", "-q"])
        if result["success"] and result["stdout"].strip():
            self.logger.logger.info("Services started successfully")
            return True
        else:
            self.logger.logger.error("Services failed to start properly")
            return False

    def run_infrastructure_tests(self, verbose: bool = False) -> bool:
        """Run infrastructure tests."""
        print("\n🏗️  Running infrastructure tests...")

        # Ensure services are running for infrastructure tests
        if not self._ensure_services_running():
            self.logger.logger.error(
                "Failed to start services for infrastructure tests"
            )
            return False

        cmd = [
            sys.executable,
            "-m",
            "pytest",
            "tests/test_infrastructure.py",
            "--tb=short",
            "--strict-markers",
            "--durations=10",
        ]

        if verbose:
            cmd.append("-v")
        else:
            cmd.append("-q")

        result = self.run_command(cmd)

        # Parse and display results
        self._display_test_results(result, "Infrastructure Tests")

        return result["success"]

    def run_backend_tests(self, verbose: bool = False) -> bool:
        """Run backend tests."""
        print("\n🔧 Running backend tests...")

        # Ensure services are running for backend tests
        if not self._ensure_services_running():
            self.logger.logger.error(
                "Failed to start services for backend tests"
            )
            return False

        cmd = [
            sys.executable,
            "-m",
            "pytest",
            "tests/test_backend.py",
            "--tb=short",
            "--strict-markers",
            "--durations=10",
        ]

        if verbose:
            cmd.append("-v")
        else:
            cmd.append("-q")

        result = self.run_command(cmd)

        # Parse and display results
        self._display_test_results(result, "Backend Tests")

        return result["success"]

    def run_frontend_tests(self, verbose: bool = False) -> bool:
        """Run frontend tests."""
        print("\n🌐 Running frontend tests...")

        # Ensure services are running for frontend tests
        if not self._ensure_services_running():
            self.logger.logger.error(
                "Failed to start services for frontend tests"
            )
            return False

        cmd = [
            sys.executable,
            "-m",
            "pytest",
            "tests/test_frontend.py",
            "--tb=short",
            "--strict-markers",
            "--durations=10",
        ]

        if verbose:
            cmd.append("-v")
        else:
            cmd.append("-q")

        result = self.run_command(cmd)

        # Parse and display results
        self._display_test_results(result, "Frontend Tests")

        return result["success"]

    def run_all_tests(self, verbose: bool = False) -> bool:
        """Run all tests."""
        print("\n🧪 Running all tests...")

        # Ensure services are running for tests that need them
        if not self._ensure_services_running():
            self.logger.logger.error("Failed to start services for all tests")
            return False

        # Use more detailed output format
        cmd = [
            sys.executable,
            "-m",
            "pytest",
            "tests/",
            "--tb=short",  # Short traceback format
            "--strict-markers",  # Strict marker checking
            "--durations=10",  # Show 10 slowest tests
        ]

        if verbose:
            cmd.append("-v")
        else:
            cmd.append("-q")

        result = self.run_command(cmd)

        # Parse and display results
        self._display_test_results(result, "All Tests")

        return result["success"]

    def run_quick_tests(self, verbose: bool = False) -> bool:
        """Run quick tests (skip slow tests)."""
        print("\n⚡ Running quick tests...")

        # Ensure services are running for tests that need them
        if not self._ensure_services_running():
            self.logger.logger.error(
                "Failed to start services for quick tests"
            )
            return False

        cmd = [
            sys.executable,
            "-m",
            "pytest",
            "tests/",
            "-m",
            "not slow",
            "--tb=short",
            "--strict-markers",
            "--durations=10",
        ]

        if verbose:
            cmd.append("-v")
        else:
            cmd.append("-q")

        result = self.run_command(cmd)

        # Parse and display results
        self._display_test_results(result, "Quick Tests")

        return result["success"]

    def run_integration_tests(self, verbose: bool = False) -> bool:
        """Run integration tests."""
        print("\n🔗 Running integration tests...")

        cmd = [
            sys.executable,
            "-m",
            "pytest",
            "tests/",
            "-m",
            "integration",
            "--tb=short",
            "--strict-markers",
            "--durations=10",
        ]

        if verbose:
            cmd.append("-v")
        else:
            cmd.append("-q")

        result = self.run_command(cmd)

        # Parse and display results
        self._display_test_results(result, "Integration Tests")

        return result["success"]

    def generate_coverage_report(self) -> bool:
        """Generate test coverage report."""
        print("\n📊 Generating coverage report...")

        cmd = [
            sys.executable,
            "-m",
            "pytest",
            "tests/",
            "--cov=backend/app",
            "--cov-report=html",
            "--cov-report=term-missing",
        ]
        result = self.run_command(cmd)

        if result["success"]:
            print("✅ Coverage report generated")
            print("📁 HTML report: htmlcov/index.html")
            return True
        else:
            print("❌ Failed to generate coverage report")
            return False

    def start_services(self) -> bool:
        """Start Docker services if not running."""
        print("\n🚀 Starting services...")

        compose_cmd = self._get_docker_compose_cmd()

        # Check if services are already running
        result = self.run_command(compose_cmd + ["ps", "-q"])
        if result["success"] and result["stdout"].strip():
            print("✅ Services are already running")
            return True

        # Start services
        result = self.run_command(compose_cmd + ["up", "-d"])
        if result["success"]:
            print("✅ Services started successfully")
            print("⏳ Waiting for services to be ready...")
            time.sleep(10)
            return True
        else:
            print("❌ Failed to start services")
            print(result["stderr"])
            return False

    def stop_services(self) -> bool:
        """Stop Docker services."""
        print("\n🛑 Stopping services...")

        compose_cmd = self._get_docker_compose_cmd()
        result = self.run_command(compose_cmd + ["down"])
        if result["success"]:
            print("✅ Services stopped successfully")
            return True
        else:
            print("❌ Failed to stop services")
            return False

    def _display_test_results(self, result: Dict[str, Any], test_name: str):
        """Display test results in a formatted way."""
        print(f"\n📊 {test_name} Results:")
        print("-" * 50)

        if result["success"]:
            print("✅ All tests passed!")
        else:
            print("❌ Some tests failed!")

        # Parse and display test summary
        output = result["stdout"] + result["stderr"]

        # Extract test summary
        lines = output.split("\n")
        summary_lines = []
        error_lines = []
        in_error_section = False

        for line in lines:
            if (
                "FAILED" in line
                or "ERROR" in line
                or "passed" in line
                or "failed" in line
            ):
                summary_lines.append(line.strip())
            elif "E " in line or "F " in line or "AssertionError" in line:
                error_lines.append(line.strip())
                in_error_section = True
            elif in_error_section and line.strip():
                error_lines.append(line.strip())
            elif in_error_section and not line.strip():
                in_error_section = False

        # Display summary
        if summary_lines:
            print("\n📈 Test Summary:")
            for line in summary_lines:
                if line:
                    print(f"  {line}")

        # Display errors if any
        if error_lines and not result["success"]:
            print("\n🐛 Test Errors:")
            for line in error_lines[:20]:  # Limit to first 20 error lines
                if line:
                    print(f"  {line}")
            if len(error_lines) > 20:
                print(f"  ... and {len(error_lines) - 20} more error lines")

        # Display full output in verbose mode or if there are errors
        if not result["success"]:
            print("\n📋 Full Output:")
            print("-" * 30)
            print(output)

        print("-" * 50)

    def show_help(self):
        """Show help information."""
        help_text = """
TaaskMaaster Test Runner

Usage:
  python run_tests.py [OPTIONS] [TEST_TYPE]

Test Types:
  all              Run all tests (default)
  quick            Run quick tests (skip slow tests)
  infrastructure   Run infrastructure tests only
  backend          Run backend tests only
  frontend         Run frontend tests only
  integration      Run integration tests only
  coverage         Generate coverage report

Options:
  -v, --verbose    Verbose output
  -s, --start      Start services before testing
  -S, --stop       Stop services after testing
  -h, --help       Show this help message

Examples:
  python run_tests.py                    # Run all tests
  python run_tests.py quick              # Run quick tests
  python run_tests.py -v infrastructure  # Run infrastructure tests with
                                         # verbose output
  python run_tests.py -s all             # Start services and run all tests
  python run_tests.py coverage           # Generate coverage report
        """
        print(help_text)


def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="TaaskMaaster Test Runner")
    parser.add_argument(
        "test_type",
        nargs="?",
        default="all",
        choices=[
            "all",
            "quick",
            "infrastructure",
            "backend",
            "frontend",
            "integration",
            "coverage",
        ],
        help="Type of tests to run",
    )
    parser.add_argument(
        "-v", "--verbose", action="store_true", help="Verbose output"
    )
    parser.add_argument(
        "-s",
        "--start",
        action="store_true",
        help="Start services before testing",
    )
    parser.add_argument(
        "-S", "--stop", action="store_true", help="Stop services after testing"
    )
    parser.add_argument(
        "--show-help", action="store_true", help="Show detailed help message"
    )

    args = parser.parse_args()

    if args.show_help:
        TestRunner().show_help()
        return

    runner = TestRunner()

    # Log test run start
    runner.logger.logger.info(
        "Test run started",
        extra={
            "test_type": args.test_type,
            "verbose": args.verbose,
            "start_services": args.start,
            "stop_services": args.stop,
        },
    )

    print("🧪 TaaskMaaster Test Runner")
    print("=" * 50)

    start_time = time.time()

    try:
        # Check prerequisites
        if not runner.check_prerequisites():
            runner.logger.logger.error("Prerequisites check failed")
            sys.exit(1)

        # Check Docker build capability
        if not runner.check_docker_build():
            runner.logger.logger.error("Docker build check failed")
            sys.exit(1)

        # Start services if requested
        if args.start:
            if not runner.start_services():
                runner.logger.logger.error("Failed to start services")
                sys.exit(1)

        success = False

        # Run tests based on type
        if args.test_type == "all":
            success = runner.run_all_tests(args.verbose)
        elif args.test_type == "quick":
            success = runner.run_quick_tests(args.verbose)
        elif args.test_type == "infrastructure":
            success = runner.run_infrastructure_tests(args.verbose)
        elif args.test_type == "backend":
            success = runner.run_backend_tests(args.verbose)
        elif args.test_type == "frontend":
            success = runner.run_frontend_tests(args.verbose)
        elif args.test_type == "integration":
            success = runner.run_integration_tests(args.verbose)
        elif args.test_type == "coverage":
            success = runner.generate_coverage_report()

    except Exception as e:
        runner.logger.log_error(e, "main function")
        success = False

    finally:
        # Stop services if requested
        if args.stop:
            runner.stop_services()

        # Calculate total duration
        total_duration = time.time() - start_time

        # Log test run completion
        runner.logger.logger.info(
            "Test run completed",
            extra={
                "success": success,
                "total_duration": total_duration,
                "test_type": args.test_type,
            },
        )

        # Log summary
        log_file = runner.logger.get_log_file()
        if log_file:
            print(f"\n📝 Detailed logs saved to: {log_file}")

    # Print summary
    print("\n" + "=" * 50)
    if success:
        print("🎉 All tests completed successfully!")
        sys.exit(0)
    else:
        print("❌ Some tests failed. Check the output above for details.")
        sys.exit(1)


if __name__ == "__main__":
    main()
