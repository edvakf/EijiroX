#!/usr/bin/ruby -Ku
# -*- coding: utf-8 -*-
# this code is derived from TinySegmenter

# TinySegmenter 0.1 -- Super compact Japanese tokenizer in Javascript
# (c) 2008 Taku Kudo <taku@chasen.org>
# TinySegmenter is freely distributable under the terms of a new BSD licence.
# For details, see http://chasen.org/~taku/software/TinySegmenter/LICENCE.txt

$BIAS__ = -332
$BC1__ = {22=>6,33=>2461,24=>406,27=>-1378}
$BC2__ = {55=>-3267,35=>2744,65=>-878,22=>-4070,12=>-1711,62=>4012,72=>3761,53=>1327,23=>-1184,33=>-1332,43=>1721,73=>5492,34=>3831,44=>-8741,21=>-3132,41=>3334,77=>-2920}
$BC3__ = {22=>996,32=>626,42=>-721,62=>-1307,72=>-836,23=>-301,44=>2762,41=>1079,11=>4034,57=>-1652,27=>266}
$BP1__ = {88=>295,87=>304,77=>-125,89=>352}
$BP2__ = {78=>60,77=>-1762}
$BQ1__ = {228=>1150,128=>1521,338=>-1158,138=>886,218=>1208,268=>449,278=>-91,778=>-2597,327=>451,237=>-296,547=>1851,247=>-1020,447=>904,777=>2965}
$BQ2__ = {228=>118,328=>-1159,128=>466,238=>-919,448=>-1720,748=>864,227=>-1139,127=>-181,237=>153,329=>-1146}
$BQ3__ = {228=>-792,328=>2664,338=>-299,348=>419,218=>937,118=>8335,668=>998,278=>775,227=>2174,127=>439,337=>280,247=>1798,347=>-793,747=>-2242,217=>-2402,777=>11699}
$BQ4__ = {228=>-3895,238=>3761,338=>-4654,438=>1348,448=>-1806,318=>-3385,778=>-12396,257=>926,227=>266,427=>-2036,667=>-973}
$BW1__ = {1239200044=>660,2151600044=>727,123540004900066=>1404,215160004900066=>542,1239212289=>660,2151612289=>727,1239212301=>1682,1238712354=>1505,1235812356=>1743,1238712356=>-2055,1242712356=>672,1237512358=>-4817,1243512358=>665,1242512363=>3472,1242512364=>600,1235812371=>-790,1239212371=>2083,1243512371=>-1262,1242512373=>-4143,1243512373=>4573,1238312375=>2641,1239012375=>1104,1239112377=>-3399,1237112381=>1977,1242812381=>-871,1238512383=>1122,1241712383=>601,1238312387=>3463,1235612388=>-802,1235612390=>805,1236512390=>1249,1236512391=>1127,1237712391=>3445,1239912391=>844,1235612392=>-4915,1241512392=>1922,1237112393=>3887,1235612394=>5713,1238712394=>3015,1239312394=>7379,1243512394=>-1113,1237512395=>2468,1239912395=>1498,1241812395=>1671,2355012395=>-912,1996812398=>-501,2001312398=>741,1237912414=>2448,1239112414=>1711,1241412414=>2600,1242712414=>-2155,1241612420=>-1947,1238712424=>-2565,1238312428=>2369,1239112428=>-913,1237512434=>1860,3521112434=>731,1236720129=>-1886,3711720140=>2558,1242621462=>-2784,1236522823=>-2604,3844222823=>1497,2604124179=>-2314,1236524341=>-1336,2641226085=>-195,2440326412=>-2423,2608527598=>-2113,2535130446=>-724,123546529765314=>1404,215166529765314=>542,1239265379=>1682}
$BW2__ = {4600046=>-11822,4900049=>-669,821308213=>-5730,872208722=>-13175,1235812356=>-1609,1236312358=>2490,1237512363=>-1350,1241812363=>-602,1242512363=>-7194,1242812363=>4612,1235612364=>853,1242512364=>-3198,1238312365=>1941,1239412367=>-1597,1239212371=>-8392,1239812371=>-4193,1237912373=>4533,1242812373=>13168,1243512373=>-3977,1235612375=>-1819,1236312375=>-545,1238312375=>5078,1239012375=>972,1239412375=>939,1239812381=>-3744,1235612383=>-1253,1238312383=>-662,1238412383=>-3857,1238512383=>-786,1239212383=>1224,1239912383=>-939,1238312387=>4589,1239012387=>1647,1239212387=>-2094,1235612390=>6144,1236512390=>3640,1236712390=>2551,1239912390=>-3110,1241812390=>-3065,1235612391=>2666,1236512391=>-1528,1237512391=>-3828,1237712391=>-4761,1241812391=>-4203,1235612392=>1890,1237112392=>-1746,1239212392=>-2279,1239812392=>720,1241512392=>5168,1241812392=>-3941,1235612394=>-2488,1236412394=>-1313,1239312394=>-6509,1239812394=>2614,1243512394=>3099,1236212395=>-1615,1237512395=>2748,1239412395=>2454,1242412395=>-7236,2355012395=>-14943,2446712395=>-4688,3830612395=>-11388,1236312398=>2093,1239112398=>-7059,1239512398=>-6041,1239812398=>-6125,1235612399=>1073,1236412399=>-1033,1237812399=>-2532,1242812400=>1813,1237512414=>-1316,1239112414=>-6621,1242812414=>5409,1239012417=>-3153,1235612418=>2230,1239812418=>-10713,1236312425=>-944,1237512425=>-1611,1239512425=>-1897,1237512426=>651,1241412426=>1620,1238312428=>4270,1239012428=>849,1240012428=>4114,1235812429=>6067,1242812431=>7901,3689012434=>-11877,1238412435=>728,1239412435=>-4115,2015419968=>602,2604119968=>-1375,2608519968=>970,3709619968=>-1051,1236419978=>-4479,3103820250=>-1116,1239020986=>2163,1239820998=>-7758,2082621516=>970,2608521516=>-913,3844222823=>-2471,2172922996=>-1250,1239423569=>-1050,2423024180=>-8669,3829124180=>-1626,3047624220=>-2363,2717725163=>-1982,3286226032=>-4066,2603226085=>-722,2641226085=>-7068,3185926085=>3372,2608526332=>-601,3985426397=>-2355,2015426412=>-2697,2014026481=>-1543,1239228982=>-1384,2025031038=>-1276,1239031435=>-990,1239531532=>-1612,2226931859=>-4268,6529765297=>-669}
$BW3__ = {1238312354=>-2194,1242612354=>719,1242712354=>3846,4612356=>-1185,1229012356=>-1185,1235612356=>5308,1236012356=>2079,1236712356=>3029,1238312356=>2056,1238712356=>1883,1242712356=>5600,1243112356=>1527,1238512358=>1117,1239212358=>4798,1239212360=>1454,4612363=>2857,1229012363=>2857,1236912363=>-743,1238712363=>-4098,1239512363=>-669,1242512363=>6520,1242612363=>-2670,4412364=>1816,1228912364=>1816,1236512364=>-4855,1236912364=>-1127,1238712364=>-913,1242512364=>-4977,1242612364=>-2064,1238312365=>1645,1239312369=>1374,1239212371=>7397,1239812371=>1542,1242912371=>-2757,1235612373=>-714,1243412373=>976,4412375=>1557,1228912375=>1557,1235612375=>-3714,1238312375=>3562,1239012375=>1449,1239412375=>2608,1241412375=>1200,4612377=>-1310,1229012377=>-1310,1242712377=>6521,4412378=>3426,1228912378=>3426,1239512378=>841,1235812381=>428,4612383=>8875,1229012383=>8875,1235612383=>-594,1239812383=>812,1242612383=>-1183,1242712383=>-853,4612384=>4098,1229012384=>4098,1238712384=>1004,1238312387=>-4748,1239012387=>300,1235612390=>6240,1236212390=>855,1241812390=>302,1237712391=>1437,1239512391=>-1482,1239912391=>2295,1235812392=>-1387,1237512392=>2266,1239812392=>541,1241812392=>-3543,1235812393=>4664,1235612394=>1796,1236712394=>-903,1239312394=>2135,4412395=>-1021,1228912395=>-1021,1237512395=>1771,1239412395=>1906,1239912395=>2644,4412398=>-724,1228912398=>-724,2337612398=>-1000,4412399=>1337,1228912399=>1337,1236512409=>2181,1237512414=>1113,1237712414=>6943,1238712414=>-1549,1239112414=>6154,1242812414=>-793,1237512425=>1479,1242812425=>6820,1242712427=>3818,4412428=>854,1228912428=>854,1238312428=>1850,1239012428=>1375,1240012428=>-3246,1242712428=>1091,1242812431=>-605,1238412435=>606,1239112435=>798,2637612459=>990,3569620250=>860,1242620837=>1232,2025022823=>2217,1241722987=>1681,24066=>965,3286226032=>-5055,4426085=>974,1228926085=>974,2025031038=>2024,2637665398=>990}
$TC1__ = {555=>1093,222=>1029,122=>580,332=>998,272=>-390,172=>-331,323=>1169,273=>-142,373=>-1015,173=>467,211=>187,377=>-1832}
$TC2__ = {722=>2088,332=>-1023,112=>-1154,323=>-1965,244=>703,337=>-2649}
$TC3__ = {555=>-294,222=>346,322=>-341,332=>-1088,432=>731,272=>-1486,223=>128,323=>-3041,723=>-1935,233=>-825,133=>-1035,373=>-542,224=>-1216,544=>491,244=>-1217,474=>-1009,221=>-2694,121=>-457,721=>123,211=>-471,266=>-1689,766=>662,727=>-3393}
$TC4__ = {222=>-203,322=>1344,422=>365,122=>-122,622=>182,722=>669,232=>804,332=>679,272=>446,223=>695,723=>-2324,233=>321,333=>1497,733=>656,773=>54,454=>4845,544=>3386,444=>3065,221=>-405,321=>201,211=>-241,111=>661,171=>841}
$TQ1__ = {2228=>-227,3228=>316,2328=>-132,2238=>60,3338=>1595,2268=>-744,2278=>225,7778=>-908,4457=>482,2227=>281,2327=>249,3237=>200,2337=>-68}
$TQ2__ = {2238=>-1401,3338=>-1033,4548=>-543,7778=>-5591}
$TQ3__ = {2228=>478,1228=>-1073,2328=>222,3328=>-504,2338=>-116,3338=>-105,3218=>-863,1218=>-464,2178=>620,2227=>346,3227=>1729,3327=>997,2127=>481,2237=>623,2337=>1344,4547=>2792,2247=>587,5447=>679,2277=>110,3377=>-685}
$TQ4__ = {2228=>-721,1228=>-3604,3328=>-966,2338=>-607,3338=>-2181,5557=>-2763,4457=>180,2227=>-294,3227=>2446,7227=>480,2327=>-1573,2237=>1935,3237=>-493,2337=>626,3337=>-4007,4547=>-8156}
$TW1__ = {123561238812395=>-4681,371172014026481=>2026}
$TW2__ = {312431242712354=>-2049,123831238712356=>-1256,123641242912371=>-2434,123581242312375=>3873,244601239812381=>-4430,123901238712384=>-1049,123831235612390=>1833,123901237512392=>-4657,123951241812392=>-4517,123911239812418=>1882,123952767119968=>-792,123901241721021=>-1512,123952617821516=>-8097,123941236522823=>-1255,123901237523550=>-2721,208262025031038=>-3216}
$TW3__ = {123841238312356=>-1734,123561239012375=>1314,123901237512392=>-4314,123561238812395=>-5483,123871239212395=>-5989,123832440312395=>-6247,441239112398=>-727,122891239112398=>-727,123981241812398=>-600,124251236312428=>-3752,263762010821313=>-2287}
$TW4__ = {461235812356=>8576,122901235812356=>8576,123941242512363=>-2348,123561239012375=>2958,441236412383=>1516,122891236412383=>1516,124271235612390=>1538,123581235612392=>1349,123831237512414=>5543,124351237912414=>1097,123921235812424=>-4258,123921242712424=>5865}
$UC1__ = {5=>484,4=>93,1=>645,7=>-505}
$UC2__ = {5=>819,2=>1059,3=>409,1=>3987,6=>5775,7=>646}
$UC3__ = {5=>-1370,3=>2311}
$UC4__ = {5=>-2643,2=>1809,3=>-1032,4=>-3450,1=>3565,6=>3876,7=>6646}
$UC5__ = {2=>313,3=>-1238,4=>-799,1=>539,7=>-831}
$UC6__ = {2=>-506,3=>-253,4=>87,1=>247,7=>-387}
$UP1__ = {7=>-214}
$UP2__ = {8=>69,7=>935}
$UP3__ = {8=>189}
$UQ1__ = {28=>21,38=>-12,48=>-99,68=>142,78=>-56,27=>-95,37=>477,47=>410,77=>-2422}
$UQ2__ = {28=>216,38=>113,47=>1759}
$UQ3__ = {58=>-479,28=>42,38=>1913,48=>-7198,18=>3160,68=>6427,78=>14761,37=>-827,67=>-3212}
$UW1__ = {44=>156,12289=>156,12300=>-463,12354=>-941,12358=>-127,12364=>-553,12365=>121,12371=>505,12391=>-201,12392=>-547,12393=>-123,12395=>-789,12398=>-185,12399=>-847,12418=>-466,12420=>-470,12424=>182,12425=>-292,12426=>208,12428=>169,12434=>-446,12435=>-137,12539=>-135,20027=>-402,20140=>-268,21306=>-912,21320=>871,22269=>-460,22823=>561,22996=>729,24066=>-411,26085=>-141,29702=>361,29983=>-408,30476=>-386,37117=>-718,65378=>-463,65381=>-135}
$UW2__ = {44=>-829,12289=>-829,12295=>892,12300=>-645,12301=>3145,12354=>-538,12356=>505,12358=>134,12362=>-502,12363=>1454,12364=>-856,12367=>-412,12371=>1141,12373=>878,12374=>540,12375=>1529,12377=>-675,12379=>300,12381=>-1011,12383=>188,12384=>1837,12388=>-949,12390=>-291,12391=>-268,12392=>-981,12393=>1273,12394=>1063,12395=>-1764,12398=>130,12399=>-409,12402=>-1273,12409=>1261,12414=>600,12418=>-1263,12420=>-402,12424=>1639,12426=>-579,12427=>-694,12428=>571,12434=>-2516,12435=>2095,12450=>-587,12459=>306,12461=>568,12483=>831,19977=>-758,19981=>-2150,19990=>-302,20013=>-968,20027=>-861,20107=>492,20154=>-123,20250=>978,20445=>362,20837=>548,21021=>-3025,21103=>-1566,21271=>-3414,21306=>-422,22823=>-1769,22825=>-865,22826=>-483,23376=>-1519,23398=>760,23455=>1023,23567=>-2009,24066=>-813,24180=>-1060,24375=>1067,25163=>-1519,25594=>-1033,25919=>1522,25991=>-1355,26032=>-1682,26085=>-1815,26126=>-1462,26368=>-630,26397=>-1843,26412=>-1650,26481=>-931,26524=>-665,27425=>-2378,27665=>-180,27671=>-1740,29702=>752,30330=>529,30446=>-1584,30456=>-242,30476=>-1165,31435=>-763,31532=>810,31859=>509,33258=>-1353,34892=>838,35199=>-744,35211=>-3874,35519=>1010,35696=>1198,36796=>3041,38283=>1758,38291=>-1257,65378=>-645,65379=>3145,65391=>831,65393=>-587,65398=>306,65399=>568}
$UW3__ = {44=>4889,49=>-800,8722=>-1723,12289=>4889,12293=>-2311,12295=>5827,12301=>2670,12307=>-3573,12354=>-2696,12356=>1006,12358=>2342,12360=>1983,12362=>-4864,12363=>-1163,12364=>3271,12367=>1004,12369=>388,12370=>401,12371=>-3552,12372=>-3116,12373=>-1058,12375=>-395,12377=>584,12379=>3685,12381=>-5228,12383=>842,12385=>-521,12387=>-1444,12388=>-1081,12390=>6167,12391=>2318,12392=>1691,12393=>-899,12394=>-2788,12395=>2745,12398=>4056,12399=>4555,12402=>-2171,12405=>-1798,12408=>1199,12411=>-5516,12414=>-4384,12415=>-120,12417=>1205,12418=>2323,12420=>-788,12424=>-202,12425=>727,12426=>649,12427=>5905,12428=>2773,12431=>-1207,12434=>6620,12435=>-518,12450=>551,12464=>1319,12473=>874,12483=>-1350,12488=>521,12512=>1109,12523=>1591,12525=>2201,12531=>278,12539=>-3794,19968=>-1619,19979=>-1759,19990=>-2087,20001=>3815,20013=>653,20027=>-758,20104=>-1193,20108=>974,20154=>2742,20170=>792,20182=>1889,20197=>-1368,20302=>811,20309=>4265,20316=>-361,20445=>-2439,20803=>4858,20826=>3593,20840=>1574,20844=>-3030,20845=>755,20849=>-1880,20870=>5807,20877=>3095,20998=>457,21021=>2475,21029=>1129,21069=>2286,21103=>4437,21147=>365,21205=>-949,21209=>-1872,21270=>1327,21271=>-1038,21306=>4646,21315=>-2309,21320=>-783,21332=>-1006,21475=>483,21491=>1233,21508=>3588,21512=>-241,21516=>3906,21644=>-837,21729=>4513,22269=>642,22411=>1389,22580=>1219,22806=>-241,22971=>2016,23398=>-1356,23433=>-423,23455=>-1008,23478=>1078,23567=>-513,23569=>-3102,24030=>1155,24066=>3197,24179=>-1804,24180=>2416,24195=>-1030,24220=>1605,24230=>1452,24314=>-2352,24403=>-3885,24471=>1905,24605=>-1291,24615=>1822,25144=>-488,25351=>-3973,25919=>-2013,25945=>-1479,25968=>3222,25991=>-1489,26032=>1764,26085=>2099,26087=>5792,26152=>-661,26178=>-1248,26332=>-951,26368=>-937,26376=>4125,26399=>360,26446=>3094,26449=>364,26481=>-805,26680=>5156,26862=>2438,26989=>484,27663=>2613,27665=>-1694,27770=>-1073,27861=>1868,28023=>-495,28961=>979,29289=>461,29305=>-3850,29983=>-273,29992=>914,30010=>1215,30340=>7313,30452=>-1835,30465=>792,30476=>6293,30693=>-1528,31169=>4231,31246=>401,31435=>-960,31532=>1201,31859=>7767,31995=>3066,32004=>3663,32026=>1384,32113=>-4229,32207=>1163,32218=>1255,32773=>6457,33021=>725,33258=>-2869,33521=>785,35211=>1044,35519=>-562,36001=>-733,36027=>1777,36554=>1835,36557=>1375,36796=>-1504,36890=>-1136,36984=>-681,37070=>1026,37089=>4404,37096=>1200,37329=>2163,38263=>421,38283=>-1432,38291=>1302,38306=>-1282,38632=>2009,38651=>-1045,38750=>2066,39365=>1620,65297=>-800,65379=>2670,65381=>-3794,65391=>-1350,65393=>551,6543865400=>1319,65405=>874,65412=>521,65425=>1109,65433=>1591,65435=>2201,65437=>278}
$UW4__ = {44=>3930,46=>3508,8213=>-4841,12289=>3930,12290=>3508,12295=>4999,12300=>1895,12301=>3798,12307=>-5156,12354=>4752,12356=>-3435,12358=>-640,12360=>-2514,12362=>2405,12363=>530,12364=>6006,12365=>-4482,12366=>-3821,12367=>-3788,12369=>-4376,12370=>-4734,12371=>2255,12372=>1979,12373=>2864,12375=>-843,12376=>-2506,12377=>-731,12378=>1251,12379=>181,12381=>4091,12383=>5034,12384=>5408,12385=>-3654,12387=>-5882,12388=>-1659,12390=>3994,12391=>7410,12392=>4547,12394=>5433,12395=>6499,12396=>1853,12397=>1413,12398=>7396,12399=>8578,12400=>1940,12402=>4249,12403=>-4134,12405=>1345,12408=>6665,12409=>-744,12411=>1464,12414=>1051,12415=>-2082,12416=>-882,12417=>-5046,12418=>4169,12419=>-2666,12420=>2795,12423=>-1544,12424=>3351,12425=>-2922,12426=>-9726,12427=>-14896,12428=>-2613,12429=>-4570,12431=>-1783,12434=>13150,12435=>-2352,12459=>2145,12467=>1789,12475=>1287,12483=>-724,12488=>-403,12513=>-1635,12521=>-881,12522=>-541,12523=>-856,12531=>-3637,12539=>-4371,12540=>-11870,19968=>-2069,20013=>2210,20104=>782,20107=>-190,20117=>-1768,20154=>1036,20197=>544,20250=>950,20307=>-1286,20316=>530,20596=>4292,20808=>601,20826=>-2006,20849=>-1212,20869=>584,20870=>788,21021=>1347,21069=>1623,21103=>3879,21147=>-302,21205=>-740,21209=>-2715,21270=>776,21306=>4517,21332=>1013,21442=>1555,21512=>-1834,21644=>-681,21729=>-910,22120=>-851,22238=>1500,22269=>-619,22290=>-1200,22320=>866,22580=>-1410,22593=>-2094,22763=>-1413,22810=>1067,22823=>571,23376=>-4802,23398=>-1397,23450=>-1057,23546=>-809,23567=>1910,23627=>-1328,23665=>-1500,23798=>-2056,24029=>-2667,24066=>2771,24180=>374,24193=>-4556,24460=>456,24615=>553,24863=>916,25152=>-1566,25903=>856,25913=>787,25919=>2182,25945=>704,25991=>522,26041=>-856,26085=>1798,26178=>1829,26368=>845,26376=>-9066,26408=>-485,26469=>-442,26657=>-360,26989=>-1043,27663=>5388,27665=>-2716,27671=>-910,27810=>-939,28168=>-543,29289=>-735,29575=>672,29699=>-1267,29983=>-1286,29987=>-1101,30000=>-2900,30010=>1826,30340=>2586,30446=>922,30465=>-3485,30476=>2997,31354=>-867,31435=>-2112,31532=>788,31859=>2937,31995=>786,32004=>2171,32076=>1146,32113=>-1169,32207=>940,32218=>-994,32626=>749,32773=>2145,33021=>-730,33324=>-852,34892=>-792,35215=>792,35686=>-1184,35696=>-244,35895=>-1000,36062=>730,36554=>-1481,36557=>1158,36650=>-1433,36796=>-3370,36817=>929,36947=>-1291,36984=>2596,37070=>-4866,37117=>1192,37326=>-1100,37504=>-2213,38263=>357,38291=>-2344,38498=>-2297,38555=>-2604,38651=>-878,38936=>-1659,38988=>-792,39208=>-1984,39318=>1749,39640=>2120,65378=>1895,65379=>3798,65381=>-4371,65391=>-724,65392=>-11870,65398=>2145,65402=>1789,65406=>1287,65412=>-403,65426=>-1635,65431=>-881,65432=>-541,65433=>-856,65437=>-3637}
$UW5__ = {44=>465,46=>-299,49=>-514,82=>-32768,93=>-2762,12289=>465,12290=>-299,12300=>363,12354=>1655,12356=>331,12358=>-503,12360=>1199,12362=>527,12363=>647,12364=>-421,12365=>1624,12366=>1971,12367=>312,12370=>-983,12373=>-1537,12375=>-1371,12377=>-852,12384=>-1186,12385=>1093,12387=>52,12388=>921,12390=>-18,12391=>-850,12392=>-127,12393=>1682,12394=>-787,12395=>-1224,12398=>-635,12399=>-578,12409=>1001,12415=>502,12417=>865,12419=>3350,12423=>854,12426=>-208,12427=>429,12428=>504,12431=>419,12434=>-1264,12435=>327,12452=>241,12523=>451,12531=>-343,20013=>-871,20140=>722,20250=>-1153,20826=>-654,21209=>3519,21306=>-901,21578=>848,21729=>2104,22823=>-1296,23398=>-548,23450=>1785,23888=>-1304,24066=>-2991,24109=>921,24180=>1763,24605=>872,25152=>-814,25369=>1618,26032=>-1682,26085=>218,26376=>-4353,26619=>932,26684=>1356,27231=>-1508,27663=>-1347,30000=>240,30010=>-3912,30340=>-3149,30456=>1319,30465=>-1052,30476=>-4003,30740=>-997,31038=>-278,31354=>-813,32113=>1955,32773=>-2233,34920=>663,35486=>-1073,35696=>1219,36984=>-1018,37070=>-368,38263=>786,38291=>1191,38988=>2368,39208=>-689,65297=>-514,6529865317=>-32768,65378=>363,65394=>241,65433=>451,65437=>-343}
$UW6__ = {44=>227,46=>808,49=>-270,80=>306,12289=>227,12290=>808,12354=>-307,12358=>189,12363=>241,12364=>-73,12367=>-121,12371=>-200,12376=>1782,12377=>383,12383=>-428,12387=>573,12390=>-1014,12391=>101,12392=>-105,12394=>-253,12395=>-149,12398=>-417,12399=>-236,12418=>-206,12426=>187,12427=>-135,12434=>195,12523=>-673,12531=>-496,19968=>-277,20013=>201,20214=>-800,20250=>624,21069=>302,21306=>1792,21729=>-1212,22996=>798,23398=>-960,24066=>887,24195=>-695,24460=>535,26989=>-697,30456=>753,31038=>-507,31119=>974,31354=>-822,32773=>1811,36899=>463,37070=>1082,65297=>-270,6529765317=>306,65433=>-673,65437=>-496}


$re_M = lambda {|c| # /[一二三四五六七八九十百千万億兆]/
  c == 19968 ||
  c == 20108 ||
  c == 19977 ||
  c == 22235 ||
  c == 20116 ||
  c == 20845 ||
  c == 19971 ||
  c == 20843 ||
  c == 20061 ||
  c == 21313 ||
  c == 30334 ||
  c == 21315 ||
  c == 19975 ||
  c == 20740 ||
  c == 20806
}
$re_H = lambda {|c| # /[一-龠々〆ヵヶ]/
  (c >= 19968 && c <= 40864) ||
  c == 12293 ||
  c == 12294 ||
  c == 12533 ||
  c == 12534
}
$re_I = lambda {|c| # /[ぁ-ん]/
  c >= 12353 && c <= 12435
}
$re_K = lambda {|c| # /[ァ-ヴーｱ-ﾝﾞｰ]/
  (c >= 12449 && c <= 12532) ||
  c == 12540 ||
  (c >= 65393 && c <= 65437) ||
  c == 65438 ||
  c == 65392
}
$re_A = lambda {|c| # /[a-zA-Zａ-ｚＡ-Ｚ]/
  (c >= 97 && c <= 122) ||
  (c >= 65 && c <= 90) ||
  (c >= 65345 && c <= 65370) ||
  (c >= 65313 && c <= 65338)
}
$re_N = lambda {|c| # /[0-9０-９]/
  (c >= 48 && c <= 57) ||
  (c >= 65296 && c <= 65305)
}

$X = 10
$XX = $X*$X
$Z = 100000
$ZZ = $Z*$Z

def segment(input)
  return [] if input.nil? || input.empty?
  result = []
  seg = [5100066,5000066,4900066]
  ctype = [7,7,7]
  input.unpack("U*").each do |c|
    seg.push(c)
    ctype.push(
        $re_M.call(c) ? 1 :
        $re_H.call(c) ? 2 :
        $re_I.call(c) ? 3 :
        $re_K.call(c) ? 4 :
        $re_A.call(c) ? 5 :
        $re_N.call(c) ? 6 : 7)
  end
  seg.push(0x80, 0x81, 0x82)
  ctype.push(7, 7, 7)
  word = [seg[3]]
  p1 = 9
  p2 = 9
  p3 = 9

  w1 = seg[1]
  w2 = seg[2]
  w3 = seg[3]
  w4 = seg[4]
  w5 = seg[5]
  w6 = seg[6]
  c1 = ctype[1]
  c2 = ctype[2]
  c3 = ctype[3]
  c4 = ctype[4]
  c5 = ctype[5]
  c6 = ctype[6]
  w2w3 = w2 + $Z*w3
  w3w4 = w3 + $Z*w4
  w4w5 = w4 + $Z*w5
  w1w2w3 = w1 + $Z*w2w3
  w2w3w4 = w2 + $Z*w3w4
  w3w4w5 = w3 + $Z*w4w5
  w4w5w6 = w4w5 + $ZZ*w6
  c2c3 = c2 + $X*c3
  c3c4 = c3 + $X*c4
  c4c5 = c4 + $X*c5
  c1c2c3 = c1 + $X*c2c3
  c2c3c4 = c2 + $X*c3c4
  c3c4c5 = c3 + $X*c4c5
  c4c5c6 = c4c5 + $XX*c6
  p1c1 = p1 + $X*c1
  p2c2 = p2 + $X*c2
  p3c3 = p3 + $X*c3

  i = 4
  m = seg.length - 3
  while i < m
    score = $BIAS__ +
            ($UP1__[p1] || 0) +
            ($UP2__[p2] || 0) +
            ($UP3__[p3] || 0) +
            ($BP1__[p1 + $X*p2] || 0) +
            ($BP2__[p2 + $X*p3] || 0) +
            ($UW1__[w1] || 0) +
            ($UW2__[w2] || 0) +
            ($UW3__[w3] || 0) +
            ($UW4__[w4] || 0) +
            ($UW5__[w5] || 0) +
            ($UW6__[w6] || 0) +
            ($BW1__[w2w3] || 0) +
            ($BW2__[w3w4] || 0) +
            ($BW3__[w4w5] || 0) +
            ($TW1__[w1w2w3] || 0) +
            ($TW2__[w2w3w4] || 0) +
            ($TW3__[w3w4w5] || 0) +
            ($TW4__[w4w5w6] || 0) +
            ($UC1__[c1] || 0) +
            ($UC2__[c2] || 0) +
            ($UC3__[c3] || 0) +
            ($UC4__[c4] || 0) +
            ($UC5__[c5] || 0) +
            ($UC6__[c6] || 0) +
            ($BC1__[c2c3] || 0) +
            ($BC2__[c3c4] || 0) +
            ($BC3__[c4c5] || 0) +
            ($TC1__[c1c2c3] || 0) +
            ($TC2__[c2c3c4] || 0) +
            ($TC3__[c3c4c5] || 0) +
            ($TC4__[c4c5c6] || 0) +
            ($UQ1__[p1c1] || 0) +
            ($UQ2__[p2c2] || 0) +
            ($UQ1__[p3c3] || 0) +
            ($BQ1__[p2 + $X*c2c3] || 0) +
            ($BQ2__[p2 + $X*c3c4] || 0) +
            ($BQ3__[p3 + $X*c2c3] || 0) +
            ($BQ4__[p3 + $X*c3c4] || 0) +
            ($TQ1__[p2 + $X*c1c2c3] || 0) +
            ($TQ2__[p2 + $X*c2c3c4] || 0) +
            ($TQ3__[p3 + $X*c1c2c3] || 0) +
            ($TQ4__[p3 + $X*c2c3c4] || 0)
    p = 7
    if score > 0
      result.push(word.pack("U*"))
      word = []
      p = 8
    end
    p1 = p2
    p2 = p3
    p3 = p
    word << seg[i]

    w1 = w2
    w2 = w3
    w3 = w4
    w4 = w5
    w5 = w6
    w6 = seg[i+3]
    c1 = c2
    c2 = c3
    c3 = c4
    c4 = c5
    c5 = c6
    c6 = ctype[i+3]
    w2w3 = w3w4
    w3w4 = w4w5
    w4w5 = w4 + $Z*w5
    w1w2w3 = w2w3w4
    w2w3w4 = w3w4w5
    w3w4w5 = w4w5w6
    w4w5w6 = w4w5 + $ZZ*w6
    c2c3 = c3c4
    c3c4 = c4c5
    c4c5 = c4 + $X*c5
    c1c2c3 = c2c3c4
    c2c3c4 = c3c4c5
    c3c4c5 = c4c5c6
    c4c5c6 = c4c5 + $XX*c6
    p1c1 = p2c2
    p2c2 = p3c3
    p3c3 = p3 + $X*c3

    i += 1
  end
  result.push(word.pack("U*"))

  return result
end
