#!/bin/sh

url=$1
filename=$(basename $1)

function download() {
    curl $url | plutil -convert json -o $1.json -
}

if [[ $filename = *".tmLanguage"* ]]; then
  download $(basename $filename .tmLanguage)
fi

if [[ $filename = *".plist"* ]]; then
  download $(basename $filename .plist)
fi