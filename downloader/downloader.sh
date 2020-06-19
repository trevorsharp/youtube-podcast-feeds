#!/bin/bash

cd /app/data
touch .download.txt

mkdir /app/data/content
cd /app/data/content

while true
do
	youtube-dl --format=bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio --merge-output-format=mp4 --output="%(id)s.%(ext)s" --batch-file=/app/data/.download.txt
	sleep 60
done