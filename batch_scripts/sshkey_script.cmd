#!/bin/bash

# $1=>project name
# $2=>email address

if [ -z "$1" ]; then
    echo "You must provide a name";
    exit 1;
fi
if [ -z "$2" ]; then
    echo "You must provide an email address";
    exit 1;
fi

ssh-keygen -t rsa -C "$2" -N '' -f /var/craydentdeploy/key/$1;

exit 0;