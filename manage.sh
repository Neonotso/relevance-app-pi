#!/bin/bash
# Relevance Task App Manager
# This script helps manage the Relevance Task App

APP_DIR="/Users/ryantaylorvegh/Desktop/relevance-app"
PID_FILE="/tmp/relevance-app.pid"
PORT=5173
TAILSCALE_IP="100.99.97.126"
LOG_FILE="/tmp/relevance-app.log"

start_app() {
    echo "Starting Relevance Task App..."
    
    # Kill any existing process on this port
    pkill -f "vite --port $PORT" 2>/dev/null
    
    cd "$APP_DIR"
    nohup npm run dev -- --host 0.0.0.0 --port $PORT > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    
    sleep 3
    
    if curl -s http://$TAILSCALE_IP:$PORT > /dev/null 2>&1; then
        echo "App started successfully on http://$TAILSCALE_IP:$PORT"
        echo "Logs: $LOG_FILE"
    else
        echo "Failed to start app. Check logs at $LOG_FILE"
        return 1
    fi
}

stop_app() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid 2>/dev/null
            echo "App stopped (PID: $pid)"
            rm "$PID_FILE"
        else
            echo "PID file exists but process not running. Cleaning up..."
            rm "$PID_FILE"
            pkill -f "vite --port $PORT" 2>/dev/null
        fi
    else
        pkill -f "vite --port $PORT" 2>/dev/null
        echo "App stopped"
    fi
}

status() {
    if [ -f "$PID_FILE" ] && ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
        echo "App is running at http://$TAILSCALE_IP:$PORT"
        echo "Logs: /tmp/relevance-app.log"
    else
        echo "App is not running"
    fi
}

restart() {
    stop_app
    sleep 1
    start_app
}

show_url() {
    echo "http://$TAILSCALE_IP:$PORT"
}

case "$1" in
    start)
        start_app
        ;;
    stop)
        stop_app
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
    *)
        echo "Usage: $0 {start|stop|restart|status|url}"
        echo ""
        echo "The app is accessible via Tailscale at http://$TAILSCALE_IP:$PORT"
        exit 1
        ;;
esac
