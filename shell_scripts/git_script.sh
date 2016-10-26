#/*/---------------------------------------------------------/*/
#/*/ Craydent LLC deploy-v1.0.0                              /*/
#/*/ Copyright 2011 (http://craydent.com/about)              /*/
#/*/ Dual licensed under the MIT or GPL Version 2 licenses.  /*/
#/*/ (http://craydent.com/license)                           /*/
#/*/---------------------------------------------------------/*/
#/*/---------------------------------------------------------/*/

sshkeyname="$3";
if [ -z "$3" ]; then
    sshkeyname="master_id_rsa"
fi

cd /var/craydent/git/;
ssh-agent bash -c "ssh-add /var/craydent/key/${sshkeyname}; git clone $1";
ln -s $2