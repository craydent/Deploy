sshkeyname="$3";
if [ -z "$3" ]; then
    sshkeyname="master_id_rsa"
fi

cd /var/craydent/git/;
ssh-agent bash -c "ssh-add /var/craydent/key/${sshkeyname}; git clone $1";
ln -s $2