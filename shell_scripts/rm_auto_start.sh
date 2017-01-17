#!/usr/bin/env bash
#/*/---------------------------------------------------------/*/
#/*/ Craydent LLC deploy-v1.2.0                              /*/
#/*/ Copyright 2011 (http://craydent.com/about)              /*/
#/*/ Dual licensed under the MIT or GPL Version 2 licenses.  /*/
#/*/ (http://craydent.com/license)                           /*/
#/*/---------------------------------------------------------/*/
#/*/---------------------------------------------------------/*/
if [ -n "$(which systemctl)" ]; then
    if [ -f "/etc/systemd/system/cdeploy.service" ]; then
        rm /etc/systemd/system/cdeploy.service;
        systemctl disable nodeserver.service
    else
        echo "Auto start is not enabled";
    fi

elif [ -n "$(which chkconfig)" ]; then
    if [ -f "/etc/init.d/cdeploy" ]; then
        rm /etc/init.d/cdeploy;
        chkconfig --del cdeploy
    else
        echo "Auto start is not enabled";
    fi
elif [ -n "$(which update-rc.d)" ]; then
    if [ -f "/etc/init.d/cdeploy" ]; then
        rm /etc/init.d/cdeploy;
        sudo update-rc.d cdeploy remove
    else
        echo "Auto start is not enabled";
    fi
fi

echo "Removing cdeploy from boot.";

exit 0