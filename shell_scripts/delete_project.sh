#!/usr/bin/env bash
#/*/ Craydent LLC deploy-v1.2.0                              /*/
#/*/ Copyright 2011 (http://craydent.com/about)              /*/
#/*/ Dual licensed under the MIT or GPL Version 2 licenses.  /*/
#/*/ (http://craydent.com/license)                           /*/
#/*/---------------------------------------------------------/*/
#/*/---------------------------------------------------------/*/
# $1=>project
# $2=>project path



projectname=$1;
if [ -z "$1" ]; then
    echo "A project name must be provided.";
    exit;
fi
path=$2;
if [ -z "$2" ]; then
    path='/var/craydent/';
fi
echo 'removing config files:';
rm -rf ${path}config/${projectname};
echo 'removing git files:';
rm -rf ${path}git/${projectname};
echo 'removing node files:';
rm -rf ${path}nodejs/${projectname};
echo 'removing log files:';
rm -rf ${path}log/${projectname};

exit 0