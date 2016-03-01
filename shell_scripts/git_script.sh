sshkeyname="$2";
if [ -z "$2" ]; then
    sshkeyname="master_id_rsa"
fi
echo $sshkeyname;
cd /var/craydentdeploy/git/;
ssh-agent bash -c "ssh-add /var/craydentdeploy/key/${sshkeyname}; git clone $1";