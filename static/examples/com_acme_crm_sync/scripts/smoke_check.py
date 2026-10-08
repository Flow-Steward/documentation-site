from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RUNTIME = ROOT / "main.py"


def invoke(action_id: str, payload: dict[str, object]) -> dict[str, object]:
    completed = subprocess.run(
        [sys.executable, "-B", str(RUNTIME)],
        input=json.dumps(
            {"mode": "action", "action": {"action_id": action_id, "input": payload}}
        ),
        text=True,
        capture_output=True,
        check=False,
    )
    if completed.returncode != 0:
        raise AssertionError(
            f"{action_id} failed ({completed.returncode}): {completed.stderr or completed.stdout}"
        )
    return json.loads(completed.stdout)


def main() -> int:
    normalized = invoke("normalize_task_action", {"task_id": "synthetic-1"})
    assert normalized["result"]["normalized"] == {"task_id": "synthetic-1"}

    attachments = invoke("fetch_attachments", {"task_id": "synthetic-1"})
    assert attachments["result"]["attachments"] == []

    completion = invoke(
        "sync_completion_status",
        {
            "task_id": "synthetic-1",
            "final_status": "completed",
            "provider_key": "com.acme.crm-sync",
            "provider_config": {},
        },
    )
    assert completion["result"]["status"] == "completed"
    for request in (
        {"mode": "action", "action": {"action_id": "unknown", "input": {}}},
        {"mode": "unknown"},
    ):
        completed = subprocess.run(
            [sys.executable, "-B", str(RUNTIME)], input=json.dumps(request),
            text=True, capture_output=True, check=False,
        )
        response = json.loads(completed.stdout)
        assert completed.returncode == 2
        assert response["ok"] is False
        assert response["error_code"] and response["error"]
        assert response["errors"][0] == {
            "code": response["error_code"], "message": response["error"]
        }
    print("provider-free success and domain-error smoke checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
