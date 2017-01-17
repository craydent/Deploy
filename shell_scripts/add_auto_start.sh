#!/usr/bin/env bash
#/*/---------------------------------------------------------/*/
#/*/ Craydent LLC deploy-v1.2.0                              /*/
#/*/ Copyright 2011 (http://craydent.com/about)              /*/
#/*/ Dual licensed under the MIT or GPL Version 2 licenses.  /*/
#/*/ (http://craydent.com/license)                           /*/
#/*/---------------------------------------------------------/*/
#/*/---------------------------------------------------------/*/
if [ -n "$(which systemctl)" ]; then
    if [ ! -f "/etc/systemd/system/cdeploy.service" ]; then
        cp $1/cdeploy.service /etc/systemd/system/cdeploy.service;
        systemctl enable nodeserver.service;
        systemctl status nodeserver.service;
    else
        echo "Autostart is already enable.";
    fi

elif [ -n "$(which chkconfig)" ]; then
    if [ ! -f "/etc/init.d/cdeploy" ]; then
        cp $1/cdeploy /etc/init.d/cdeploy;
        chmod a+x /etc/init.d/cdeploy;
        chkconfig --add cdeploy;
    else
        echo "Autostart is already enable.";
    fi
elif [ -n "$(which update-rc.d)" ]; then
    if [ ! -f "/etc/init.d/cdeploy" ]; then
        cp $1/cdeploy /etc/init.d/cdeploy;
        chmod a+x /etc/init.d/cdeploy;
        update-rc.d cdeploy defaults;
    else
        echo "Autostart is already enable.";
    fi
fi

echo "Added cdeploy to boot.";

exit 0