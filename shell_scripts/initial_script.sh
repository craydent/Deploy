#!/bin/bash
#/*/---------------------------------------------------------/*/
#/*/ Craydent LLC deploy-v1.2.0                              /*/
#/*/ Copyright 2011 (http://craydent.com/about)              /*/
#/*/ Dual licensed under the MIT or GPL Version 2 licenses.  /*/
#/*/ (http://craydent.com/license)                           /*/
#/*/---------------------------------------------------------/*/
#/*/---------------------------------------------------------/*/

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
email=$1;
if [ -z "$1" ]; then
    email='';
fi
./create_dirs.sh $2 $3;

cd /var/craydent/key/;

ssh-keygen -t rsa -C "$email" -N '' -f /var/craydent/key/master_id_rsa;

sudo chown -R $uname /var/craydent/;

exit 0;