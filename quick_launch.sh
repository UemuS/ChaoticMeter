#!/bin/bash
tmux new-session -d -s dev -n frontend  "cd frontend && npm run dev --host"
tmux new-window   -t dev -n backend     "cd backend && source .venv/bin/activate && uvicorn app.main:app --reload"
tmux new-window   -t dev -n tunnel      "cloudflared tunnel --url http://localhost:5173"
tmux attach -t dev