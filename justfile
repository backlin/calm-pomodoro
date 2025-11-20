build:
    npm run build

deploy: build
    rsync -avz --delete build/ NoFuss.io:/var/www/pomodoro/

