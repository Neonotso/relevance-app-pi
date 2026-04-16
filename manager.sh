#!/bin/bash
# Relevance App Manager - Total Control

APP_DIR="/Users/ryantaylorvegh/Desktop/relevance-app"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_PID="/tmp/relevance-frontend.pid"
BACKEND_PID="/tmp/relevance-backend.pid"
FRONTEND_PORT=5173
BACKEND_PORT=3001
TAILSCALE_IP="100.99.97.126"

start_backend() {
    echo "Starting Relevance Backend API..."
    cd "$BACKEND_DIR"
    nohup npm start > /tmp/relevance-backend.log 2>&1 &
    echo $! > "$BACKEND_PID"
    sleep 2
    
    if curl -s http://$TAILSCALE_IP:$BACKEND_PORT/api/tasks > /dev/null 2>&1; then
        echo "Backend API started on http://$TAILSCALE_IP:$BACKEND_PORT"
    else
        echo "Failed to start backend. Check logs at /tmp/relevance-backend.log"
        return 1
    fi
}

start_frontend() {
    echo "Starting Relevance Frontend..."
    cd "$APP_DIR"
    nohup npm run dev -- --host 0.0.0.0 --port $FRONTEND_PORT > /tmp/relevance-frontend.log 2>&1 &
    echo $! > "$FRONTEND_PID"
    sleep 3
    
    if curl -s http://$TAILSCALE_IP:$FRONTEND_PORT | grep -q "Relevance Task App"; then
        echo "Frontend started on http://$TAILSCALE_IP:$FRONTEND_PORT"
    else
        echo "Failed to start frontend. Check logs at /tmp/relevance-frontend.log"
        return 1
    fi
}

start() {
    start_backend
    start_frontend
    echo ""
    echo "==================================="
    echo "App is running at:"
    echo "http://$TAILSCALE_IP:$FRONTEND_PORT"
    echo "==================================="
}

stop() {
    pkill -f "vite --port $FRONTEND_PORT" 2>/dev/null
    pkill -f "vite --port $BACKEND_PORT" 2>/dev/null
    pkill -f "node server.js" 2>/dev/null
    
    rm -f "$FRONTEND_PID" "$BACKEND_PID"
    echo "All services stopped"
}

status() {
    local frontend_running=false
    local backend_running=false
    
    if curl -s http://$TAILSCALE_IP:$FRONTEND_PORT | grep -q "Relevance Task App" 2>/dev/null; then
        frontend_running=true
        echo "Frontend: Running (http://$TAILSCALE_IP:$FRONTEND_PORT)"
    else
        echo "Frontend: Not running"
    fi
    
    if curl -s http://$TAILSCALE_IP:$BACKEND_PORT/api/tasks > /dev/null 2>&1; then
        backend_running=true
        echo "Backend: Running (http://$TAILSCALE_IP:$BACKEND_PORT)"
    else
        echo "Backend: Not running"
    fi
    
    echo ""
    echo "Data location: /Users/ryantaylorvegh/Desktop/relevance-app/backend/tasks.json"
}

restart() {
    stop
    sleep 1
    start
}

show_url() {
    echo "http://$TAILSCALE_IP:$FRONTEND_PORT"
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    url)
        show_url
        ;;
    backend-start)
        start_backend
        ;;
    frontend-start)
        start_frontend
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|url|backend-start|frontend-start}"
        echo ""
        echo "App URL: http://$TAILSCALE_IP:$FRONTEND_PORT"
        exit 1
        ;;
esac
