#!/bin/bash

# $1=>project name
# $2=>list of servers to run
# $3=>node root folder/server file path (relative node path)
# $4=>do not start

#sudo mkdir -p /var/craydentdeploy/nodejs/$1;
#cd /var/craydentdeploy/nodejs/$1;
nodedir='/var/craydentdeploy/nodejs';
process_list=(${2});
list=$(echo ${process_list[@]}|tr " " "|")
#kill node processes in process_list
echo "terminating process $1";
echo "before kill $1 $2 $3 $4 \"$list\"";
ps aux | egrep "$list".*;
ps aux | egrep "node\s$nodedir/$1/$3/($list)$".*|awk '{print $2}' | xargs kill -9
echo "$4 parameter4";
echo "after kill $1 $2 $3 $4";
if [ -z "$4" ]; then
echo "$nodedir/$1/$3/";
    logBasePath="/var/craydentdeploy/log/$1";
    mkdir -p "$logBasePath/archive";

    for i in "${process_list[@]}"; do
        cp $logBasePath/$i.log "$logBasePath/archive/$i.log.$(date +%F_%R)" &
        nohup node $nodedir/$1/$3/$i > "$logBasePath/$i.log" &
    done

    ps aux | egrep "$list".*;
fi

exit