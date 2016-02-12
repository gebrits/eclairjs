/*
 * Copyright 2016 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */




  var exampleApacheLogs = [
    "10.10.10.10 - \"FRED\" [18/Jan/2013:17:56:07 +1100] \"GET http://images.com/2013/Generic.jpg " +
      "HTTP/1.1\" 304 315 \"http://referall.com/\" \"Mozilla/4.0 (compatible; MSIE 7.0; " +
      "Windows NT 5.1; GTB7.4; .NET CLR 2.0.50727; .NET CLR 3.0.04506.30; .NET CLR 3.0.04506.648; " +
      ".NET CLR 3.5.21022; .NET CLR 3.0.4506.2152; .NET CLR 1.0.3705; .NET CLR 1.1.4322; .NET CLR " +
      "3.5.30729; Release=ARP)\" \"UD-1\" - \"image/jpeg\" \"whatever\" 0.350 \"-\" - \"\" 265 923 934 \"\" " +
      "62.24.11.25 images.com 1358492167 - Whatup",
    "10.10.10.10 - \"FRED\" [18/Jan/2013:18:02:37 +1100] \"GET http://images.com/2013/Generic.jpg " +
      "HTTP/1.1\" 304 306 \"http:/referall.com\" \"Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; " +
      "GTB7.4; .NET CLR 2.0.50727; .NET CLR 3.0.04506.30; .NET CLR 3.0.04506.648; .NET CLR " +
      "3.5.21022; .NET CLR 3.0.4506.2152; .NET CLR 1.0.3705; .NET CLR 1.1.4322; .NET CLR  " +
      "3.5.30729; Release=ARP)\" \"UD-1\" - \"image/jpeg\" \"whatever\" 0.352 \"-\" - \"\" 256 977 988 \"\" " +
      "0 73.23.2.15 images.com 1358492557 - Whatup"];



  var apacheLogRegex =
    /^([\d.]+) (\S+) (\S+) \[([\w\d:/]+\s[+\-]\d{4})\] "(.+?)" (\d{3}) ([\d\-]+) "([^"]+)" "([^"]+)"/;



function extractStats(line)
{
 var match = line.match(apacheLogRegex);
 if (match)
 {
      var bytes = 0+match[7];
      return { count:1, bytes:bytes};
  } else {
      return { count:1, bytes:0};
 }

}



function extractKey(line) {
 var match = line.match(apacheLogRegex);
 if (match)
 {
      var ip = match[1];
      var user = match[3];
      var query = match[5];
      if (user !='"-"') {
        return { ip:ip, user:user, query:query};
      }
    }
    return {ip:null, user:null, query:null};
  }


var conf = new SparkConf().setAppName("JavaScript Log Query").setMaster("local[*]");
var sparkContext = new SparkContext(conf);

var dataSet = (arguments.length == 1) ? sparkContext.textFile(arguments[0]) : sparkContext.parallelize(exampleApacheLogs);

var extracted = dataSet.mapToPair(function(line){
  return [extractKey(line),extractStats(line)];
});

 var counts = extracted.reduceByKey(function(stats1,stats2){
    return {count:stats1.count+stats2.count,bytes:stats1.bytes+stats2.bytes};
 });

var output = counts.collect();

for (var i=0;i<output.length;i++)
  print("user="+JSON.stringify(output[i][0])+"\tbytes="+output[i][1].bytes+"\tn="+output[i][1].count);


sparkContext.stop();

