#!/bin/bash

downloadList=$1
directory=$(dirname $1)
maximumQuality=$2
cookieFile=$3

youtubeBaseUrl="https://youtube.com/watch?v="

while read videoId; do

    if [ "$maximumQuality" != "true" ]; then
        highQualityVideoUrl=""
    else
        highQualityVideoUrl=$(yt-dlp -g -f "bv[height>1080][vcodec^=vp9]" ${cookieFile:+--cookies $cookieFile} "$youtubeBaseUrl$videoId" 2>/dev/null)
    fi

    if [ "$highQualityVideoUrl" == "" ]; then
        yt-dlp -f "bv[vcodec^=avc1]+ba[ext=m4a]" --merge-output-format=mp4 -o "$directory/%(id)s.temp.%(ext)s" ${cookieFile:+--cookies $cookieFile} "$youtubeBaseUrl$videoId" &
    else
        yt-dlp -f "bv[vcodec^=vp9]+ba[ext=m4a]" --merge-output-format=mkv -o "$directory/%(id)s.temp.%(ext)s" ${cookieFile:+--cookies $cookieFile} "$youtubeBaseUrl$videoId" &
        wait
        ffmpeg -i "$directory/$videoId.temp.mkv" -c:v libx264 -c:a copy -threads 0 -preset ultrafast -r 30 $directory/$videoId.temp.mp4 < /dev/null &
    fi

    wait
    mv $directory/$videoId.temp.mp4 $directory/$videoId.mp4
    rm $directory/$videoId.temp.mkv 2> /dev/null

done <$downloadList