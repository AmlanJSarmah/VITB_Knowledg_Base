# VITB_Knowledg_Base
A web app to store and query important university documents like question papers, books, notes etc. It comes with a locally trained llm model that can assist students in various academic endavoures.

## AI Tutor

The signed-in **AI Tutor** page sends chat requests through the authenticated server API. The server forwards them to the model wrapper, keeping the optional wrapper API key out of the browser.

Run the FastAPI wrapper from `model/` with `uvicorn main:app --reload --port 8000`. The wrapper also requires Ollama and the models configured in `model/config.py` to be available. Set `MODEL_API_URL` in `server/.env` if the wrapper is hosted somewhere else. To protect the wrapper with an API key, set `WRAPPER_API_KEY` to the same value in both `server/.env` and `model/.env`.
