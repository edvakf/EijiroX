#!/usr/bin/ruby -Ku
# -*- coding: utf-8 -*-
# to converts EIJIRO dictionaries to a database
# 1. download sqlite.exe and put it into the same folder
# 2. put EIJI-***.TXT and others into the same folder
# 3. execute makedatabase.exe
#
# to create makedatabase.exe
# 1. install Ruby 1.8.6 (MSWIN32)
# 2. install exerb http://exerb.sourceforge.jp/#download
# 3. mkexy makedatabase.rb # creates makedatabase.exy
# 4. exerb makedatabase.exy # creates makedatabase.exe


require 'kconv'
require 'tiny_segmenter_mod' # imports segment

$\ = "\r\n" # output separater: print writes this at the end
$, = "\r\n" # default argument to String#join

$common_tokens = [
  "of","the","する","to","in","人","的","ない","for","one","on","and","いる","こと",
  "with","ある","から","someone","など","れる","ます","have","that","者","is","from",
  "性","発音","カタカナ","よう","you","an","at","その","it","by","なる","up","です",
  "as","ため","まし","out","私","system","せる","この","彼","time","get","be","make",
  "もの","中","into","about","high","this"
]

$re_sep = /[^一-龠々〆ヵヶぁ-んァ-ヴーｱ-ﾝﾞｰa-zA-Zａ-ｚＡ-Ｚ0-9０-９]+/
$re_kanji = /[一-龠々〆ヵヶ]/

def tokenize(str) 
  segment(str).
  map {|s| s.gsub($re_sep, '')}.
  uniq.
  delete_if {|s| s.empty?}
end

$re_singlequote = /'/
def sqlstr(str)
  "'#{str.gsub($re_singlequote,"''")}'"
end

up   = 'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ'
down = 'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚαβγδεζηθικλμνξοπρστυφχψω'
$re_up = Regexp.new('['+up+']')
$updown = {}
up.split(//).each_with_index do |c, i|
  $updown[c] = down.split(//)[i]
end

# JavaScript's toLowerCase is Unicode aware
def tolowercase(str)
  str.downcase.gsub($re_up){|c| $updown[c]}
end

# match Chrome's SHIFT_JIS-to-Unicode conversion table
def normalize(str)
  str.
  gsub("〜", "～"). # \u301C -> \uFF5E
  gsub("£", "￡"). # \u00A3 -> \uFFE1
  gsub("−", "－"). # \u2212 -> \uFF0D
  gsub("—", "―"). # \u2014 -> \u2015
  gsub("¢", "￠"). # \u00a2 -> \uFFE0
  gsub('‾','￣') # \u203e -> \uffe3

end

files = {
  :eiji => { :regexp => /^EIJI-.*\.TXT/i , :store_entry => true},
  :waei => { :regexp => /^WAEI-.*\.TXT/i , :store_entry => true},
  :reiji => { :regexp => /^REIJI.*\.TXT/i , :store_entry => false},
  :ryaku => { :regexp => /^RYAKU.*\.TXT/i , :store_entry => true}
}


Dir.foreach('.') do |file|
  files.each_value do |o|
    if o[:regexp] =~ file
      o[:file] = file
    end
  end
end

puts "making dictionary.sql"

sqlfile = open('dictionary.sql', 'w')

sqlfile.print "PRAGMA auto_vacuum = 2;"
sqlfile.print "BEGIN TRANSACTION;"
sqlfile.print "CREATE TABLE __WebKitDatabaseInfoTable__ (key TEXT NOT NULL ON CONFLICT FAIL UNIQUE ON CONFLICT REPLACE,value TEXT NOT NULL ON CONFLICT FAIL);"
sqlfile.print "INSERT INTO __WebKitDatabaseInfoTable__ VALUES('WebKitDatabaseVersionKey','1.0');"
sqlfile.print "CREATE TABLE eijiro (id INTEGER PRIMARY KEY, entry TEXT, raw TEXT);"
sqlfile.print "CREATE TABLE invindex (token TEXT, id INTEGER);"


tokens = {}
num = 0
sql_lines = []

[:eiji, :ryaku, :waei, :reiji].each do |name|
  next if files[name][:file].nil?

  open(files[name][:file], 'r') do |f|
    puts "opening #{files[name][:file]}"

    while line = f.gets
      line = normalize(Kconv.kconv(line, Kconv::UTF8, Kconv::SJIS))
      if line =~ /■(.*?)(?:  ?\{.*?\})? : /
        num += 1
        entry = $1
        raw = line.chop
        sql_lines.push "INSERT INTO eijiro VALUES (#{num},#{files[name][:store_entry] ? sqlstr(tolowercase(entry)) : "NULL"},#{sqlstr(raw)});"

        if num % 20000 == 0
          sqlfile.print sql_lines.join
          sql_lines = []
          puts "#{num} lines processed" 
        end

        tokenize(tolowercase(entry)).each do |token|
          tokens[token] = [] if tokens[token].nil?
          tokens[token].push(num)
        end
      end
    end

    sqlfile.print sql_lines.join
    sql_lines = []
  end
end

puts "writing out inverted index"

num = 0
tokens.sort{|a,b|
  a[0] <=> b[0]
}.each{|token,ids|
  next if (token.split(//).size === 1 && $re_kanji !~ token) || $common_tokens.include?(token)
  ids.each do |id|
    sql_lines.push "INSERT INTO invindex VALUES(#{sqlstr(token)},#{id});"
    num += 1

    if num % 100000 == 0
      sqlfile.print sql_lines.join
      sql_lines = []
      puts "#{num} tokens processed"
    end
  end
}
sqlfile.print sql_lines.join
sql_lines = []

tokens = nil # release

sqlfile.print "CREATE INDEX eijiro_i ON eijiro (entry);"
sqlfile.print "CREATE INDEX invindex_i ON invindex (token);"
sqlfile.print "END TRANSACTION;"

sqlfile.close

puts "making database"
database = "database"

if defined? ExerbRuntime
  dir = File.dirname(ExerbRuntime.filepath())
  Dir::chdir(dir)
end

File.delete database if File.exists? database

sqlite = (RUBY_PLATFORM =~ /mswin|cygwin|mingw/) ? "./sqlite3.exe" : "sqlite"
command = %!#{sqlite} #{database} ".read dictionary.sql"!
puts command
system(command)
puts "Done. Press enter to close."

while l = gets
  exit 0
end
