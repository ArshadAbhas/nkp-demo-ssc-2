FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY .env .

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health/live').read()"

# Assuming Flask/Gunicorn or FastAPI/Uvicorn, force it to bind to 0.0.0.0
# If using pure Flask development server, use: CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]
# If using a basic python script, ensure app.py has app.run(host='0.0.0.0', port=5000) inside it.
CMD ["python", "app.py"]