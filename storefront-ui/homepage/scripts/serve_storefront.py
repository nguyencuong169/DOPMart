"""Run the storefront and feedback API: python scripts/serve_storefront.py --db /path/outside/site/feedback.sqlite"""
import argparse
import json
import sqlite3
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class Storefront(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/api/feedback":
            return self.send_error(404)
        if self.headers.get_content_type() != "application/json":
            return self.send_error(415)
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if not 0 < size <= 16384:
                return self.send_error(413)
            data = json.loads(self.rfile.read(size))
            if not isinstance(data, dict):
                return self.send_error(400)
            topic, message, name = (data.get(key, "") for key in ("topic", "message", "name"))
            if not all(isinstance(value, str) for value in (topic, message, name)):
                return self.send_error(400)
            if topic not in ("product", "improvement", "experience") or not 0 < len(message.strip()) <= 2000 or len(name) > 80:
                return self.send_error(400)
        except (ValueError, UnicodeError):
            return self.send_error(400)
        try:
            with sqlite3.connect(self.server.database) as db:
                db.execute("INSERT INTO feedback(topic,message,name) VALUES(?,?,?)", (topic, message.strip(), name.strip()))
        except sqlite3.Error:
            return self.send_error(503)
        payload = b'{"received":true}'
        self.send_response(201)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", type=Path, required=True)
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    database = args.db.resolve()
    if database.is_relative_to(ROOT):
        parser.error("Choose a database path outside the static web directory.")
    with sqlite3.connect(database) as db:
        db.execute("CREATE TABLE IF NOT EXISTS feedback(id INTEGER PRIMARY KEY, created_at TEXT DEFAULT CURRENT_TIMESTAMP, topic TEXT NOT NULL, message TEXT NOT NULL, name TEXT NOT NULL)")
    server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(Storefront, directory=str(ROOT)))
    server.database = database
    server.serve_forever()
