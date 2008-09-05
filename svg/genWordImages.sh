#!/bin/bash
#### LEGACY DON'T NEED REAL IMAGES ANY MORE
FONT=Padauk
if test $# -gt 0
then WORDLISTS=$@
else WORDLISTS="/home/keith/projects/bibles/MyanmarBible.com/bible/Judson/index/WordList.txt /home/keith/projects/bibles/MyanmarBible.com/bible/SgawKaren/index/WordList.txt /home/keith/projects/padauk-dev/padauk-working/test/myHeadwords.txt cache.txt"
fi
FONTSIZE=12
TEMPFILE=`tempfile -p myword`

rm -rf ${FONT}Svgs_${FONTSIZE}
rm -rf ${FONT}_${FONTSIZE}
rm combinedWordList.txt
rm ${FONT}_${FONTSIZE}images.js

mkdir -p ${FONT}Svgs_${FONTSIZE}
mkdir -p ${FONT}_${FONTSIZE}
touch combinedWordList.txt
touch ${FONT}_${FONTSIZE}images.js
echo var fontImages_${FONT} = \{>${FONT}_${FONTSIZE}images.js
export count=$((0))
export showI=$((100))

for WORDLIST in $WORDLISTS;
do
    cat $WORDLIST | while text="`line`";
    do
        echo "$text" > $TEMPFILE;
        CODES=`echo "$text" |perl -e 'use encoding "utf8";
        while ($text=<STDIN>){$text=~s/\n//;
            for ($j=0;$j<length($text); $j++){printf("%04x",ord(substr($text,$j,$j+1)));}}'`;
        if ! test -f "${FONT}Svgs_${FONTSIZE}/${CODES}.svg";
        then
            # -b white
            grsvg ${FONT}.ttf --bounding-box -p ${FONTSIZE} -i $TEMPFILE -o "${FONT}Svgs_${FONTSIZE}/${CODES}.svg";
            width=`xsltproc svgWidth.xsl "${FONT}Svgs_${FONTSIZE}/${CODES}.svg"`;
            echo u${CODES}:[${width}],>>${FONT}_${FONTSIZE}images.js
            rsvg "${FONT}Svgs_${FONTSIZE}/${CODES}.svg" "${FONT}_${FONTSIZE}/${CODES}.png";
            echo "$text" >> combinedWordList.txt;
            count=$(($count+1))
            if (test $count -ge $showI)
            then echo $count; showI=$(($showI+100));
            fi
        fi
    done
done

rm $TEMPFILE
echo fontHeight:[$FONTSIZE],fontSize:[$FONTSIZE],maxCharLen:12\}\;>> ${FONT}_${FONTSIZE}images.js
echo myUnicode.imageFonts['${FONT}']=fontImages_${FONT}\;>> ${FONT}_${FONTSIZE}images.js


du ${FONT}Svgs_${FONTSIZE}
du ${FONT}_${FONTSIZE}

