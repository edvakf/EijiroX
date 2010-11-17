#!/usr/bin/python
# -*- coding: utf-8 -*-
import sqlite3
import collections

#path = "/cygdrive/c/Users/atsushi/AppData/Local/Google/Chrome/User Data/Default/databases/chrome-extension_igchbgllbcppipoalfnjoepildadhkll_0/4"
path = "C:\\Users\\atsushi\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\databases\\chrome-extension_igchbgllbcppipoalfnjoepildadhkll_0\\4"
conn = sqlite3.connect(path)
tokens = collections.Counter()

c = conn.cursor()
c.execute('SELECT token FROM invindex ;')
n = 0
for row in c:
  token = row[0]
  tokens[token] += 1
  n += 1
print(n)

f = open('output.txt', 'w', encoding='utf-8')
for token, times in tokens.most_common(100000):
  f.write(token + '\t' + str(times) + '\n')

f.close()
