#!/bin/sh

cd `dirname $0`

if [ "$1" == "nozip" ]; then ZIP=""; else ZIP="yes"; fi

# chrome
echo "*** Creating .crx"
rm -r crx
cp -r src crx
#rsync -a --delete src crx
cd crx
rm oex.xml unite.xml widget.xml options.html
rm -r includes
if [ $ZIP ]; then
  zip -r ../eijirox.crx *
fi
cd ..
cp eijirox.crx eijirox.zip


# opera unite
echo "*** Creating .ua"
rm -r unite
cp -r src unite
#rsync -a --delete src unite
cd unite
mv unite.xml config.xml
rm oex.xml widget.xml options.html manifest.json
rm -r includes
if [ $ZIP ]; then
  zip -r ../eijirox.ua *
fi
cd ..


# opera extension
echo "*** Creating .oex"
rm -r oex
cp -r src oex
#rsync -a --delete src oex
cd oex
mv oex.xml config.xml
rm unite.xml widget.xml manifest.json
if [ $ZIP ]; then
  zip -r ../eijirox.oex *
fi
cd ..


# opera widget
echo "*** Creating .wgt"
rm -r widget
cp -r src widget
#rsync -a --delete src widget
cd widget
mv widget.xml config.xml
rm unite.xml oex.xml options.html manifest.json
rm -r includes
if [ $ZIP ]; then
  zip -r ../eijirox.wgt *
fi
cd ..

