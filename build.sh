#!/bin/sh

cd `dirname $0`

# chrome
mkdir -p crx
cp -r src/* crx/
rm crx/config.xml
rm -r crx/includes/
cd crx
zip -r ../eijirox.crx *
cd ..


# opera unite
mkdir -p unite
cp -r src/* unite/
rm unite/manifest.json
rm -r unite/includes/
cp unite.xml unite/config.xml
cd unite
zip -r ../eijirox.ua *
cd ..


# opera extension
mkdir -p oex
cp -r src/* oex/
rm oex/manifest.json
cp oex.xml oex/config.xml
cd oex
zip -r ../eijirox.oex *
cd ..

