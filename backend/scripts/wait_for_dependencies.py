import os
import socket
import sys
import time
from urllib.parse import urlparse


def wait_for_tcp(name: str, target: str, timeout_seconds: int = 60) -> None:
    parsed = urlparse(target)
    host = parsed.hostname
    port = parsed.port

    if not host or not port:
        print(f"[wait] {name}: skip, invalid target {target!r}")
        return

    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        try:
            with socket.create_connection((host, port), timeout=3):
                print(f"[wait] {name}: reachable at {host}:{port}")
                return
        except OSError:
            print(f"[wait] {name}: waiting for {host}:{port}...")
            time.sleep(2)

    raise TimeoutError(f"{name} is not reachable at {host}:{port}")


def main() -> int:
    database_url = os.getenv("DATABASE_URL", "")
    minio_endpoint = os.getenv("MINIO_ENDPOINT", "")

    if database_url:
        wait_for_tcp("database", database_url)
    if minio_endpoint:
        wait_for_tcp("minio", minio_endpoint)

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except TimeoutError as error:
        print(f"[wait] {error}", file=sys.stderr)
        raise SystemExit(1)
