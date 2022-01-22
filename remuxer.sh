#!/bin/bash

videocodec=$(ffprobe -loglevel error -select_streams v:0 -show_entries stream=codec_name -of default=nw=1:nk=1 "$1")
audiocodec=$(ffprobe -loglevel error -select_streams a:0 -show_entries stream=codec_name -of default=nw=1:nk=1 "$1")

if [ "$videocodec" = "h264" ] && [ "$audiocodec" = "aac" ]; then
  ffmpeg -y -i "$1" -codec copy "${1%.*}.part.mp4"
else
  ffmpeg -y -i "$1" -c:v libx264 -c:a aac "${1%.*}.part.mp4"
fi

mv "${1%.*}.part.mp4" "${1%.*}.mp4"
