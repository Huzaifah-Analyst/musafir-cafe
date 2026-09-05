"""Tiny static server that sends no-cache headers, so the browser always
fetches fresh files during development. Not needed in production.

Binds dual-stack (IPv6 + IPv4) so that http://localhost:PORT works whether
the browser resolves 'localhost' to ::1 (IPv6) or 127.0.0.1 (IPv4)."""
import http.server
import socket
import socketserver

PORT = 5179


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


class DualStackServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    address_family = socket.AF_INET6  # accepts IPv6 and (v4-mapped) IPv4

    def server_bind(self):
        # Turn off IPV6_V6ONLY so 127.0.0.1 also connects.
        try:
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        except (AttributeError, OSError):
            pass
        super().server_bind()


try:
    httpd = DualStackServer(("", PORT), NoCacheHandler)
except OSError:
    # Fall back to IPv4-only if dual-stack isn't available.
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("", PORT), NoCacheHandler)

print(f"Serving with no-cache on http://localhost:{PORT}  (Ctrl+C to stop)")
httpd.serve_forever()
