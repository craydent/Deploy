#!/bin/bash
#/*/---------------------------------------------------------/*/
#/*/ Craydent LLC deploy-v0.3.1                              /*/
#/*/ Copyright 2011 (http://craydent.com/about)              /*/
#/*/ Dual licensed under the MIT or GPL Version 2 licenses.  /*/
#/*/ (http://craydent.com/license)                           /*/
#/*/---------------------------------------------------------/*/
#/*/---------------------------------------------------------/*/

# $1=>domain
echo "removing routes from $1";
sudo cproxy rm $1 "deploy_socket";
sudo cproxy rm $1 "deploy_socket2";
sudo cproxy rm $1 "deploy_joe";
sudo cproxy rm $1 "deploy_http";

exit