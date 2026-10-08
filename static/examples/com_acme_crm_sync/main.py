from __future__ import annotations

import json
import sys


def fail(code: str, message: str) -> int:
    print(json.dumps({
        "ok": False,
        "error_code": code,
        "error": message,
        "errors": [{"code": code, "message": message}],
    }))
    return 2


def main() -> int:
    request = json.loads(sys.stdin.read() or "{}")
    mode = str(request.get("mode") or "")
    if mode == "query":
        print(json.dumps({"ok": True, "result": {"status": "healthy", "configured": True}}))
        return 0
    if mode == "action":
        action = request.get("action", {})
        action_id = str(action.get("action_id") or "")
        payload = action.get("input", {})
        if action_id == "normalize_task_action":
            result = {"normalized": payload}
        elif action_id == "fetch_attachments":
            result = {"attachments": []}
        elif action_id == "sync_completion_status":
            result = {"status": str(payload.get("final_status") or payload.get("status") or "")}
        else:
            return fail("unknown_action", "The requested action is not supported.")
        print(json.dumps({"ok": True, "result": result}))
        return 0
    return fail("unknown_mode", "The requested mode is not supported.")


if __name__ == "__main__":
    raise SystemExit(main())
