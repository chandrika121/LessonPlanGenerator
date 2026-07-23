import argparse
import os

import uvicorn


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the FastAPI server")
    parser.add_argument(
        "--port", type=int, required=True, help="Port number to run the server on"
    )
    parser.add_argument(
        "--reload", type=str, default="false", help="Reload the server on code changes"
    )
    args = parser.parse_args()
    reload = args.reload == "true"
    bind_host = os.environ.get("PRESENTON_FASTAPI_BIND_HOST", "0.0.0.0").strip() or "0.0.0.0"
    public_host = os.environ.get("PRESENTON_FASTAPI_PUBLIC_HOST", "127.0.0.1").strip() or "127.0.0.1"

    # Keep the generated asset/base URL stable for the rest of the app while binding externally.
    os.environ["NEXT_PUBLIC_FAST_API"] = f"http://{public_host}:{args.port}"

    uvicorn.run(
        "api.main:app",
        host=bind_host,
        port=args.port,
        log_level="info",
        reload=reload,
    )
