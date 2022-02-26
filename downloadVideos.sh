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
        yt-dlp \
            -f "bv[vcodec^=avc1]+ba[ext=m4a]" \
            --merge-output-format=mp4 \
            -o "$directory/%(id)s.%(ext)s" \
            ${cookieFile:+--cookies $cookieFile} \
            "$youtubeBaseUrl$videoId" &
        wait
    else
        yt-dlp \
            -f "bv[vcodec^=vp9]+ba[ext=m4a]" \
            --merge-output-format=mkv \
            -o "$directory/%(id)s.%(ext)s" \
            ${cookieFile:+--cookies $cookieFile} \
            "$youtubeBaseUrl$videoId" &
        wait

        mkdir $directory/$videoId

        ffmpeg \
            -i "$directory/$videoId.mkv" \
            -c:v libx264 \
            -c:a copy \
            -preset ultrafast \
            -r 30 \
            -start_number 0 \
            -hls_time 10 \
            -hls_list_size 0 \
            -f hls \
            -hls_segment_filename "$directory/$videoId/%d.ts" \
            $directory/$videoId/index.temp.m3u8 < /dev/null &
        wait 
        
        mv $directory/$videoId/index.temp.m3u8 $directory/$videoId/index.m3u8
        rm $directory/$videoId.mkv
    fi

done <$downloadList