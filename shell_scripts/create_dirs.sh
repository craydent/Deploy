#!/usr/bin/env bash
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
sudo mkdir -p $rootdir/craydentdeploy/git/;
sudo mkdir -p $rootdir/craydentdeploy/nodejs/;
sudo mkdir -p $rootdir/craydentdeploy/log/;
sudo mkdir -p $rootdir/craydentdeploy/backup/;
sudo mkdir -p $rootdir/craydentdeploy/key/;
#sudo mkdir -p $rootdir/scripts/;
sudo chmod -R 775 /var/craydentdeploy/;