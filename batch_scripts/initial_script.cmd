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
sudo mkdir -p $rootdir/craydent/git/;
sudo mkdir -p $rootdir/craydent/log/;
sudo mkdir -p $rootdir/craydent/backup/;
sudo mkdir -p $rootdir/craydent/key/;
#sudo mkdir -p $rootdir/scripts/;
sudo chmod -R 775 /var/craydent/;

cd /var/craydent/key/;

ssh-keygen -t rsa -C "$1" -N '' -f /var/craydent/key/master_id_rsa;

sudo chown -R $uname /var/craydent/;
