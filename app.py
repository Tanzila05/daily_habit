import http.server
import socketserver
import webbrowser
import threading
import sys

PORT = 8000

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Print logs to console
        sys.stderr.write("%s - - [%s] %s\n" %
                         (self.address_string(),
                          self.log_date_time_string(),
                          format%args))

def open_browser():
    webbrowser.open(f"http://localhost:{PORT}")

if __name__ == "__main__":
    # Open browser automatically after 1 second delay
    threading.Timer(1.0, open_browser).start()
    
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
            print(f"Serving AuraHabit at http://localhost:{PORT}")
            print("Press Ctrl+C to stop the server.")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        sys.exit(0)
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)
