#!/bin/bash

# $1=>project name
# $2=>list of servers to run
# $3=>node root folder/server file path
# $4=>do not start

sudo mkdir -p /var/craydentdeploy/git/$1;
cd /var/craydentdeploy/git/$1;
process_list=(${2});
list=$(echo ${process_list[@]}|tr " " "|")
echo $list;
#kill node processes in process_list
sudo ps aux | egrep "$list".*|awk '{print $2}' | xargs kill -9

if [ -z "$4" ]; then
    logBasePath="/var/craydentdeploy/log/$1";
    sudo mkdir -p "$logBasePath/archive";

    for i in "${process_list[@]}"; do
        cp $logBasePath/$i.log "$logBasePath/archive/$i.log.$(date +%F_%R)" &
        nohup node /var/craydentdeploy/git/$1/$3/$i > "$logBasePath/$i.log" &
    done

    ps aux | egrep "$list".*;
fi

exit