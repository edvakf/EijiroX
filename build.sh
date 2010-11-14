#!/bin/sh

cd `dirname $0`

mkdir -p unite
cp -r src/* unite/
rm unite/manifest.json
cd unite
zip -r ../eijirox.ua *
cd ..


mkdir -p crx
cp -r src/* crx/
rm crx/config.xml
cd crx
zip -r ../eijirox.zip *
cd ..
