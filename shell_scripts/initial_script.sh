#!/bin/bash

# $1=>email address
# $2=>root directory
# $3=>username



uname=$3;
if [ -z "$3" ]; then
    uname='root';
fi
rootdir=$2;
if [ -z "$2" ]; then
    rootdir='/var';
fi
sudo id -u $uname &>/dev/null || sudo useradd $uname;
sudo mkdir -p $rootdir/craydentdeploy/git/;
sudo mkdir -p $rootdir/craydentdeploy/log/;
sudo mkdir -p $rootdir/craydentdeploy/backup/;
sudo mkdir -p $rootdir/craydentdeploy/key/;
#sudo mkdir -p $rootdir/scripts/;
sudo chmod -R 775 /var/craydentdeploy/;

cd /var/craydentdeploy/key/;

ssh-keygen -t rsa -C "$1" -N '' -f /var/craydentdeploy/key/master_id_rsa;

sudo chown -R $uname /var/craydentdeploy/;
