#!/bin/bash
#/*/---------------------------------------------------------/*/
#/*/ Craydent LLC deploy-v1.2.0                              /*/
#/*/ Copyright 2011 (http://craydent.com/about)              /*/
#/*/ Dual licensed under the MIT or GPL Version 2 licenses.  /*/
#/*/ (http://craydent.com/license)                           /*/
#/*/---------------------------------------------------------/*/
#/*/---------------------------------------------------------/*/

# $1=>domain
echo "removing routes from $1";
cproxy rm $1 "deploy_socket";
cproxy rm $1 "deploy_socket2";
cproxy rm $1 "deploy_joe";
cproxy rm $1 "deploy_http";

exit 0