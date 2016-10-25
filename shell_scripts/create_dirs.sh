#!/usr/bin/env bash
#/*/---------------------------------------------------------/*/
#/*/ Craydent LLC deploy-v0.3.2                              /*/
#/*/ Copyright 2011 (http://craydent.com/about)              /*/
#/*/ Dual licensed under the MIT or GPL Version 2 licenses.  /*/
#/*/ (http://craydent.com/license)                           /*/
#/*/---------------------------------------------------------/*/
#/*/---------------------------------------------------------/*/
# $1=>root directory
# $2=>username



uname=$2;
if [ -z "$2" ]; then
    uname='root';
fi
rootdir=$1;
if [ -z "$1" ]; then
    rootdir='/var';
fi
sudo id -u $uname &>/dev/null || sudo useradd $uname;
sudo mkdir -p $rootdir/craydent/config/;
sudo mkdir -p $rootdir/craydent/git/;
sudo mkdir -p $rootdir/craydent/nodejs/;
sudo mkdir -p $rootdir/craydent/log/;
sudo mkdir -p $rootdir/craydent/backup/;
sudo mkdir -p $rootdir/craydent/key/;
#sudo mkdir -p $rootdir/scripts/;
sudo chmod -R 775 /var/craydent/;