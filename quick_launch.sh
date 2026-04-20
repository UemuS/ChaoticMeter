#!/bin/bash
tmux new-session -d -s dev -n frontend  "cd frontend && npm run dev --host; exec $SHELL"
tmux new-window   -t dev -n backend     "cd backend && source .venv/bin/activate && uvicorn app.main:app --reload; exec $SHELL"
tmux new-window   -t dev -n tunnel      "cloudflared tunnel --url http://localhost:8000; exec $SHELL"
tmux attach -t dev