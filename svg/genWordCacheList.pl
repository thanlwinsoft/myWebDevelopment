#!/usr/bin/perl -w
use open ':utf8';
use encoding "utf8";

@medials = (
"",
#"\x{105E}",#mon na
#"\x{105F}",#mon ma
"\x{103B}",#ya
"\x{103C}",#ra
#"\x{1060}",#mon la
"\x{103D}",#wa
#"\x{1082}",#shan wa
"\x{103E}",#ha
"\x{103B}\x{103D}",#ya,wa
"\x{103B}\x{103E}",#ya,ha
"\x{103C}\x{103D}",#ra,wa
"\x{103C}\x{103E}",#ra,ha
"\x{103D}\x{103E}",#wa,ha
"\x{103C}\x{103D}\x{103E}",#ra,wa,ha
);

#@stackMedials = (
#"",
#"\x{103B}",#ya
#"\x{103C}"#ra
#);

@vowels = (
"",
#"\x{102B}",#tall aa
"\x{102C}",#aa
#"\x{1083}",#shan aa
#"\x{1072}",#kayah oe
"\x{102D}",#i
#"\x{1071}",#Geba Karen i
"\x{102E}",#ii
#"\x{1033}",#mon ii
#"\x{1067}",#w pwo eu
#"\x{1068}",#w pwo ue
"\x{102F}",#u
#"\x{1073}",#kayah u
#"\x{1062}",#Sgaw eu
#"\x{1074}",#kayah ee
"\x{1030}",#uu
#"\x{1056}",#vocalic r
#"\x{1057}",#vocalic rr
#"\x{1058}",#vocalic l 
#"\x{1059}",#vocalic ll
"\x{1031}",#e
#"\x{1084}",#shan e
#"\x{1035}",# e above
#"\x{1085}",# shan e above
"\x{1032}",#ai
#"\x{1031}\x{102B}",#tall aw High tone
"\x{1031}\x{102C}",# aw High tone
#"\x{1031}\x{102B}\x{103A}",#aw tall low tone
"\x{1031}\x{102C}\x{103A}",#aw low tone
#"\x{1034}",#mon o
"\x{1036}",# an
"\x{102D}\x{102F}",#o
#"\x{1063}",#Sgaw Hathi
#"\x{1064}",#Sgaw Ke Pho
#"\x{1086}"#shan final y
);

@allConsonants = (
("\x{1000}","\x{1075}"),#KA,shan
("\x{1001}","\x{1076}"),#KHA,shan
("\x{1002}","\x{1077}"),#GA,shan ga
"\x{1003}",#GHA
("\x{1004}","\x{105A}"),#NGA,mon
("\x{1005}","\x{1078}"),#CA,shan
"\x{1006}",#CHA
("\x{1007}","\x{1079}"),#JA,shan-za
("\x{1008}","\x{105B}","\x{1061}"),#JHA,mon,sgaw
("\x{1009}","\x{107A}"),#NYA,shan
"\x{100A}",#NNYA
"\x{100B}",#TTA
"\x{100C}",#TTHA
"\x{100D}",#DDA
"\x{100E}",#DDHA
("\x{100F}","\x{106E}"),#NNA,e-pwo
"\x{1010}",#TA
"\x{1011}",#THA
("\x{1012}","\x{107B}"),#DA,shan-da
"\x{1013}",#DHA
("\x{1014}","\x{107C}"),#NA,shan
"\x{1015}",#PA
("\x{1016}","\x{107D}","\x{107E}","\x{108E}"),#PHA,shan,shan-fa,palaung-fa
("\x{1017}","\x{107F}"),#BA,shan-ba
"\x{1018}",#BHA
"\x{1019}",#MA
"\x{101A}",#YA
"\x{101B}",#RA
"\x{101C}",#LA
"\x{101D}",#WA
("\x{1080}","\x{1050}","\x{1051}","\x{1065}","\x{101E}"),#shan-tha,SHA,SSA,w-pwo-tha,SA,
("\x{101F}","\x{1081}"),#HA,shan
("\x{1020}","\x{105C}","\x{106F}","\x{1070}"),#LLA,mon-bba,e-pwo-ywa,e-pwo-ghwa
("\x{1021}"),
"\x{1022}",#shan a
"\x{105D}",#mon bbe
#"\x{1028}",#mon e
"\x{1066}",#w pwo pwa
"\x{1052}",#vocalic r
"\x{1053}",#vocalic rr
"\x{1054}",#vocalic l 
"\x{1055}",#vocalic ll
);
@consonants = $allConsonants;

@consonants = (
(""),
("\x{1000}"),#KA,shan
("\x{1001}"),#KHA,shan
("\x{1002}"),#GA,shan ga
"\x{1003}",#GHA
("\x{1004}"),#NGA,mon
("\x{1005}"),#CA,shan
"\x{1006}",#CHA
("\x{1007}"),#JA,shan-za
("\x{1008}"),#JHA,mon,sgaw
("\x{1009}"),#NYA,shan
"\x{100A}",#NNYA
"\x{100B}",#TTA
"\x{100C}",#TTHA
"\x{100D}",#DDA
"\x{100E}",#DDHA
("\x{100F}"),#NNA,e-pwo
"\x{1010}",#TA
"\x{1011}",#THA
("\x{1012}"),#DA,shan-da
"\x{1013}",#DHA
("\x{1014}"),#NA,shan
"\x{1015}",#PA
("\x{1016}"),#PHA,shan,shan-fa,palaung-fa
("\x{1017}"),#BA,shan-ba
"\x{1018}",#BHA
"\x{1019}",#MA
"\x{101A}",#YA
"\x{101B}",#RA
"\x{101C}",#LA
"\x{101D}",#WA
("\x{101E}"),#shan-tha,SHA,SSA,w-pwo-tha,SA,
("\x{101F}"),#HA,shan
("\x{1020}"),#LLA,mon-bba,e-pwo-ywa,e-pwo-ghwa
("\x{1021}"),
#"\x{1022}",#shan a
#"\x{105D}",#mon bbe
#"\x{1028}",#mon e
#"\x{1066}",#w pwo pwa
#"\x{1052}",#vocalic r
#"\x{1053}",#vocalic rr
#"\x{1054}",#vocalic l 
#"\x{1055}",#vocalic ll
);

@killed = (
"\x{25cc}",
"\x{1000}",#0
"\x{1001}",#1
"\x{1002}",#2
"\x{1003}",#3
"\x{1004}",#4
"\x{1005}",#5
"\x{1006}",#6
"\x{1007}",#7
"\x{1009}",#8
"\x{100A}",#9
"\x{100B}",#10
"\x{100C}",#11
"\x{100D}",#12
"\x{100E}",#13
"\x{100F}",#14
"\x{1010}",#15
"\x{1011}",#16
"\x{1012}",#17
"\x{1013}",#18
"\x{1014}",#19
"\x{1015}",#20
"\x{1016}",#21
"\x{1017}",#22
"\x{1018}",#23
"\x{1019}",#24
"\x{101A}",#25
"\x{101B}",#26
"\x{101C}",#27
"\x{101D}",#28
"\x{101E}",#29
"\x{101F}",#30
"\x{1020}"
);

@tones = (
"",
#"\x{1069}",#w-pwo-1
"\x{1037}",#dot-below
#"\x{1087}",#shan-2
#"\x{108B}",#shan-council-2
#"\x{106A}",#w-pwo-2
#"\x{1062}\x{103A}",#sgaw karen
#"\x{1088}",#shan-3
#"\x{108C}",#shan-council-3
#"\x{106B}",#w-pwo-3
#"\x{102C}\x{103A}",#sgaw karen
#"\x{1038}",#visarga
#"\x{106C}",#w-pwo-4
#"\x{1037}\x{1038}",#sgaw karen
#"\x{1089}",#shan-5
#"\x{106D}",#w-pwo-5
#"\x{1063}\x{103A}",#sgaw karen
#"\x{108A}",#shan-6
#"\x{108D}",#shan-council-emphatic
#"\x{108F}",#paluang tone 6
#"\x{1064}"#sgaw karen
);

if ($#ARGV < 0) { die "No word list to find stackable consonants"; }
open(KNOWN,"<:utf8",$ARGV[0]) || die "Failed to open $ARGV[0]\n";
$words = "";
while ($line = <KNOWN>)
{
    $words = $words . $line;
}
close(KNOWN);
#fprintf(STDERR $words);

# CMVT
for ($c = 0; $c<=$#consonants; $c++)
{
for ($m = 0; $m<=$#medials; $m++)
{
for ($v = 0; $v<=$#vowels; $v++)
{
for ($t = 0; $t<=$#tones; $t++)
{
    printf("%s%s%s%s\n", $consonants[$c], $medials[$m], $vowels[$v], $tones[$t]);
    if ($consonants[$c] =~ /[\x{1001}\x{1002}\x{1004}\x{1012}\x{101d}]/)
    {
        printf("%s%s%s%s\n", $consonants[$c], $medials[$m], "ါ", $tones[$t]);
        printf("%s%s%s%s\n", $consonants[$c], $medials[$m], "ါ်", $tones[$t]);
        printf("%s%s%s%s\n", $consonants[$c], $medials[$m], "ေါ", $tones[$t]);
        printf("%s%s%s%s\n", $consonants[$c], $medials[$m], "ေါ်", $tones[$t]);
    }
}
}
}
}
# KT
for ($c = 0; $c<=$#killed; $c++)
{
#for ($m = 0; $m<=$#stackMedials; $m++)
#{
#for ($v = 0; $v<=$#vowels; $v++)
#{
for ($t = 0; $t<=$#tones; $t++)
{
#    printf("%s\x{103A}%s%s%s\n", $killed[$c], $stackMedials[$m], $vowels[$v], $tones[$t]);
    printf("%s\x{103A}%s\n", $killed[$c], $tones[$t]);
}
#}
#}
}


# KsCMVT
for ($k = 0; $k<=$#killed; $k++)
{
    $stacker = "\x{1039}";
    if ($killed[$k] eq "\x{1004}") { $stacker = "\x{103A}\x{1039}"; }
    for ($c = 0; $c<=$#consonants; $c++)
    {
        $match = $killed[$k] . $stacker . $consonants[$c];
        # $k ==0 is dotted circle
        if ($k == 0 || $words =~ /.*$match.*/)
        {
            #printf( "$match");
            for ($v = 0; $v<=$#vowels; $v++)
            {
            for ($t = 0; $t<=$#tones; $t++)
            {
                printf("%s%s%s%s%s\n", $killed[$k], $stacker, $consonants[$c], $vowels[$v], $tones[$t]);
            }
            }
        }
    }
}

print <<'EOT';
က်ျ
န်ု
က္ချ
န္တျ
န္တျ
သ္တြ
င်္◌
ဥုံ
တ္တွ
EOT


