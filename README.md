# ChaoticMeter

You submit something: a life choice, a bad idea, a very specific behavior. The internet votes on it using a 2D compass. Wholesome or questionable. Funny or dry. The crowd decides.

---

**Stack:** React + TypeScript + Vite, FastAPI + SQLite

---

**Running locally**

Backend:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn sqlalchemy pydantic
uvicorn app.main:app --reload
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

**How it works**

Posts get voted on via an interactive compass — click anywhere to place your judgment. Votes are averaged and mapped to a verdict. Nearby votes cluster into bigger dots so the graph stays readable at scale.

Voter identity is anonymous — just a UUID stored in localStorage.
